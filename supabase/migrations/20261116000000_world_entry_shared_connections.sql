-- Starforged connections as their own rows, one character's or the party's
-- (#238).
--
-- By the rules a connection can be shared by allies ("Any allies who share
-- this connection also mark the reward"), or be one character's alone. Here a
-- connection is either one character's or shared by the whole party: every
-- character in its game, including characters who join later. So a connection
-- is its own row, holding the rank, the progress track and whether it has
-- become a bond, and world_entry_bonds keeps only Ironlands bonds.
--
-- 1. world_entry_connections, one for each per-character connection row.
-- 2. world_entry_bonds loses kind, rank, completed_ticks and bonded.
-- 3. Guards: a connection only in a category with bonds, for a game linked to
--    the entry's world, never moving to another entry or game; a character's
--    connection only for a character of its game; per entry and game, either
--    one party connection or one connection per character, never both.
-- 4. RLS: reading needs the entry; making, changing or removing one needs the
--    right to edit its character, or for a party connection a character in
--    its game. Sharing with the party and taking it back are updates of
--    character_id, checked on both sides.
begin;

-- ---------------------------------------------------------------------------
-- 1. Connections
-- ---------------------------------------------------------------------------

create table public.world_entry_connections (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references public.world_entries(id) on delete cascade,
  game_id uuid not null references public.games(id) on delete cascade,
  -- Null: shared by the whole party of the game.
  character_id uuid references public.characters(id) on delete cascade,
  world_id uuid not null references public.worlds(id) on delete cascade,
  rank public.progress_track_difficulty not null,
  completed_ticks smallint not null default 0
    constraint world_entry_connections_ticks_check check (completed_ticks between 0 and 40),
  bonded boolean not null default false,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create unique index world_entry_connections_party_key
  on public.world_entry_connections(entry_id, game_id) where character_id is null;
create unique index world_entry_connections_character_key
  on public.world_entry_connections(entry_id, character_id) where character_id is not null;
create index world_entry_connections_game_id_idx on public.world_entry_connections(game_id);
create index world_entry_connections_character_id_idx on public.world_entry_connections(character_id);
create index world_entry_connections_world_id_idx on public.world_entry_connections(world_id);

alter table public.world_entry_connections enable row level security;
alter table public.world_entry_connections replica identity full;
alter publication supabase_realtime add table public.world_entry_connections;

grant select, insert, update, delete on public.world_entry_connections to authenticated;

-- Each per-character connection becomes that character's connection. This
-- runs before the guards exist: these rows were checked when they were made,
-- and bonds turned off since must not lose them.
insert into public.world_entry_connections(entry_id, game_id, character_id, world_id, rank, completed_ticks, bonded)
  select b.entry_id, ch.game_id, b.character_id, b.world_id, b.rank, b.completed_ticks, b.bonded
  from public.world_entry_bonds b
  join public.characters ch on ch.id = b.character_id
  where b.kind = 'connection';

-- ---------------------------------------------------------------------------
-- 2. Bonds
-- ---------------------------------------------------------------------------

delete from public.world_entry_bonds where kind = 'connection';

alter table public.world_entry_bonds
  drop constraint world_entry_bonds_shape_check,
  drop column rank,
  drop column completed_ticks,
  drop column bonded,
  drop column kind;

-- ---------------------------------------------------------------------------
-- 3. Guards
-- ---------------------------------------------------------------------------

create or replace function public.world_entry_bond_check() returns trigger
language plpgsql security definer set search_path = '' as $$
declare v_entry public.world_entries;
begin
  if tg_op = 'UPDATE' then
    if new.entry_id <> old.entry_id or new.character_id <> old.character_id
      or new.world_id <> old.world_id then
      raise exception 'A bond cannot move to another entry or character'
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
  else
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
  end if;

  if new.character_id is distinct from old.character_id or tg_op = 'INSERT' then
    if new.character_id is not null and not exists (select 1 from public.characters
      where id = new.character_id and game_id = new.game_id) then
      raise exception 'A connection belongs to a character of its game'
        using errcode = '23514', hint = 'invalid_connection';
    end if;
    -- One party connection, or connections of single characters, per entry
    -- and game. Serialized so two people sharing at once cannot both pass.
    perform pg_advisory_xact_lock(hashtextextended(new.entry_id::text || new.game_id::text, 0));
    if new.character_id is null and exists (select 1 from public.world_entry_connections
      where entry_id = new.entry_id and game_id = new.game_id and id <> new.id) then
      raise exception 'Someone in this game already has a connection with this entry'
        using errcode = '23514', hint = 'others_connected';
    end if;
    if new.character_id is not null and exists (select 1 from public.world_entry_connections
      where entry_id = new.entry_id and game_id = new.game_id and character_id is null
        and id <> new.id) then
      raise exception 'The party already shares a connection with this entry'
        using errcode = '23514', hint = 'party_connected';
    end if;
  end if;
  return new;
end $$;

create trigger world_entry_connections_check before insert or update on public.world_entry_connections
  for each row execute function public.world_entry_connection_check();

revoke all on function public.world_entry_connection_check() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 4. RLS
-- ---------------------------------------------------------------------------
-- The world_entries subqueries are filtered by the entry read policy.

-- Whether the caller may change a connection with this character, or for a
-- party connection, with this game.
create function public.can_edit_world_entry_connection(p_game_id uuid, p_character_id uuid)
returns boolean language sql stable security invoker set search_path = '' as $$
  select case when p_character_id is not null
    then public.can_edit_character(p_character_id, ( select auth.uid() ))
    else exists (select 1 from public.characters ch where ch.game_id = p_game_id
      and public.can_edit_character(ch.id, ( select auth.uid() )))
  end $$;

revoke all on function public.can_edit_world_entry_connection(uuid, uuid) from public, anon;
grant execute on function public.can_edit_world_entry_connection(uuid, uuid) to authenticated;

create policy "World entry connections follow their entry for reads"
on public.world_entry_connections for select to authenticated
using (exists (select 1 from public.world_entries we where we.id = world_entry_connections.entry_id));

create policy "Character editors can make connections with entries they can read"
on public.world_entry_connections for insert to authenticated
with check (
  exists (select 1 from public.world_entries we where we.id = world_entry_connections.entry_id)
  and public.can_edit_world_entry_connection(world_entry_connections.game_id, world_entry_connections.character_id));

create policy "Character editors can change connections with entries they can read"
on public.world_entry_connections for update to authenticated
using (
  exists (select 1 from public.world_entries we where we.id = world_entry_connections.entry_id)
  and public.can_edit_world_entry_connection(world_entry_connections.game_id, world_entry_connections.character_id))
with check (
  exists (select 1 from public.world_entries we where we.id = world_entry_connections.entry_id)
  and public.can_edit_world_entry_connection(world_entry_connections.game_id, world_entry_connections.character_id));

create policy "Character editors can remove connections with entries they can read"
on public.world_entry_connections for delete to authenticated
using (
  exists (select 1 from public.world_entries we where we.id = world_entry_connections.entry_id)
  and public.can_edit_world_entry_connection(world_entry_connections.game_id, world_entry_connections.character_id));

commit;
