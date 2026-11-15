-- Shared Starforged connections (#238).
--
-- By the rules a connection can be shared by allies ("Any allies who share
-- this connection also mark the reward"), or be one character's alone. So a
-- connection is now its own row, holding the rank, the progress track and
-- whether it has become a bond, and the characters who share it are its
-- world_entry_bonds rows of kind 'connection' (one, while it is individual).
-- A game can have several connections with one entry; a character belongs to
-- at most one of them. Ironlands bonds are unchanged.
--
-- 1. world_entry_connections, one for each per-character connection row.
-- 2. world_entry_bonds: connection rows point at their connection and lose
--    rank, completed_ticks and bonded.
-- 3. Guards: a connection only in a category with bonds, for a game linked to
--    the entry's world, never moving; a member only of its own game's
--    connection for that entry; the last member leaving removes it.
-- 4. RLS: reading needs the entry; making one needs the right to edit a
--    character in its game; changing one needs the right to edit a character
--    who shares it. create_world_entry_connection makes a connection and its
--    first member together.
begin;

-- ---------------------------------------------------------------------------
-- 1. Connections
-- ---------------------------------------------------------------------------

create table public.world_entry_connections (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references public.world_entries(id) on delete cascade,
  game_id uuid not null references public.games(id) on delete cascade,
  world_id uuid not null references public.worlds(id) on delete cascade,
  rank public.progress_track_difficulty not null,
  completed_ticks smallint not null default 0
    constraint world_entry_connections_ticks_check check (completed_ticks between 0 and 40),
  bonded boolean not null default false,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create index world_entry_connections_entry_id_idx on public.world_entry_connections(entry_id);
create index world_entry_connections_game_id_idx on public.world_entry_connections(game_id);
create index world_entry_connections_world_id_idx on public.world_entry_connections(world_id);

alter table public.world_entry_connections enable row level security;
alter table public.world_entry_connections replica identity full;
alter publication supabase_realtime add table public.world_entry_connections;

grant select, insert, update on public.world_entry_connections to authenticated;

-- Each per-character connection becomes a connection of its own, keyed for
-- the moment by its character so the members can find it below.
alter table public.world_entry_connections add column migrated_character_id uuid;
insert into public.world_entry_connections(entry_id, game_id, world_id, rank, completed_ticks, bonded, migrated_character_id)
  select b.entry_id, ch.game_id, b.world_id, b.rank, b.completed_ticks, b.bonded, b.character_id
  from public.world_entry_bonds b
  join public.characters ch on ch.id = b.character_id
  where b.kind = 'connection';

-- ---------------------------------------------------------------------------
-- 2. Members
-- ---------------------------------------------------------------------------

alter table public.world_entry_bonds
  add column connection_id uuid references public.world_entry_connections(id) on delete cascade;

update public.world_entry_bonds b set connection_id = c.id
  from public.world_entry_connections c
  where b.kind = 'connection' and c.entry_id = b.entry_id
    and c.migrated_character_id = b.character_id;
alter table public.world_entry_connections drop column migrated_character_id;

alter table public.world_entry_bonds
  drop constraint world_entry_bonds_shape_check,
  drop column rank,
  drop column completed_ticks,
  drop column bonded,
  -- An Ironlands bond is only the link; a connection's member names it.
  add constraint world_entry_bonds_shape_check check (
    (kind = 'bond' and connection_id is null)
    or (kind = 'connection' and connection_id is not null));

create index world_entry_bonds_connection_id_idx on public.world_entry_bonds(connection_id);

-- ---------------------------------------------------------------------------
-- 3. Guards
-- ---------------------------------------------------------------------------

-- Bonds: as before, and a member joins only a connection of its own game with
-- the same entry, and never moves to another.
create or replace function public.world_entry_bond_check() returns trigger
language plpgsql security definer set search_path = '' as $$
declare v_entry public.world_entries;
begin
  if tg_op = 'UPDATE' then
    if new.entry_id <> old.entry_id or new.character_id <> old.character_id
      or new.world_id <> old.world_id or new.kind <> old.kind
      or new.connection_id is distinct from old.connection_id then
      raise exception 'A bond cannot move to another entry, character or kind'
        using errcode = '23514', hint = 'invalid_bond';
    end if;
    new.updated_at := now();
    return new;
  end if;

  select * into v_entry from public.world_entries where id = new.entry_id;
  new.world_id := v_entry.world_id;
  if not coalesce((select (c->>'supports_bonds')::boolean
    from public.get_world_effective_categories(v_entry.world_id) c
    where (c->>'id')::uuid = v_entry.category_id), false) then
    raise exception 'This category does not have bonds'
      using errcode = '23514', hint = 'bonds_not_supported';
  end if;
  if not exists (select 1 from public.characters ch
    join public.games g on g.id = ch.game_id
    where ch.id = new.character_id and g.world_id = v_entry.world_id) then
    raise exception 'Only characters in a game linked to this world can bond with its entries'
      using errcode = '23514', hint = 'character_not_in_world';
  end if;
  if new.connection_id is not null and not exists (
    select 1 from public.world_entry_connections c
    join public.characters ch on ch.game_id = c.game_id
    where c.id = new.connection_id and c.entry_id = new.entry_id
      and ch.id = new.character_id) then
    raise exception 'A character can only share a connection of its own game with this entry'
      using errcode = '23514', hint = 'invalid_connection';
  end if;
  return new;
end $$;

create function public.world_entry_connection_check() returns trigger
language plpgsql security definer set search_path = '' as $$
declare v_entry public.world_entries;
begin
  if tg_op = 'UPDATE' then
    if new.entry_id <> old.entry_id or new.game_id <> old.game_id
      or new.world_id <> old.world_id then
      raise exception 'A connection cannot move to another entry or game'
        using errcode = '23514', hint = 'invalid_connection';
    end if;
    new.updated_at := now();
    return new;
  end if;

  select * into v_entry from public.world_entries where id = new.entry_id;
  new.world_id := v_entry.world_id;
  if not coalesce((select (c->>'supports_bonds')::boolean
    from public.get_world_effective_categories(v_entry.world_id) c
    where (c->>'id')::uuid = v_entry.category_id), false) then
    raise exception 'This category does not have bonds'
      using errcode = '23514', hint = 'bonds_not_supported';
  end if;
  if not exists (select 1 from public.games g
    where g.id = new.game_id and g.world_id = v_entry.world_id) then
    raise exception 'Only games linked to this world can make connections with its entries'
      using errcode = '23514', hint = 'character_not_in_world';
  end if;
  return new;
end $$;

create trigger world_entry_connections_check before insert or update on public.world_entry_connections
  for each row execute function public.world_entry_connection_check();

-- The last character leaving a connection takes it with them.
create function public.world_entry_connection_cleanup() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if old.connection_id is not null and not exists (
    select 1 from public.world_entry_bonds where connection_id = old.connection_id) then
    delete from public.world_entry_connections where id = old.connection_id;
  end if;
  return null;
end $$;

create trigger world_entry_bonds_connection_cleanup after delete on public.world_entry_bonds
  for each row execute function public.world_entry_connection_cleanup();

revoke all on function public.world_entry_connection_check() from public, anon, authenticated;
revoke all on function public.world_entry_connection_cleanup() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 4. RLS
-- ---------------------------------------------------------------------------
-- The world_entries subqueries are filtered by the entry read policy.

create policy "World entry connections follow their entry for reads"
on public.world_entry_connections for select to authenticated
using (exists (select 1 from public.world_entries we where we.id = world_entry_connections.entry_id));

create policy "Character editors in a game can make its connections"
on public.world_entry_connections for insert to authenticated
with check (
  exists (select 1 from public.world_entries we where we.id = world_entry_connections.entry_id)
  and exists (select 1 from public.characters ch
    where ch.game_id = world_entry_connections.game_id
      and public.can_edit_character(ch.id, ( select auth.uid() ))));

create policy "Editors of a sharing character can change a connection"
on public.world_entry_connections for update to authenticated
using (
  exists (select 1 from public.world_entries we where we.id = world_entry_connections.entry_id)
  and exists (select 1 from public.world_entry_bonds b
    where b.connection_id = world_entry_connections.id
      and public.can_edit_character(b.character_id, ( select auth.uid() ))))
with check (
  exists (select 1 from public.world_entries we where we.id = world_entry_connections.entry_id)
  and exists (select 1 from public.world_entry_bonds b
    where b.connection_id = world_entry_connections.id
      and public.can_edit_character(b.character_id, ( select auth.uid() ))));

-- Makes a connection with an entry for one character, in one step, so a
-- connection never exists without a member. Runs as the caller, so the
-- policies above decide.
create function public.create_world_entry_connection(
  p_entry_id uuid,
  p_character_id uuid,
  p_rank public.progress_track_difficulty
) returns uuid
language plpgsql security invoker set search_path = '' as $$
declare v_game_id uuid; v_connection_id uuid;
begin
  select game_id into v_game_id from public.characters where id = p_character_id;
  if v_game_id is null then
    raise exception 'Character not found' using errcode = 'P0002';
  end if;
  insert into public.world_entry_connections(entry_id, game_id, rank)
    values (p_entry_id, v_game_id, p_rank)
    returning id into v_connection_id;
  insert into public.world_entry_bonds(entry_id, character_id, kind, connection_id)
    values (p_entry_id, p_character_id, 'connection', v_connection_id);
  return v_connection_id;
end $$;

revoke all on function public.create_world_entry_connection(uuid, uuid, public.progress_track_difficulty) from public, anon;
grant execute on function public.create_world_entry_connection(uuid, uuid, public.progress_track_difficulty) to authenticated;

commit;
