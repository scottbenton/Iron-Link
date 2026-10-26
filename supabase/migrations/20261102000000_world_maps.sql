-- Maps for world entries (#237, #264, #265).
--
-- A map belongs to one entry in a category with maps. Its grid is chosen when
-- it is created: hexes with pointy tops, hexes with flat tops, squares, or no
-- grid (an uploaded image with pins only). The canvas is infinite, so only
-- painted cells are stored, in chunks of 16 by 16 cells addressed in the
-- grid's own coordinates (axial q, r for hexes; column, row for squares).
-- Child entries sit on their parent's map as pins, one pin per entry, at a
-- position in map units (one unit is a CSS pixel at the default cell size).
--
-- 1. world_maps, world_map_chunks and world_map_pins, with checks.
-- 2. Guards: maps only in categories with maps; the grid changes only while
--    nothing is painted; no paint without a grid; a pin is always a child of
--    the map's entry, and moving the child elsewhere removes its pin.
-- 3. paint_world_map_cells() merges painted cells into their chunks, so two
--    people painting the same area never overwrite each other's cells.
-- 4. RLS: a map follows its entry. Reading needs the entry, editing needs the
--    right to edit it, and a pin also needs the pinned entry, so nobody learns
--    where an entry they cannot read sits.
-- 5. Map backgrounds may be uploaded by anyone who may edit the entry (before,
--    only owners, editors and Guides could, though players edit shared maps).
-- 6. Saved maps in the old world_entries.map shape move into the new tables.
--    The old columns are left in place, unread, for a later cleanup.
begin;

-- ---------------------------------------------------------------------------
-- 1. Tables
-- ---------------------------------------------------------------------------

create table public.world_maps (
  entry_id uuid primary key references public.world_entries(id) on delete cascade,
  world_id uuid not null references public.worlds(id) on delete cascade,
  grid text not null
    constraint world_maps_grid_check check (grid in ('hex_pointy', 'hex_flat', 'square', 'none')),
  hex_flowers boolean not null default false,
  -- Placed by its top left corner and width in map units; its height follows
  -- the image's aspect ratio.
  background_filename text,
  background_x double precision not null default 0,
  background_y double precision not null default 0,
  background_width double precision,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint world_maps_background_check check (
    background_width is null
    or (background_width > 0 and background_width < 10000000)),
  constraint world_maps_background_position_check check (
    abs(background_x) < 10000000 and abs(background_y) < 10000000)
);

-- A cell is { "c": colour key } and/or { "p": true } for a path.
create function public.world_map_cell_valid(p_cell jsonb) returns boolean
language sql immutable set search_path = '' as $$
  select jsonb_typeof(p_cell) = 'object'
    and p_cell <> '{}'::jsonb
    and p_cell - array['c', 'p'] = '{}'::jsonb
    and (not p_cell ? 'c' or (jsonb_typeof(p_cell->'c') = 'string'
      and (p_cell->>'c') ~ '^[A-Za-z][A-Za-z0-9_-]{0,31}$'))
    and (not p_cell ? 'p' or p_cell->'p' = 'true'::jsonb)
$$;

-- Keys are "x,y" in the grid's coordinates and must fall inside the chunk.
create function public.world_map_chunk_cells_valid(
  p_chunk_x integer, p_chunk_y integer, p_cells jsonb
) returns boolean
language sql immutable set search_path = '' as $$
  select jsonb_typeof(p_cells) = 'object'
    and (select count(*) from jsonb_object_keys(p_cells)) <= 256
    and not exists (
      select 1 from jsonb_each(p_cells) cell
      where cell.key !~ '^-?[0-9]{1,7},-?[0-9]{1,7}$'
        or floor(split_part(cell.key, ',', 1)::numeric / 16) <> p_chunk_x
        or floor(split_part(cell.key, ',', 2)::numeric / 16) <> p_chunk_y
        or not public.world_map_cell_valid(cell.value))
$$;

create table public.world_map_chunks (
  entry_id uuid not null references public.world_maps(entry_id) on delete cascade,
  chunk_x integer not null,
  chunk_y integer not null,
  cells jsonb not null default '{}'::jsonb,
  -- Bumped on every write, so a client can drop a realtime echo older than
  -- the chunk it already holds.
  version bigint not null default 1,
  updated_at timestamp with time zone not null default now(),
  primary key (entry_id, chunk_x, chunk_y),
  constraint world_map_chunks_cells_check
    check (public.world_map_chunk_cells_valid(chunk_x, chunk_y, cells))
);

create table public.world_map_pins (
  pinned_entry_id uuid primary key references public.world_entries(id) on delete cascade,
  entry_id uuid not null references public.world_maps(entry_id) on delete cascade,
  x double precision not null,
  y double precision not null,
  updated_at timestamp with time zone not null default now(),
  constraint world_map_pins_not_self check (pinned_entry_id <> entry_id),
  constraint world_map_pins_position_check check (
    abs(x) < 10000000 and abs(y) < 10000000)
);

create index world_map_pins_entry_id_idx on public.world_map_pins(entry_id);
create index world_maps_world_id_idx on public.world_maps(world_id);

-- ---------------------------------------------------------------------------
-- 2. Guards
-- ---------------------------------------------------------------------------

create function public.world_map_touch() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  if tg_table_name = 'world_map_chunks' and tg_op = 'UPDATE' then
    new.version := old.version + 1;
  end if;
  return new;
end $$;

create trigger world_maps_touch before update on public.world_maps
  for each row execute function public.world_map_touch();
create trigger world_map_chunks_touch before update on public.world_map_chunks
  for each row execute function public.world_map_touch();
create trigger world_map_pins_touch before update on public.world_map_pins
  for each row execute function public.world_map_touch();

-- A map needs a category with maps, takes its world from its entry, and keeps
-- its entry and world. Turning maps off later keeps stored maps.
create function public.world_map_check_entry() returns trigger
language plpgsql security definer set search_path = '' as $$
declare v_entry public.world_entries;
begin
  if tg_op = 'UPDATE' then
    if new.entry_id <> old.entry_id or new.world_id <> old.world_id then
      raise exception 'A map cannot move to another entry'
        using errcode = '23514', hint = 'invalid_map';
    end if;
    return new;
  end if;
  select * into v_entry from public.world_entries where id = new.entry_id;
  new.world_id := v_entry.world_id;
  if not coalesce((select (c->>'supports_map')::boolean
    from public.get_world_effective_categories(v_entry.world_id) c
    where (c->>'id')::uuid = v_entry.category_id), false) then
    raise exception 'This category does not have maps'
      using errcode = '23514', hint = 'maps_not_supported';
  end if;
  return new;
end $$;

create trigger world_maps_check_entry before insert or update on public.world_maps
  for each row execute function public.world_map_check_entry();

-- Cells do not convert between grids, so the grid changes only while nothing
-- is painted. Pins keep their positions and snap to the new grid.
create function public.world_map_check_grid() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.grid is distinct from old.grid then
    perform 1 from public.world_maps where entry_id = new.entry_id for update;
    if exists (select 1 from public.world_map_chunks
      where entry_id = new.entry_id and cells <> '{}'::jsonb) then
      raise exception 'Clear the map before changing its grid'
        using errcode = '23514', hint = 'map_not_empty';
    end if;
  end if;
  return new;
end $$;

create trigger world_maps_check_grid before update of grid on public.world_maps
  for each row execute function public.world_map_check_grid();

-- Painting needs a grid. Clearing (writing no cells) is always allowed.
create function public.world_map_chunk_check_grid() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.cells <> '{}'::jsonb and coalesce((select grid from public.world_maps
    where entry_id = new.entry_id for share), 'none') = 'none' then
    raise exception 'A map without a grid cannot be painted'
      using errcode = '23514', hint = 'map_has_no_grid';
  end if;
  return new;
end $$;

create trigger world_map_chunks_check_grid before insert or update on public.world_map_chunks
  for each row execute function public.world_map_chunk_check_grid();

-- A pin is always a child of the map's entry.
create function public.world_map_pin_check_parent() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if not exists (select 1 from public.world_entries
    where id = new.pinned_entry_id and parent_entry_id = new.entry_id) then
    raise exception 'Only entries inside this one can be pinned on its map'
      using errcode = '23514', hint = 'pin_not_child';
  end if;
  return new;
end $$;

create trigger world_map_pins_check_parent before insert or update of pinned_entry_id, entry_id
  on public.world_map_pins for each row execute function public.world_map_pin_check_parent();

-- Moving an entry to another parent (or the top level) takes it off the old
-- parent's map, whoever moves it.
create function public.world_entry_remove_stale_pin() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  delete from public.world_map_pins
    where pinned_entry_id = new.id
      and entry_id is distinct from new.parent_entry_id;
  return null;
end $$;

create trigger world_entries_remove_stale_pin after update of parent_entry_id
  on public.world_entries for each row
  when (new.parent_entry_id is distinct from old.parent_entry_id)
  execute function public.world_entry_remove_stale_pin();

revoke all on function public.world_map_touch(),
  public.world_map_check_entry(),
  public.world_map_check_grid(),
  public.world_map_chunk_check_grid(),
  public.world_map_pin_check_parent(),
  public.world_entry_remove_stale_pin()
  from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 3. Painting
-- ---------------------------------------------------------------------------

-- p_cells maps "x,y" to a cell, or to null to erase it. Cells are merged into
-- their chunks one chunk at a time, under the chunk's row lock, so concurrent
-- painters only replace the cells they each touched. Runs as the caller, so
-- the chunk policies decide who may paint. Returns the chunks it wrote.
create function public.paint_world_map_cells(p_entry_id uuid, p_cells jsonb)
returns setof public.world_map_chunks
language plpgsql security invoker set search_path = '' as $$
declare v_chunk record;
begin
  if jsonb_typeof(p_cells) <> 'object' then
    raise exception 'Cells must be an object'
      using errcode = '22023', hint = 'invalid_cells';
  end if;
  if (select count(*) from jsonb_object_keys(p_cells)) > 4096 then
    raise exception 'Paint at most 4096 cells at a time'
      using errcode = '22023', hint = 'invalid_cells';
  end if;
  if exists (select 1 from jsonb_each(p_cells) cell
    where cell.key !~ '^-?[0-9]{1,7},-?[0-9]{1,7}$'
      or (cell.value <> 'null'::jsonb and not public.world_map_cell_valid(cell.value))) then
    raise exception 'A painted cell is not valid'
      using errcode = '22023', hint = 'invalid_cells';
  end if;

  for v_chunk in
    select floor(split_part(cell.key, ',', 1)::numeric / 16)::integer as chunk_x,
           floor(split_part(cell.key, ',', 2)::numeric / 16)::integer as chunk_y,
           jsonb_object_agg(cell.key, cell.value) as patch
      from jsonb_each(p_cells) cell
      group by 1, 2
      order by 1, 2
  loop
    return query
      insert into public.world_map_chunks as existing (entry_id, chunk_x, chunk_y, cells)
        values (p_entry_id, v_chunk.chunk_x, v_chunk.chunk_y, jsonb_strip_nulls(v_chunk.patch))
        on conflict (entry_id, chunk_x, chunk_y) do update
          set cells = jsonb_strip_nulls(existing.cells || excluded.cells || (
            select coalesce(jsonb_object_agg(erased.key, 'null'::jsonb), '{}'::jsonb)
              from jsonb_each(v_chunk.patch) erased where erased.value = 'null'::jsonb))
        returning existing.*;
  end loop;
end $$;

revoke execute on function public.paint_world_map_cells(uuid, jsonb) from public, anon;

-- ---------------------------------------------------------------------------
-- 4. RLS
-- ---------------------------------------------------------------------------
-- The world_entries subqueries are filtered by the entry policies themselves:
-- a plain select by the read policy, `for update` by the edit policy, as for
-- world_entry_field_values.

alter table public.world_maps enable row level security;
alter table public.world_map_chunks enable row level security;
alter table public.world_map_pins enable row level security;

create policy "World maps follow their entry for reads"
on public.world_maps for select to authenticated
using (exists (select 1 from public.world_entries we where we.id = world_maps.entry_id));

create policy "World maps follow their entry for inserts"
on public.world_maps for insert to authenticated
with check (exists (select 1 from public.world_entries we
  where we.id = world_maps.entry_id for update));

create policy "World maps follow their entry for updates"
on public.world_maps for update to authenticated
using (exists (select 1 from public.world_entries we
  where we.id = world_maps.entry_id for update))
with check (exists (select 1 from public.world_entries we
  where we.id = world_maps.entry_id for update));

create policy "World maps follow their entry for deletes"
on public.world_maps for delete to authenticated
using (exists (select 1 from public.world_entries we
  where we.id = world_maps.entry_id for update));

create policy "World map cells follow their entry for reads"
on public.world_map_chunks for select to authenticated
using (exists (select 1 from public.world_entries we where we.id = world_map_chunks.entry_id));

create policy "World map cells follow their entry for inserts"
on public.world_map_chunks for insert to authenticated
with check (exists (select 1 from public.world_entries we
  where we.id = world_map_chunks.entry_id for update));

create policy "World map cells follow their entry for updates"
on public.world_map_chunks for update to authenticated
using (exists (select 1 from public.world_entries we
  where we.id = world_map_chunks.entry_id for update))
with check (exists (select 1 from public.world_entries we
  where we.id = world_map_chunks.entry_id for update));

create policy "World map cells follow their entry for deletes"
on public.world_map_chunks for delete to authenticated
using (exists (select 1 from public.world_entries we
  where we.id = world_map_chunks.entry_id for update));

create policy "World map pins need both entries for reads"
on public.world_map_pins for select to authenticated
using (
  exists (select 1 from public.world_entries we where we.id = world_map_pins.entry_id)
  and exists (select 1 from public.world_entries we where we.id = world_map_pins.pinned_entry_id));

create policy "World map pins need both entries for inserts"
on public.world_map_pins for insert to authenticated
with check (
  exists (select 1 from public.world_entries we
    where we.id = world_map_pins.entry_id for update)
  and exists (select 1 from public.world_entries we where we.id = world_map_pins.pinned_entry_id));

create policy "World map pins need both entries for updates"
on public.world_map_pins for update to authenticated
using (
  exists (select 1 from public.world_entries we
    where we.id = world_map_pins.entry_id for update)
  and exists (select 1 from public.world_entries we where we.id = world_map_pins.pinned_entry_id))
with check (
  exists (select 1 from public.world_entries we
    where we.id = world_map_pins.entry_id for update)
  and exists (select 1 from public.world_entries we where we.id = world_map_pins.pinned_entry_id));

create policy "World map pins need both entries for deletes"
on public.world_map_pins for delete to authenticated
using (
  exists (select 1 from public.world_entries we
    where we.id = world_map_pins.entry_id for update)
  and exists (select 1 from public.world_entries we where we.id = world_map_pins.pinned_entry_id));

alter publication supabase_realtime add table public.world_maps;
alter publication supabase_realtime add table public.world_map_chunks;
alter publication supabase_realtime add table public.world_map_pins;

-- ---------------------------------------------------------------------------
-- 5. Map background uploads follow the entry's edit rights
-- ---------------------------------------------------------------------------
-- Paths are <worldId>/<entryId>/<filename>. Both segments are checked as
-- UUIDs inside CASE before casting, since AND does not short-circuit.

create function public.world_map_background_path_editable(p_name text) returns boolean
language sql volatile security invoker set search_path = '' as $$
  select case
    when (storage.foldername(p_name))[1] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      and (storage.foldername(p_name))[2] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    then exists (select 1 from public.world_entries we
      where we.id = ((storage.foldername(p_name))[2])::uuid
        and we.world_id = ((storage.foldername(p_name))[1])::uuid
      for update)
    else false
  end
$$;

revoke execute on function public.world_map_background_path_editable(text) from public, anon;

drop policy "GMs and editors can upload map backgrounds" on storage.objects;
drop policy "GMs and editors can update map backgrounds" on storage.objects;
drop policy "GMs and editors can delete map backgrounds" on storage.objects;

create policy "Entry editors can upload map backgrounds"
on storage.objects for insert to authenticated
with check (bucket_id = 'world_map_backgrounds'
  and public.world_map_background_path_editable(name));

create policy "Entry editors can update map backgrounds"
on storage.objects for update to authenticated
using (bucket_id = 'world_map_backgrounds'
  and public.world_map_background_path_editable(name))
with check (bucket_id = 'world_map_backgrounds'
  and public.world_map_background_path_editable(name));

create policy "Entry editors can delete map backgrounds"
on storage.objects for delete to authenticated
using (bucket_id = 'world_map_backgrounds'
  and public.world_map_background_path_editable(name));

-- ---------------------------------------------------------------------------
-- 6. Old maps
-- ---------------------------------------------------------------------------
-- The old shape is Iron Fellowship's: hexes with pointy tops in rows, odd
-- rows shifted half a hex right, { "row": { "col": cell } }, where a cell has
-- an optional background colour, a type of "path" or "location", and the
-- location ids standing on it. Rows and columns become axial coordinates;
-- locations become pins at their cell's centre (only for entries that are
-- children of the map's entry, as every pin must be). The default cell size
-- is a hex radius of 24 map units; old maps scale from their own hex size.

create function pg_temp.old_map_cells(p_map jsonb) returns table (q integer, r integer, cell jsonb, location_ids jsonb)
language sql immutable as $$
  select (c.key::integer - ((rw.key::integer - (rw.key::integer & 1)) / 2)) as q,
         rw.key::integer as r,
         jsonb_strip_nulls(jsonb_build_object(
           'c', case when jsonb_typeof(c.value->'background'->'color') = 'string'
                  and (c.value->'background'->>'color') ~ '^[A-Za-z][A-Za-z0-9_-]{0,31}$'
                then c.value->'background'->'color' end,
           'p', case when c.value->>'type' = 'path' then 'true'::jsonb end)) as cell,
         case when c.value->>'type' = 'location' and jsonb_typeof(c.value->'locationIds') = 'array'
           then c.value->'locationIds' else '[]'::jsonb end as location_ids
    from jsonb_each(case when jsonb_typeof(p_map) = 'object' then p_map else '{}'::jsonb end) rw,
         jsonb_each(case when jsonb_typeof(rw.value) = 'object' then rw.value else '{}'::jsonb end) c
    where rw.key ~ '^[0-9]{1,5}$' and c.key ~ '^[0-9]{1,5}$'
      and jsonb_typeof(c.value) = 'object'
$$;

create temporary table old_maps on commit drop as
  select e.id as entry_id, e.world_id, e.map, e.map_background_filename,
    greatest(1, coalesce((e.map_settings->>'hexSize')::double precision, 20)) as hex_size,
    (e.map_settings->>'cols')::double precision as cols
  from public.world_entries e
  where (jsonb_typeof(e.map) = 'object' and e.map <> '{}'::jsonb)
    or e.map_background_filename is not null;

insert into public.world_maps (entry_id, world_id, grid, background_filename,
    background_x, background_y, background_width)
  select o.entry_id, o.world_id, 'hex_pointy', o.map_background_filename,
    -24, -24,
    case when o.map_background_filename is null then null
      else (24 / o.hex_size) * coalesce(
        o.cols * o.hex_size * sqrt(3) + o.hex_size * sqrt(3) / 2 - o.cols + 6, 675) end
  from old_maps o
  -- Old maps were only ever made for categories with maps; skip any that are
  -- not, rather than fail the migration.
  where exists (select 1 from public.world_entries e,
      public.get_world_effective_categories(e.world_id) c
    where e.id = o.entry_id and (c->>'id')::uuid = e.category_id
      and coalesce((c->>'supports_map')::boolean, false));

insert into public.world_map_chunks (entry_id, chunk_x, chunk_y, cells)
  select o.entry_id, floor(cell.q / 16.0)::integer, floor(cell.r / 16.0)::integer,
    jsonb_object_agg(cell.q || ',' || cell.r, cell.cell)
  from old_maps o
  join public.world_maps m on m.entry_id = o.entry_id,
  pg_temp.old_map_cells(o.map) cell
  where cell.cell <> '{}'::jsonb
  group by o.entry_id, 2, 3;

insert into public.world_map_pins (pinned_entry_id, entry_id, x, y)
  select distinct on (child.id) child.id, o.entry_id,
    24 * sqrt(3) * (cell.q + cell.r / 2.0), 24 * 1.5 * cell.r
  from old_maps o
  join public.world_maps m on m.entry_id = o.entry_id,
  pg_temp.old_map_cells(o.map) cell,
  jsonb_array_elements_text(cell.location_ids) location_id
  join public.world_entries child
    on location_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    and child.id = location_id::uuid
  where child.parent_entry_id = o.entry_id
  order by child.id, cell.r, cell.q;

comment on column public.world_entries.map is
  'Unused since world_maps (20261026200000); kept until a cleanup migration.';
comment on column public.world_entries.map_settings is
  'Unused since world_maps (20261026200000); kept until a cleanup migration.';
comment on column public.world_entries.map_background_filename is
  'Unused since world_maps (20261026200000); kept until a cleanup migration.';

commit;
