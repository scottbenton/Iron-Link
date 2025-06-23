set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.player_role_to_world_player_role(player_role text)
 RETURNS text
 LANGUAGE plpgsql
AS $function$BEGIN
  IF player_role = 'guide' THEN
    RETURN 'guide'::public.world_player_role;
  ELSIF player_role = 'player' THEN
    RETURN 'player'::public.world_player_role;
  ELSE
    RETURN 'player'::public.world_player_role; -- or raise an exception if you want
  END IF;
END;$function$
;

CREATE OR REPLACE FUNCTION public.sync_world_players_on_game_player_change()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$DECLARE
  game_world_id uuid;
BEGIN
  -- Get the world_id for the game
  SELECT world_id INTO game_world_id FROM games WHERE id = COALESCE(NEW.game_id, OLD.game_id);

  IF TG_OP = 'INSERT' THEN
    IF game_world_id IS NOT NULL THEN
      INSERT INTO world_players (user_id, world_id, role, created_at, game_id)
      VALUES (NEW.user_id, game_world_id, player_role_to_world_player_role(NEW.role::text)::public.world_player_role, now(), NEW.game_id)
      ON CONFLICT (user_id, world_id) DO UPDATE SET role = EXCLUDED.role;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    IF game_world_id IS NOT NULL THEN
      UPDATE world_players
      SET role = player_role_to_world_player_role(NEW.role::text)::public.world_player_role
      WHERE user_id = NEW.user_id AND world_id = game_world_id AND game_id=NEW.game_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    IF game_world_id IS NOT NULL THEN
      DELETE FROM world_players WHERE user_id = OLD.user_id AND world_id = game_world_id AND game_id = NEW.game_id;
    END IF;
    RETURN OLD;
  END IF;
END;$function$
;

CREATE OR REPLACE FUNCTION public.sync_world_players_on_game_world_id_change()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$DECLARE
  player RECORD;
BEGIN
  -- Remove old world_players for this game's players and old world_id
  IF OLD.world_id IS NOT NULL THEN
    FOR player IN SELECT user_id FROM game_players WHERE game_id = OLD.id LOOP
      DELETE FROM world_players WHERE user_id = player.user_id AND world_id = OLD.world_id AND game_id = OLD.id;
    END LOOP;
  END IF;

  -- Add new world_players for this game's players and new world_id
  IF NEW.world_id IS NOT NULL THEN
    FOR player IN SELECT user_id, role FROM game_players WHERE game_id = NEW.id LOOP
      INSERT INTO world_players (user_id, world_id, role, created_at, game_id)
      VALUES (player.user_id, NEW.world_id, player_role_to_world_player_role(player.role::text)::public.world_player_role, now(), NEW.id);
    END LOOP;
  END IF;

  RETURN NEW;
END;$function$
;


