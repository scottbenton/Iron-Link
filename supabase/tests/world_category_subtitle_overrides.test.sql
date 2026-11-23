-- Entry subtitle per type (#412): category subtitle_overrides.
begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;
select no_plan();

insert into auth.users (id) values ('b4000000-0000-4000-8000-000000000001');
select set_config('request.jwt.claim.sub','b4000000-0000-4000-8000-000000000001',true);
create temporary table subtitle_worlds (key text primary key, id uuid);
grant all on subtitle_worlds to authenticated;
create function pg_temp.forge() returns uuid language sql as $$ select id from subtitle_worlds where key='forge' $$;
create function pg_temp.field(p_key text) returns text language sql as $$
  select extensions.uuid_generate_v5(pg_temp.forge(),'field:locations:'||p_key)::text $$;
create function pg_temp.locations() returns uuid language sql as $$
  select extensions.uuid_generate_v5(pg_temp.forge(),'category:locations') $$;
create function pg_temp.update_locations(p_changes jsonb) returns void language sql as $$
  select public.mutate_world_configuration(pg_temp.forge(),
    jsonb_build_object('type','update_category','id',pg_temp.locations(),'changes',p_changes)) $$;
create function pg_temp.overrides() returns jsonb language sql as $$
  select subtitle_overrides from public.world_categories where id = pg_temp.locations() $$;

set local role authenticated;
insert into subtitle_worlds values ('forge', public.create_world('Subtitle Forge','world:starforged/forge'));

-- Inherited worlds read the template's overrides with world-scoped ids.
select is(
  (select c->'subtitle_overrides' from jsonb_array_elements(public.get_world_configuration(pg_temp.forge())->'categories') c
    where (c->>'id')::uuid = pg_temp.locations()),
  jsonb_build_array(
    jsonb_build_object('value','Sector','field_definition_id',pg_temp.field('region')),
    jsonb_build_object('value','Star','field_definition_id',pg_temp.field('description')),
    jsonb_build_object('value','Settlement','field_definition_id',pg_temp.field('settlementLocation'))),
  'inherited Forge Locations read Sector, Star and Settlement overrides');
select ok(bool_and(c->'subtitle_overrides' = '[]'::jsonb),
  'categories without overrides read an empty list')
  from jsonb_array_elements(public.get_world_configuration(pg_temp.forge())->'categories') c
  where (c->>'id')::uuid <> pg_temp.locations();

-- The first edit copies them.
select lives_ok($$select pg_temp.update_locations('{"name":"Places"}')$$,'first edit customizes the world');
select is(jsonb_array_length(pg_temp.overrides()),3,'customizing copies the overrides');

select lives_ok($$select pg_temp.update_locations(jsonb_build_object('subtitle_overrides',jsonb_build_array(
  jsonb_build_object('value','  Planet ','field_definition_id',upper(pg_temp.field('planetClass'))))))$$,
  'editors replace the overrides');
select is(pg_temp.overrides(),
  jsonb_build_array(jsonb_build_object('value','Planet','field_definition_id',pg_temp.field('planetClass'))),
  'values are trimmed and field ids stored canonically');

select throws_ok($$select pg_temp.update_locations(jsonb_build_object('subtitle_overrides',jsonb_build_array(
  jsonb_build_object('value','Star','field_definition_id',extensions.uuid_generate_v5(pg_temp.forge(),'field:npcs:pronouns')))))$$,
  'P0001','Subtitle override field must belong to this category','a field from another category is refused');
select throws_ok($$select pg_temp.update_locations(jsonb_build_object('subtitle_overrides',jsonb_build_array(
  jsonb_build_object('value','Star','field_definition_id',pg_temp.field('region')),
  jsonb_build_object('value','star','field_definition_id',pg_temp.field('description')))))$$,
  'P0001','Subtitle overrides must have distinct values','one override per value');
select throws_ok($$select pg_temp.update_locations(jsonb_build_object('subtitle_overrides',jsonb_build_array(
  jsonb_build_object('value','  ','field_definition_id',pg_temp.field('region')))))$$,
  'P0001','Invalid subtitle override','a blank value is refused');
select throws_ok($$select pg_temp.update_locations(jsonb_build_object('subtitle_overrides',jsonb_build_array(
  jsonb_build_object('value','Star','field_definition_id',pg_temp.field('region'),'extra',true))))$$,
  'P0001','Invalid subtitle override','unknown keys are refused');
select throws_ok($$select pg_temp.update_locations('{"subtitle_overrides":{}}')$$,
  'P0001','Invalid subtitle override','overrides must be a list');

-- Deleting an override's field drops that override and keeps the rest.
select lives_ok($$select pg_temp.update_locations(jsonb_build_object('subtitle_overrides',jsonb_build_array(
  jsonb_build_object('value','Sector','field_definition_id',pg_temp.field('sectorTrouble')),
  jsonb_build_object('value','Star','field_definition_id',pg_temp.field('description')))))$$,
  'overrides set before a field deletion');
select lives_ok($$select public.mutate_world_configuration(pg_temp.forge(),
  jsonb_build_object('type','delete_field','id',pg_temp.field('sectorTrouble')))$$,'override field can be deleted');
select is(pg_temp.overrides(),
  jsonb_build_array(jsonb_build_object('value','Star','field_definition_id',pg_temp.field('description'))),
  'deleting a field removes only its override');

-- Overrides replace the subtitle field, so they go when it goes.
select lives_ok($$select pg_temp.update_locations('{"subtitle_field_definition_id":null}')$$,'subtitle field cleared');
select is(pg_temp.overrides(),'[]'::jsonb,'clearing the subtitle field clears its overrides');
select lives_ok($$select pg_temp.update_locations('{"name":"Locations"}')$$,
  'later edits do not re-check overrides they leave alone');
reset role;

select * from finish();
rollback;
