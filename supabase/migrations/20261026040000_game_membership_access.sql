-- Game membership and roles are no longer self-service.
--
-- game_players rows and games.game_type decide who is a game's Guide, and
-- world_role(), the notes and game_logs policies and character permissions all
-- trust them. Until now clients could write them freely:
--   * the game_players insert policy only checked user_id = auth.uid(), so
--     anyone could join any game, as a Guide if they liked;
--   * the game_players update policy let a member rewrite their own row, so a
--     player could make themselves Guide or move the row (game_id) into any
--     other game, and a Guide could move rows between games or users;
--   * the games update policy let any member change game_type, and in solo and
--     co-op games every member counts as a Guide.
--
-- The new rules:
--   * Joining an existing game goes through the invite edge function, which
--     uses the service role. A client may only add its own first row to a game
--     it created that has no members yet. games.created_by records the creator
--     (filled by its default); games created before this have none, so nobody
--     can add themselves to them, and a game whose members all left cannot be
--     claimed by someone else.
--   * A membership row never changes game or user. Only a Guide of the game
--     (a 'guide' row, or any member of a solo or co-op game) changes roles,
--     except that a member may make themselves Guide while the game has no
--     Guide: that is how the creator of a guided game, who joins as a player,
--     takes the Guide role.
--   * Only a Guide of the game changes its type, judged by the type it has
--     before the change. Changing type first resets every member's role and
--     then sets game_type, so a co-op member who has just made everyone a
--     player can still finish switching the game to guided.
--
-- Row level security cannot compare a row with its previous version, so the
-- update rules are BEFORE UPDATE triggers. They run with the caller's
-- privileges and step aside for roles that bypass row level security: postgres
-- and the service role, and so also foreign key actions and SECURITY DEFINER
-- functions, which run as the table or function owner. Those are the same
-- callers the policies they extend leave alone.
--
-- games.created_by is not granted to clients, like games.world_id: clients can
-- neither set it on insert nor change it later, while the default still fills
-- it and the foreign key's ON DELETE SET NULL keeps working.
begin;

-- Added without a default first so existing games are left without a creator
-- whatever session runs the migration.
alter table public.games add column created_by uuid;
alter table public.games alter column created_by set default auth.uid();

alter table public.games add constraint games_created_by_fkey
  foreign key (created_by) references public.users(id) on update cascade on delete set null;

create index games_created_by_idx on public.games using btree (created_by);

-- The Guide check itself is public.is_game_guide() from the room keys
-- migration: a 'guide' row, or any member of a solo or co-op game.

-- Whether any member of the game holds the 'guide' role.
create function public.game_has_guide(p_game_id uuid)
 returns boolean
 language sql
 stable
 security definer
 set search_path to ''
as $function$
    select exists (
        select 1
        from public.game_players gp
        where gp.game_id = p_game_id
          and gp.role::text = 'guide'
    );
$function$;

-- Whether the user created the game and nobody has joined it yet. SECURITY
-- DEFINER so that the check sees every membership row whatever the select
-- policies allow.
create function public.is_new_game_creator(p_game_id uuid, p_user_id uuid)
 returns boolean
 language sql
 stable
 security definer
 set search_path to ''
as $function$
    select exists (
        select 1 from public.games g
        where g.id = p_game_id and g.created_by = p_user_id
    )
    and not exists (
        select 1 from public.game_players gp where gp.game_id = p_game_id
    );
$function$;

revoke execute on function public.game_has_guide(uuid) from public;
revoke execute on function public.game_has_guide(uuid) from anon;
grant execute on function public.game_has_guide(uuid) to authenticated;
grant execute on function public.game_has_guide(uuid) to service_role;

revoke execute on function public.is_new_game_creator(uuid, uuid) from public;
revoke execute on function public.is_new_game_creator(uuid, uuid) from anon;
grant execute on function public.is_new_game_creator(uuid, uuid) to authenticated;
grant execute on function public.is_new_game_creator(uuid, uuid) to service_role;

-- Games are created by the signed-in user. created_by can only come from its
-- default, since clients hold no insert privilege on the column.
drop policy "Enable insert for authenticated users only" on public.games;

create policy "Users create their own games"
on public.games
as permissive
for insert
to authenticated
with check (created_by = (select auth.uid()));

-- A creator adds their own first row to their new game. Everyone else joins
-- through the invite edge function.
drop policy "Enable insert for users based on user_id" on public.game_players;

create policy "Game creators join their new game"
on public.game_players
as permissive
for insert
to authenticated
with check (
    user_id = (select auth.uid())
    and public.is_new_game_creator(game_id, (select auth.uid()))
);

create function public.game_players_guard_update()
 returns trigger
 language plpgsql
 set search_path to ''
as $function$
begin
    if (select r.rolbypassrls from pg_catalog.pg_roles r where r.rolname = current_user) then
        return new;
    end if;

    if new.game_id is distinct from old.game_id or new.user_id is distinct from old.user_id then
        raise exception 'A game membership cannot move to another game or user'
          using errcode = '42501';
    end if;

    -- The Guide check reads the game's type, which a type change only updates
    -- after the roles, so it holds while a Guide resets every member's role
    -- (their own row included) in one statement.
    if new.role is distinct from old.role
       and not public.is_game_guide(old.game_id, auth.uid())
       and not (
           old.user_id = auth.uid()
           and new.role::text = 'guide'
           and not public.game_has_guide(old.game_id)
       ) then
        raise exception 'Only a Guide can change roles in this game'
          using errcode = '42501';
    end if;

    return new;
end;
$function$;

create trigger game_players_guard_update before update on public.game_players
  for each row execute function public.game_players_guard_update();

create function public.games_guard_update()
 returns trigger
 language plpgsql
 set search_path to ''
as $function$
begin
    if (select r.rolbypassrls from pg_catalog.pg_roles r where r.rolname = current_user) then
        return new;
    end if;

    if new.created_by is distinct from old.created_by then
        raise exception 'A game''s creator cannot change' using errcode = '42501';
    end if;

    -- Judged by the type before the change: any member may switch a solo or
    -- co-op game, only a Guide may switch a guided one.
    if new.game_type is distinct from old.game_type and not exists (
        select 1
        from public.game_players gp
        where gp.game_id = old.id
          and gp.user_id = auth.uid()
          and (gp.role::text = 'guide' or old.game_type::text in ('solo', 'co-op'))
    ) then
        raise exception 'Only a Guide can change the game type' using errcode = '42501';
    end if;

    return new;
end;
$function$;

create trigger games_guard_update before update on public.games
  for each row execute function public.games_guard_update();

revoke all on function public.game_players_guard_update() from public, anon, authenticated;
revoke all on function public.games_guard_update() from public, anon, authenticated;

commit;
