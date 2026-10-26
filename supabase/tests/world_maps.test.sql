-- World maps: maps only in categories with maps, painting that merges cells,
-- the grid changing only while nothing is painted, pins that stay children of
-- the map's entry and stay hidden with their entry, and map backgrounds
-- following the entry's edit rights. Every fixture is rolled back.
begin;
create extension if not exists pgtap with schema extensions;
set search_path = public,extensions;
select no_plan();

-- 1 owner, 2 guide, 3 player, 4 outsider.
insert into auth.users(id)
  select ('e1000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid from generate_series(1,4) n;
create temporary table map_worlds(key text primary key,id uuid);
grant all on map_worlds to authenticated;
create function pg_temp.u(p_n integer) returns uuid language sql as $$
  select ('e1000000-0000-4000-8000-'||lpad(p_n::text,12,'0'))::uuid $$;
create function pg_temp.as_user(p_n integer) returns void language sql as $$
  select set_config('request.jwt.claim.sub',pg_temp.u(p_n)::text,true) $$;
create function pg_temp.w(p_key text) returns uuid language sql as $$
  select id from map_worlds where key=p_key $$;
create function pg_temp.c(p_key text,p_category text) returns uuid language sql as $$
  select extensions.uuid_generate_v5(pg_temp.w(p_key),'category:'||p_category) $$;
create function pg_temp.e(p_n integer) returns uuid language sql as $$
  select ('e3000000-0000-4000-8000-'||lpad(p_n::text,12,'0'))::uuid $$;
create function pg_temp.add(p_n integer,p_category text,p_name text,p_read text,
  p_parent integer default null) returns void language sql as $$
  insert into public.world_entries(id,world_id,category_id,name,author_id,read_permissions,edit_permissions,parent_entry_id)
    values (pg_temp.e(p_n),pg_temp.w('main'),pg_temp.c('main',p_category),p_name,auth.uid(),
      p_read::public.note_read_permissions,p_read::public.note_edit_permissions,
      case when p_parent is null then null else pg_temp.e(p_parent) end) $$;
create function pg_temp.paint(p_entry integer,p_cells jsonb) returns void language sql as $$
  select null from public.paint_world_map_cells(pg_temp.e(p_entry),p_cells) $$;
create function pg_temp.cells(p_entry integer) returns jsonb language sql as $$
  select coalesce(jsonb_object_agg(cell.key,cell.value),'{}'::jsonb)
  from public.world_map_chunks ch, jsonb_each(ch.cells) cell where ch.entry_id=pg_temp.e(p_entry) $$;
create function pg_temp.pins(p_entry integer) returns text[] language sql as $$
  select coalesce(array_agg(e.name order by e.name),'{}'::text[])
  from public.world_map_pins p join public.world_entries e on e.id=p.pinned_entry_id
  where p.entry_id=pg_temp.e(p_entry) $$;
create function pg_temp.pin(p_child integer,p_map integer,p_x double precision default 0) returns void language sql as $$
  insert into public.world_map_pins(pinned_entry_id,entry_id,x,y) values (pg_temp.e(p_child),pg_temp.e(p_map),p_x,0) $$;
create function pg_temp.outcome(p_sql text) returns text language plpgsql as $$
declare v_state text; v_hint text; v_message text;
begin
  execute p_sql;
  return 'ok';
exception when others then
  get stacked diagnostics v_state = returned_sqlstate, v_hint = pg_exception_hint, v_message = message_text;
  return v_state||' '||coalesce(nullif(v_hint,''),'-')||' '||v_message;
end $$;
grant execute on function pg_temp.outcome(text) to authenticated;

select ok(not has_function_privilege('authenticated','public.world_map_check_entry()','EXECUTE')
  and not has_function_privilege('authenticated','public.world_map_check_grid()','EXECUTE')
  and not has_function_privilege('authenticated','public.world_map_chunk_check_grid()','EXECUTE')
  and not has_function_privilege('authenticated','public.world_map_pin_check_parent()','EXECUTE')
  and not has_function_privilege('authenticated','public.world_entry_remove_stale_pin()','EXECUTE'),
  'map guards are not exposed to clients');
select ok(has_function_privilege('authenticated','public.paint_world_map_cells(uuid,jsonb)','EXECUTE'),
  'signed-in clients can paint');

set local role authenticated;
select pg_temp.as_user(1);
insert into map_worlds values ('main',public.create_world('Maps')),('other',public.create_world('Other'));
reset role;
insert into public.games(id,name,game_type,world_id) values
  ('e5000000-0000-4000-8000-000000000001','Guided','guided',pg_temp.w('main'));
insert into public.game_players(game_id,user_id,role) values
  ('e5000000-0000-4000-8000-000000000001',pg_temp.u(2),'guide'),
  ('e5000000-0000-4000-8000-000000000001',pg_temp.u(3),'player');

set local role authenticated;
select pg_temp.as_user(1);
-- Blank worlds have maps on Locations and not on NPCs.
select pg_temp.add(1,'locations','Region','all_players');
select pg_temp.add(2,'locations','Village','all_players',1);
select pg_temp.add(3,'locations','Hideout','only_guides',1);
select pg_temp.add(4,'npcs','Captain','all_players');
select pg_temp.add(5,'locations','Prep region','only_guides');
select pg_temp.add(6,'locations','Elsewhere','all_players');

-- Creating maps
select pg_temp.as_user(3);
select is(pg_temp.outcome($$insert into public.world_maps(entry_id,world_id,grid)
  values (pg_temp.e(1),pg_temp.w('other'),'hex_pointy')$$),'ok','a player can make a map on a shared entry');
select is((select world_id from public.world_maps where entry_id=pg_temp.e(1)),pg_temp.w('main'),
  'a map takes its world from its entry');
select is(pg_temp.outcome($$insert into public.world_maps(entry_id,world_id,grid)
  values (pg_temp.e(4),pg_temp.w('main'),'square')$$),
  '23514 maps_not_supported This category does not have maps','maps need a category with maps');
select is(pg_temp.outcome($$insert into public.world_maps(entry_id,world_id,grid)
  values (pg_temp.e(6),pg_temp.w('main'),'triangles')$$),
  '23514 - new row for relation "world_maps" violates check constraint "world_maps_grid_check"',
  'only the four grids are stored');
select is(pg_temp.outcome($$insert into public.world_maps(entry_id,world_id,grid)
  values (pg_temp.e(5),pg_temp.w('main'),'square')$$),
  '42501 - new row violates row-level security policy for table "world_maps"',
  'a player cannot make a map on Guide prep');
select pg_temp.as_user(2);
select is(pg_temp.outcome($$insert into public.world_maps(entry_id,world_id,grid)
  values (pg_temp.e(5),pg_temp.w('main'),'square')$$),'ok','a Guide can make a map on Guide prep');
select pg_temp.as_user(3);
select is((select count(*) from public.world_maps where entry_id=pg_temp.e(5)),0::bigint,
  'a player cannot see a map on Guide prep');
select pg_temp.as_user(4);
select is((select count(*) from public.world_maps),0::bigint,'outsiders see no maps');

-- Painting
select pg_temp.as_user(3);
select is(pg_temp.outcome($$select pg_temp.paint(1,'{"0,0":{"c":"grass"},"1,0":{"c":"water","p":true},"-1,-1":{"c":"rock"}}')$$),
  'ok','a player can paint a shared map');
select is((select count(*) from public.world_map_chunks where entry_id=pg_temp.e(1)),2::bigint,
  'cells land in the chunk that holds them, including negative coordinates');
select is((select chunk_x||','||chunk_y from public.world_map_chunks
  where entry_id=pg_temp.e(1) and cells ? '-1,-1'),'-1,-1','a negative cell sits in a negative chunk');
select pg_temp.as_user(1);
select pg_temp.paint(1,'{"2,0":{"c":"snow"},"0,0":{"c":"sand"}}');
select is(pg_temp.cells(1),
  '{"0,0":{"c":"sand"},"1,0":{"c":"water","p":true},"2,0":{"c":"snow"},"-1,-1":{"c":"rock"}}'::jsonb,
  'painting merges cells, replacing only the ones it touched');
select is((select version from public.world_map_chunks where entry_id=pg_temp.e(1) and chunk_x=0),2::bigint,
  'every write bumps the chunk version');
select pg_temp.paint(1,'{"2,0":null,"40,40":null}');
select is(pg_temp.cells(1),
  '{"0,0":{"c":"sand"},"1,0":{"c":"water","p":true},"-1,-1":{"c":"rock"}}'::jsonb,
  'a null cell erases it, and erasing an unpainted cell stores nothing');
select is(pg_temp.outcome($$select pg_temp.paint(1,'{"0,0":{"c":"sand","x":1}}')$$),
  '22023 invalid_cells A painted cell is not valid','cells hold only a colour and a path');
select is(pg_temp.outcome($$select pg_temp.paint(1,'{"0,0":{}}')$$),
  '22023 invalid_cells A painted cell is not valid','an empty cell is not stored');
select is(pg_temp.outcome($$select pg_temp.paint(1,'{"a,b":{"c":"sand"}}')$$),
  '22023 invalid_cells A painted cell is not valid','cell keys are coordinates');
select is(pg_temp.outcome($$select pg_temp.paint(1,(select jsonb_object_agg(n||',0','{"c":"sand"}'::jsonb)
  from generate_series(1,4097) n))$$),
  '22023 invalid_cells Paint at most 4096 cells at a time','one paint is bounded');
select is(pg_temp.outcome($$insert into public.world_map_chunks(entry_id,chunk_x,chunk_y,cells)
  values (pg_temp.e(1),5,5,'{"0,0":{"c":"sand"}}')$$),
  '23514 - new row for relation "world_map_chunks" violates check constraint "world_map_chunks_cells_check"',
  'a chunk only holds its own cells');
select pg_temp.as_user(3);
select is(pg_temp.outcome($$select pg_temp.paint(5,'{"0,0":{"c":"sand"}}')$$),
  '42501 - new row violates row-level security policy for table "world_map_chunks"',
  'a player cannot paint Guide prep');
select pg_temp.as_user(4);
select is(pg_temp.outcome($$select pg_temp.paint(1,'{"0,0":{"c":"sand"}}')$$),
  '42501 - new row violates row-level security policy for table "world_map_chunks"',
  'outsiders cannot paint');
select is((select count(*) from public.world_map_chunks),0::bigint,'outsiders see no cells');

-- The grid
select pg_temp.as_user(3);
select is(pg_temp.outcome($$update public.world_maps set grid='square' where entry_id=pg_temp.e(1)$$),
  '23514 map_not_empty Clear the map before changing its grid','the grid stays while cells are painted');
select is(pg_temp.outcome($$update public.world_maps set hex_flowers=true where entry_id=pg_temp.e(1)$$),
  'ok','other settings change while cells are painted');
update public.world_map_chunks set cells='{}' where entry_id=pg_temp.e(1);
select is(pg_temp.outcome($$update public.world_maps set grid='hex_flat' where entry_id=pg_temp.e(1)$$),
  'ok','a cleared map can change its grid');
update public.world_maps set grid='none' where entry_id=pg_temp.e(1);
select is(pg_temp.outcome($$select pg_temp.paint(1,'{"0,0":{"c":"sand"}}')$$),
  '23514 map_has_no_grid A map without a grid cannot be painted','a map without a grid has no paint');
update public.world_maps set grid='hex_pointy' where entry_id=pg_temp.e(1);

-- Pins
select pg_temp.as_user(3);
select is(pg_temp.outcome('select pg_temp.pin(2,1)'),'ok','a player can pin a child on a shared map');
select is(pg_temp.outcome('select pg_temp.pin(6,1)'),
  '23514 pin_not_child Only entries inside this one can be pinned on its map','only children can be pinned');
select is(pg_temp.outcome('select pg_temp.pin(3,1)'),
  '42501 - new row violates row-level security policy for table "world_map_pins"',
  'a player cannot pin an entry they cannot read');
select pg_temp.as_user(2);
select is(pg_temp.outcome('select pg_temp.pin(3,1,48)'),'ok','a Guide can pin Guide prep');
select is(pg_temp.outcome('select pg_temp.pin(3,1,96)'),
  '23505 - duplicate key value violates unique constraint "world_map_pins_pkey"','an entry has one pin');
select is(pg_temp.pins(1),array['Hideout','Village'],'Guides see every pin');
select pg_temp.as_user(3);
select is(pg_temp.pins(1),array['Village'],'players never see a pin for an entry they cannot read');
select is(pg_temp.outcome($$update public.world_map_pins set x=10 where pinned_entry_id=pg_temp.e(2)$$),'ok',
  'a player can move a pin on a shared map');
select pg_temp.as_user(4);
select is((select count(*) from public.world_map_pins),0::bigint,'outsiders see no pins');
select pg_temp.as_user(1);
update public.world_entries set parent_entry_id=null where id=pg_temp.e(2);
select is(pg_temp.pins(1),array['Hideout'],'moving a child out of its parent takes it off the map');
update public.world_entries set parent_entry_id=pg_temp.e(1) where id=pg_temp.e(2);
select is(pg_temp.pins(1),array['Hideout'],'moving it back leaves it unpinned');
delete from public.world_entries where id=pg_temp.e(3);
select is(pg_temp.pins(1),'{}'::text[],'deleting a pinned entry removes its pin');

-- Map backgrounds
select pg_temp.as_user(3);
select is(pg_temp.outcome(format($$insert into storage.objects(bucket_id,name) values ('world_map_backgrounds','%s/%s/map.png')$$,
  pg_temp.w('main'),pg_temp.e(1))),'ok','a player can upload a background for a shared map');
select is(pg_temp.outcome(format($$insert into storage.objects(bucket_id,name) values ('world_map_backgrounds','%s/%s/map.png')$$,
  pg_temp.w('main'),pg_temp.e(5))),
  '42501 - new row violates row-level security policy for table "objects"',
  'a player cannot upload a background for Guide prep');
select is(pg_temp.outcome(format($$insert into storage.objects(bucket_id,name) values ('world_map_backgrounds','%s/%s/map.png')$$,
  pg_temp.w('other'),pg_temp.e(1))),
  '42501 - new row violates row-level security policy for table "objects"',
  'a background path names the entry''s own world');
select is(pg_temp.outcome($$insert into storage.objects(bucket_id,name) values ('world_map_backgrounds','not-a-uuid/x/map.png')$$),
  '42501 - new row violates row-level security policy for table "objects"','malformed paths are refused');
select pg_temp.as_user(4);
select is(pg_temp.outcome(format($$insert into storage.objects(bucket_id,name) values ('world_map_backgrounds','%s/%s/map2.png')$$,
  pg_temp.w('main'),pg_temp.e(1))),
  '42501 - new row violates row-level security policy for table "objects"','outsiders cannot upload backgrounds');

-- Deleting the entry deletes its map
select pg_temp.as_user(1);
delete from public.world_entries where id=pg_temp.e(1);
reset role;
select is((select count(*) from public.world_maps where entry_id=pg_temp.e(1))
  + (select count(*) from public.world_map_chunks where entry_id=pg_temp.e(1)),0::bigint,
  'a deleted entry takes its map with it');

select * from finish();
rollback;
