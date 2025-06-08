-- 1. Function to sync world_players on game_players changes
CREATE OR REPLACE FUNCTION sync_world_players_on_game_player_change()
RETURNS TRIGGER AS $$
DECLARE
  game_world_id uuid;
BEGIN
  -- Get the world_id for the game
  SELECT world_id INTO game_world_id FROM games WHERE id = COALESCE(NEW.game_id, OLD.game_id);

  IF TG_OP = 'INSERT' THEN
    IF game_world_id IS NOT NULL THEN
      INSERT INTO world_players (user_id, world_id, role, created_at)
      VALUES (NEW.user_id, game_world_id, NEW.role, now())
      ON CONFLICT (user_id, world_id) DO UPDATE SET role = EXCLUDED.role;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    IF game_world_id IS NOT NULL THEN
      UPDATE world_players
      SET role = NEW.role
      WHERE user_id = NEW.user_id AND world_id = game_world_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    IF game_world_id IS NOT NULL THEN
      DELETE FROM world_players WHERE user_id = OLD.user_id AND world_id = game_world_id;
    END IF;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 2. Attach trigger to game_players
DROP TRIGGER IF EXISTS trg_sync_world_players_on_game_players ON game_players;
CREATE TRIGGER trg_sync_world_players_on_game_players
AFTER INSERT OR UPDATE OR DELETE ON game_players
FOR EACH ROW EXECUTE FUNCTION sync_world_players_on_game_player_change();

-- 3. Function to sync world_players on games.world_id change
CREATE OR REPLACE FUNCTION sync_world_players_on_game_world_id_change()
RETURNS TRIGGER AS $$
DECLARE
  player RECORD;
BEGIN
  -- Remove old world_players for this game's players and old world_id
  IF OLD.world_id IS NOT NULL THEN
    FOR player IN SELECT user_id FROM game_players WHERE game_id = OLD.id LOOP
      DELETE FROM world_players WHERE user_id = player.user_id AND world_id = OLD.world_id;
    END LOOP;
  END IF;

  -- Add new world_players for this game's players and new world_id
  IF NEW.world_id IS NOT NULL THEN
    FOR player IN SELECT user_id, role FROM game_players WHERE game_id = NEW.id LOOP
      INSERT INTO world_players (user_id, world_id, role, created_at)
      VALUES (player.user_id, NEW.world_id, player.role, now())
      ON CONFLICT (user_id, world_id) DO UPDATE SET role = EXCLUDED.role;
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Attach trigger to games
DROP TRIGGER IF EXISTS trg_sync_world_players_on_games_world_id ON games;
CREATE TRIGGER trg_sync_world_players_on_games_world_id
AFTER UPDATE OF world_id ON games
FOR EACH ROW EXECUTE FUNCTION sync_world_players_on_game_world_id_change();
