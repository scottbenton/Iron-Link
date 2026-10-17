-- Room keys for live editing (#250).
--
-- y-webrtc encrypts a room's traffic with a key derived from its password, and
-- that password was the game or world id, so anyone who knew the ids could
-- join any room and read every keystroke. Each note and world entry now has a
-- random key that only its readers can select, and each game and world has a
-- Guide room key that only its Guides can select, for Guide-only rooms.
--
-- Keys rotate when someone may have lost access: a membership removed or its
-- role changed, a game unlinked, deleted or changing type, or a note or entry
-- whose read permissions or author changed. Rotation is a superset of what is
-- needed (it also rotates keys the person could never read), which costs only
-- a rejoin for the people still in the room.
begin;

create table public.room_keys (
  id uuid primary key default gen_random_uuid(),
  note_id uuid unique references public.notes(id) on delete cascade,
  world_entry_id uuid unique references public.world_entries(id) on delete cascade,
  key text not null default encode(extensions.gen_random_bytes(32), 'base64'),
  rotated_at timestamptz not null default now(),
  constraint room_keys_one_document check ((note_id is null) <> (world_entry_id is null))
);

create table public.guide_room_keys (
  id uuid primary key default gen_random_uuid(),
  game_id uuid unique references public.games(id) on delete cascade,
  world_id uuid unique references public.worlds(id) on delete cascade,
  key text not null default encode(extensions.gen_random_bytes(32), 'base64'),
  rotated_at timestamptz not null default now(),
  constraint guide_room_keys_one_scope check ((game_id is null) <> (world_id is null))
);

-- A Guide of a game: the guide role, or any member of a solo or co-op game.
create function public.is_game_guide(p_game_id uuid, p_uid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.game_players gp
      join public.games g on g.id = gp.game_id
    where gp.game_id = p_game_id and gp.user_id = p_uid
      and (gp.role = 'guide' or g.game_type in ('solo', 'co-op')));
$$;

-- Who may read a game note, by its read permissions. The notes table's own
-- policy only checks membership and leaves the rest to the client, so the room
-- key carries the full rule rather than leaning on it.
create function public.note_readable(p_note_id uuid, p_uid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.notes n
    where n.id = p_note_id and case n.read_permissions
      when 'public' then true
      when 'all_players' then exists (select 1 from public.game_players gp
        where gp.game_id = n.game_id and gp.user_id = p_uid)
      when 'guides_and_author' then
        (n.author_id = p_uid and exists (select 1 from public.game_players gp
          where gp.game_id = n.game_id and gp.user_id = p_uid))
        or public.is_game_guide(n.game_id, p_uid)
      when 'only_guides' then public.is_game_guide(n.game_id, p_uid)
      when 'only_author' then n.author_id = p_uid and exists (
        select 1 from public.game_players gp
        where gp.game_id = n.game_id and gp.user_id = p_uid)
      else false
    end);
$$;

-- The same rule as the world entries read policy, for any user.
create function public.world_entry_readable(p_entry_id uuid, p_uid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.world_entries e
    where e.id = p_entry_id and case e.read_permissions
      when 'public' then true
      when 'all_players' then public.world_role(e.world_id, p_uid) <> 'none'
      when 'guides_and_author' then e.author_id = p_uid
        or public.world_role(e.world_id, p_uid) in ('owner', 'editor', 'guide')
      when 'only_guides' then public.world_role(e.world_id, p_uid) in ('owner', 'editor', 'guide')
      when 'only_author' then e.author_id = p_uid
      else false
    end);
$$;

alter table public.room_keys enable row level security;
alter table public.guide_room_keys enable row level security;

create policy "Readers can read room keys" on public.room_keys
  for select to authenticated using (
    case when note_id is not null then public.note_readable(note_id, (select auth.uid()))
      else public.world_entry_readable(world_entry_id, (select auth.uid())) end);

create policy "Guides can read guide room keys" on public.guide_room_keys
  for select to authenticated using (
    case when game_id is not null then public.is_game_guide(game_id, (select auth.uid()))
      else public.world_role(world_id, (select auth.uid())) in ('owner', 'editor', 'guide') end);

-- Keys are written only by the triggers below.
revoke all on public.room_keys from anon, authenticated;
revoke all on public.guide_room_keys from anon, authenticated;
grant select on public.room_keys to authenticated;
grant select on public.guide_room_keys to authenticated;
grant all on public.room_keys to service_role;
grant all on public.guide_room_keys to service_role;

revoke execute on function public.is_game_guide(uuid, uuid) from public, anon;
revoke execute on function public.note_readable(uuid, uuid) from public, anon;
revoke execute on function public.world_entry_readable(uuid, uuid) from public, anon;
grant execute on function public.is_game_guide(uuid, uuid) to authenticated, service_role;
grant execute on function public.note_readable(uuid, uuid) to authenticated, service_role;
grant execute on function public.world_entry_readable(uuid, uuid) to authenticated, service_role;

-- Creating keys with their documents and scopes.
create function public.room_keys_create() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  case tg_table_name
    when 'notes' then insert into public.room_keys(note_id) values (new.id);
    when 'world_entries' then insert into public.room_keys(world_entry_id) values (new.id);
    when 'games' then insert into public.guide_room_keys(game_id) values (new.id);
    when 'worlds' then insert into public.guide_room_keys(world_id) values (new.id);
  end case;
  return null;
end $$;

create trigger notes_create_room_key after insert on public.notes
  for each row execute function public.room_keys_create();
create trigger world_entries_create_room_key after insert on public.world_entries
  for each row execute function public.room_keys_create();
create trigger games_create_guide_room_key after insert on public.games
  for each row execute function public.room_keys_create();
create trigger worlds_create_guide_room_key after insert on public.worlds
  for each row execute function public.room_keys_create();

insert into public.room_keys(note_id) select id from public.notes;
insert into public.room_keys(world_entry_id) select id from public.world_entries;
insert into public.guide_room_keys(game_id) select id from public.games;
insert into public.guide_room_keys(world_id) select id from public.worlds;

-- Rotating keys.
create function public.room_keys_rotate_game(p_game_id uuid, p_uid uuid) returns void
language sql security definer set search_path = '' as $$
  update public.room_keys k
    set key = encode(extensions.gen_random_bytes(32), 'base64'), rotated_at = now()
    from public.notes n
    where k.note_id = n.id and n.game_id = p_game_id
      and (p_uid is null or not public.note_readable(n.id, p_uid));
  update public.guide_room_keys
    set key = encode(extensions.gen_random_bytes(32), 'base64'), rotated_at = now()
    where game_id = p_game_id
      and (p_uid is null or not public.is_game_guide(p_game_id, p_uid));
$$;

create function public.room_keys_rotate_world(p_world_id uuid, p_uid uuid) returns void
language sql security definer set search_path = '' as $$
  update public.room_keys k
    set key = encode(extensions.gen_random_bytes(32), 'base64'), rotated_at = now()
    from public.world_entries e
    where k.world_entry_id = e.id and e.world_id = p_world_id
      and (p_uid is null or not public.world_entry_readable(e.id, p_uid));
  update public.guide_room_keys
    set key = encode(extensions.gen_random_bytes(32), 'base64'), rotated_at = now()
    where world_id = p_world_id
      and (p_uid is null or public.world_role(p_world_id, p_uid) not in ('owner', 'editor', 'guide'));
$$;

revoke execute on function public.room_keys_rotate_game(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.room_keys_rotate_world(uuid, uuid) from public, anon, authenticated;

-- A game membership removed or its role changed: the game's keys, and the
-- linked world's, that the person can no longer read. A game being deleted has
-- already gone by the time its members are, and its own trigger rotates the world.
create function public.game_players_rotate_room_keys() returns trigger
language plpgsql security definer set search_path = '' as $$
declare v_world_id uuid;
begin
  select g.world_id into v_world_id from public.games g where g.id = old.game_id;
  if not found then return null; end if;
  perform public.room_keys_rotate_game(old.game_id, old.user_id);
  if v_world_id is not null then
    perform public.room_keys_rotate_world(v_world_id, old.user_id);
  end if;
  return null;
end $$;

create trigger game_players_rotate_room_keys_on_delete after delete on public.game_players
  for each row execute function public.game_players_rotate_room_keys();
create trigger game_players_rotate_room_keys_on_role after update of role on public.game_players
  for each row when (old.role is distinct from new.role)
  execute function public.game_players_rotate_room_keys();

create function public.world_players_rotate_room_keys() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  perform public.room_keys_rotate_world(old.world_id, old.user_id);
  return null;
end $$;

create trigger world_players_rotate_room_keys_on_delete after delete on public.world_players
  for each row execute function public.world_players_rotate_room_keys();
create trigger world_players_rotate_room_keys_on_role after update of role on public.world_players
  for each row when (old.role is distinct from new.role)
  execute function public.world_players_rotate_room_keys();

-- A game unlinked, deleted or changing type changes what every member can read
-- in its world, and a type change also changes who its Guides are. These are
-- rare, so every key in the scope rotates.
create function public.games_rotate_room_keys() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'UPDATE' and old.game_type is distinct from new.game_type then
    perform public.room_keys_rotate_game(old.id, null);
  end if;
  if old.world_id is not null and (tg_op = 'DELETE'
      or old.world_id is distinct from new.world_id
      or old.game_type is distinct from new.game_type) then
    perform public.room_keys_rotate_world(old.world_id, null);
  end if;
  return null;
end $$;

create trigger games_rotate_room_keys_on_delete after delete on public.games
  for each row execute function public.games_rotate_room_keys();
create trigger games_rotate_room_keys_on_update after update of world_id, game_type on public.games
  for each row execute function public.games_rotate_room_keys();

create function public.room_keys_rotate_document() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  update public.room_keys
    set key = encode(extensions.gen_random_bytes(32), 'base64'), rotated_at = now()
    where case tg_table_name when 'notes' then note_id = new.id else world_entry_id = new.id end;
  return null;
end $$;

create trigger notes_rotate_room_key after update of read_permissions, author_id on public.notes
  for each row when (old.read_permissions is distinct from new.read_permissions
    or old.author_id is distinct from new.author_id)
  execute function public.room_keys_rotate_document();
create trigger world_entries_rotate_room_key after update of read_permissions, author_id on public.world_entries
  for each row when (old.read_permissions is distinct from new.read_permissions
    or old.author_id is distinct from new.author_id)
  execute function public.room_keys_rotate_document();

revoke all on function public.room_keys_create() from public, anon, authenticated;
revoke all on function public.game_players_rotate_room_keys() from public, anon, authenticated;
revoke all on function public.world_players_rotate_room_keys() from public, anon, authenticated;
revoke all on function public.games_rotate_room_keys() from public, anon, authenticated;
revoke all on function public.room_keys_rotate_document() from public, anon, authenticated;

-- Clients rejoin when their key changes; realtime applies the read policies,
-- so someone who lost access never receives the new key.
alter publication supabase_realtime add table public.room_keys;
alter publication supabase_realtime add table public.guide_room_keys;

commit;
