-- Run against a migrated isolated database; the transaction leaves no fixtures.
begin;
create extension if not exists pgtap with schema extensions;
set search_path = public,extensions;
select no_plan();
select is(has_function_privilege('anon','public.get_world_configuration(uuid)','EXECUTE'),
  false,'anonymous clients cannot call the configuration RPC');
insert into auth.users(id) values
  ('c1000000-0000-4000-8000-000000000001'),
  ('c1000000-0000-4000-8000-000000000002'),
  ('c1000000-0000-4000-8000-000000000003');
create temporary table reference_worlds(key text primary key,id uuid);
grant all on reference_worlds to authenticated;
create function pg_temp.ref_world(p_key text) returns uuid language sql as $$
  select id from reference_worlds where key=p_key $$;
create function pg_temp.ref_category(p_key text,p_category text) returns uuid language sql as $$
  select extensions.uuid_generate_v5(pg_temp.ref_world(p_key),'category:'||p_category) $$;
create function pg_temp.ref_configuration(p_key text,p_target text) returns jsonb language sql as $$
  select jsonb_build_object('version',1,'suggestions','[]'::jsonb,'helpText','',
    'visible',true,'rules','[]'::jsonb,'targetCategoryId',pg_temp.ref_category(p_key,p_target)) $$;

set local role authenticated;
select set_config('request.jwt.claim.sub','c1000000-0000-4000-8000-000000000001',true);
insert into reference_worlds values
  ('main',public.create_world('Reference test')),
  ('other',public.create_world('Other reference test')),
  ('ironlands',public.create_world('Ironlands reference test',null,'world:classic/ironlands')),
  ('forge',public.create_world('Forge reference test',null,'world:starforged/forge')),
  ('isles',public.create_world('Isles reference test',null,'world:sundered_isles/sundered_isles'));
select lives_ok($$select public.mutate_world_configuration(id,
  jsonb_build_object('type','update_category',
    'id',extensions.uuid_generate_v5(id,'category:npcs'),
    'changes',jsonb_build_object('name','Characters')))
  from reference_worlds where key in ('ironlands','forge','isles')$$,
  'setting templates retain forward conditions and default reference targets on first customization');
set constraints world_field_definitions_w4_reference_after immediate;
select is(public.get_world_configuration(pg_temp.ref_world('main'))->>'configuration_customized',
  'false','inherited configuration is read from the database');
select is(jsonb_array_length(public.get_world_configuration(pg_temp.ref_world('main'))->'categories'),
  4,'inherited blank world includes Factions');
select is((public.get_world_configuration(pg_temp.ref_world('main'))->'categories'->0->>'world_id')::uuid,
  pg_temp.ref_world('main'),'inherited category projection carries world identity');
select is((public.get_world_configuration(pg_temp.ref_world('main'))->'field_definitions'->0->>'world_id')::uuid,
  pg_temp.ref_world('main'),'inherited field projection carries world identity');
select is(public.get_world_configuration(pg_temp.ref_world('main')) ? 'entries',false,
  'configuration RPC never includes entries');
select throws_ok($$select public.get_world_configuration('00000000-0000-4000-8000-000000000999')$$,
  '42501','World configuration is unavailable','unknown world is not enumerable');

select lives_ok($$select public.mutate_world_configuration(pg_temp.ref_world('main'),
  jsonb_build_object('type','create_field','category_id',pg_temp.ref_category('main','npcs'),
    'field',jsonb_build_object('id','c2000000-0000-4000-8000-000000000001',
      'key','customLocation','label','Custom Location','type','categorySelect',
      'configuration',pg_temp.ref_configuration('main','locations'),'sort_order',10)))$$,
  'first customization can add a cross-category reference after seeding');
set constraints world_field_definitions_w4_reference_after immediate;
select is(public.get_world_configuration(pg_temp.ref_world('main'))->>'configuration_customized',
  'true','customized configuration uses stored definitions');
select is((select count(*) from jsonb_array_elements(
  public.get_world_configuration(pg_temp.ref_world('main'))->'field_definitions') f
  where f->>'type'='categorySelect'),2::bigint,
  'custom field appears in the database projection');

select throws_ok($$select public.mutate_world_configuration(pg_temp.ref_world('main'),
  jsonb_build_object('type','create_field','category_id',pg_temp.ref_category('main','npcs'),
    'field',jsonb_build_object('id','c2000000-0000-4000-8000-000000000002',
      'key','foreign','label','Foreign','type','categorySelect',
      'configuration',pg_temp.ref_configuration('other','locations'))))$$,
  'P0001','Target category must belong to the same world',
  'foreign-world target category is rejected');
select throws_ok($$select public.mutate_world_configuration(pg_temp.ref_world('main'),
  jsonb_build_object('type','create_field','category_id',pg_temp.ref_category('main','npcs'),
    'field',jsonb_build_object('id','c2000000-0000-4000-8000-000000000003',
      'key','bound','label','Bound','type','categorySelect',
      'binding',jsonb_build_object('packageId','classic','oracleId','oracle_rollable:classic/test',
        'resolvedOracleId','oracle_rollable:classic/test'),
      'configuration',pg_temp.ref_configuration('main','locations'))))$$,
  'P0001','Category reference fields cannot use oracle bindings',
  'reference fields cannot use oracle bindings');
select throws_ok($$select public.mutate_world_configuration(pg_temp.ref_world('main'),
  jsonb_build_object('type','create_field','category_id',pg_temp.ref_category('main','npcs'),
    'field',jsonb_build_object('id','c2000000-0000-4000-8000-000000000006',
      'key','ruleBound','label','Rule bound','type','categorySelect',
      'configuration',jsonb_set(pg_temp.ref_configuration('main','locations'),
        '{rules}',jsonb_build_array(jsonb_build_object(
          'conditions',jsonb_build_array(jsonb_build_object(
            'source','entry','fieldId',
              extensions.uuid_generate_v5(pg_temp.ref_world('main'),'field:npcs:pronouns'),
            'operator','isNotEmpty')),
          'binding',jsonb_build_object('packageId','classic',
            'oracleId','oracle_rollable:classic/test',
            'resolvedOracleId','oracle_rollable:classic/test')))))))$$,
  'P0001','Category reference fields cannot use oracle bindings',
  'reference fields cannot use rule oracle bindings');
select throws_ok($$select public.mutate_world_configuration(pg_temp.ref_world('main'),
  jsonb_build_object('type','create_field','category_id',pg_temp.ref_category('main','npcs'),
    'field',jsonb_build_object('id','c2000000-0000-4000-8000-000000000004',
      'key','missingTarget','label','Missing target','type','categorySelect')) )$$,
  'P0001','Reference fields require a target category',
  'reference fields require a targetCategoryId');

insert into public.world_entries(id,world_id,category_id,name,author_id,read_permissions) values
  ('c3000000-0000-4000-8000-000000000001',pg_temp.ref_world('main'),
    pg_temp.ref_category('main','locations'),'Public location',auth.uid(),'public'),
  ('c3000000-0000-4000-8000-000000000002',pg_temp.ref_world('main'),
    pg_temp.ref_category('main','npcs'),'NPC',auth.uid(),'public'),
  ('c3000000-0000-4000-8000-000000000003',pg_temp.ref_world('other'),
    pg_temp.ref_category('other','locations'),'Other world location',auth.uid(),'public');
select lives_ok($$insert into public.world_entry_field_values(entry_id,field_definition_id,world_id,value)
  values ('c3000000-0000-4000-8000-000000000002','c2000000-0000-4000-8000-000000000001',
    pg_temp.ref_world('main'),'"c3000000-0000-4000-8000-000000000001"')$$,
  'NPC can reference a visible Location entry');
select lives_ok($$select public.mutate_world_configuration(pg_temp.ref_world('main'),
  jsonb_build_object('type','update_field','id','c2000000-0000-4000-8000-000000000001',
    'changes',jsonb_build_object('configuration',jsonb_set(
      pg_temp.ref_configuration('main','locations'),'{targetCategoryId}',
      to_jsonb(upper(pg_temp.ref_category('main','locations')::text))))))$$,
  'equivalent target UUID spelling preserves populated field identity');
select is((select configuration->>'targetCategoryId' from public.world_field_definitions
  where id='c2000000-0000-4000-8000-000000000001'),
  pg_temp.ref_category('main','locations')::text,
  'reference target configuration stores canonical UUID spelling');
select throws_ok($$update public.world_entry_field_values
  set value='"c3000000-0000-4000-8000-000000000003"'
  where entry_id='c3000000-0000-4000-8000-000000000002'
    and field_definition_id='c2000000-0000-4000-8000-000000000001'$$,
  'P0001','Selected entry is unavailable in the target category',
  'cross-world entry selection is rejected');
select throws_ok($$select public.mutate_world_configuration(pg_temp.ref_world('main'),
  jsonb_build_object('type','update_field','id','c2000000-0000-4000-8000-000000000001',
    'changes',jsonb_build_object('configuration',pg_temp.ref_configuration('main','lore'))))$$,
  'P0001','Remove field values before changing the target category',
  'populated reference target cannot change');
select throws_ok($$delete from public.world_entries
  where id='c3000000-0000-4000-8000-000000000001'$$,
  'P0001','Remove category-field references before deleting this entry',
  'referenced target entry cannot be deleted');

select lives_ok($$select public.mutate_world_configuration(pg_temp.ref_world('main'),
  jsonb_build_object('type','create_field','category_id',pg_temp.ref_category('main','npcs'),
    'field',jsonb_build_object('id','c2000000-0000-4000-8000-000000000005',
      'key','otherLocations','label','Other locations','type','categoryMultiSelect',
      'configuration',pg_temp.ref_configuration('main','locations'),'sort_order',11)))$$,
  'multi-select reference field can be defined');
select throws_ok($$insert into public.world_entry_field_values(entry_id,field_definition_id,world_id,value)
  values ('c3000000-0000-4000-8000-000000000002','c2000000-0000-4000-8000-000000000005',
    pg_temp.ref_world('main'),'["c3000000-0000-4000-8000-000000000001",
      "c3000000-0000-4000-8000-000000000001"]')$$,
  'P0001','Category multi-selection cannot contain duplicate entries',
  'multi-select rejects duplicate entry IDs');
select lives_ok($$insert into public.world_entry_field_values(entry_id,field_definition_id,world_id,value)
  values ('c3000000-0000-4000-8000-000000000002','c2000000-0000-4000-8000-000000000005',
    pg_temp.ref_world('main'),'["c3000000-0000-4000-8000-000000000001"]')$$,
  'multi-select accepts a visible location');
select throws_ok($$update public.world_entry_field_values
  set value='["c3000000-0000-4000-8000-000000000002"]'
  where entry_id='c3000000-0000-4000-8000-000000000002'
    and field_definition_id='c2000000-0000-4000-8000-000000000005'$$,
  'P0001','Selected entry is unavailable in the target category',
  'multi-select rejects an entry from another category');
select throws_ok($$select public.mutate_world_configuration(pg_temp.ref_world('main'),
  jsonb_build_object('type','delete_category','id',pg_temp.ref_category('main','locations')))$$,
  'P0001','Delete category entries and their stored files before deleting the category',
  'populated target category is not removed');

reset role;
insert into public.world_players(world_id,user_id,role) values
  (pg_temp.ref_world('main'),'c1000000-0000-4000-8000-000000000002','viewer'),
  (pg_temp.ref_world('main'),'c1000000-0000-4000-8000-000000000003','editor');
set local role authenticated;
select set_config('request.jwt.claim.sub','c1000000-0000-4000-8000-000000000002',true);
select is(jsonb_array_length(public.get_world_configuration(pg_temp.ref_world('main'))->'categories'),
  4,'viewer can read configuration metadata');
select throws_ok($$select public.get_world_configuration(pg_temp.ref_world('other'))$$,
  '42501','World configuration is unavailable',
  'member cannot read an unrelated world configuration');
select set_config('request.jwt.claim.sub','c1000000-0000-4000-8000-000000000003',true);
insert into public.world_entries(id,world_id,category_id,name,author_id,read_permissions) values
  ('c3000000-0000-4000-8000-000000000004',pg_temp.ref_world('main'),
    pg_temp.ref_category('main','locations'),'Author-only location',auth.uid(),'only_author');
select set_config('request.jwt.claim.sub','c1000000-0000-4000-8000-000000000001',true);
select throws_ok($$update public.world_entry_field_values
  set value='"c3000000-0000-4000-8000-000000000004"'
  where entry_id='c3000000-0000-4000-8000-000000000002'
    and field_definition_id='c2000000-0000-4000-8000-000000000001'$$,
  'P0001','Selected entry is unavailable in the target category',
  'owner cannot link an author-only entry they cannot read');
select set_config('request.jwt.claim.sub','c1000000-0000-4000-8000-000000000003',true);
select lives_ok($$update public.world_entry_field_values
  set value='"c3000000-0000-4000-8000-000000000004"'
  where entry_id='c3000000-0000-4000-8000-000000000002'
    and field_definition_id='c2000000-0000-4000-8000-000000000001'$$,
  'author can link their own private target');
select set_config('request.jwt.claim.sub','c1000000-0000-4000-8000-000000000001',true);
select is((select count(*) from public.world_entry_field_values
  where entry_id='c3000000-0000-4000-8000-000000000002'
    and field_definition_id='c2000000-0000-4000-8000-000000000001'),0::bigint,
  'public source does not reveal a private target reference to another reader');
select set_config('request.jwt.claim.sub','c1000000-0000-4000-8000-000000000003',true);
select is((select count(*) from public.world_entry_field_values
  where entry_id='c3000000-0000-4000-8000-000000000002'
    and field_definition_id='c2000000-0000-4000-8000-000000000001'),1::bigint,
  'private target author retains access to their reference');

reset role;
select set_config('request.jwt.claim.sub','',true);
select lives_ok($$update public.world_entry_field_values set gm_only=gm_only
  where world_id=pg_temp.ref_world('main')$$,
  'catalog metadata refresh preserves private references without an authenticated actor');
select set_config('request.jwt.claim.sub','c1000000-0000-4000-8000-000000000001',true);
select lives_ok($$update public.world_entry_field_values set gm_only=gm_only
  where world_id=pg_temp.ref_world('main')$$,
  'first-fork metadata refresh preserves a reference unreadable by its actor');
set local role authenticated;
select is((select count(*) from public.world_entry_field_values
  where entry_id='c3000000-0000-4000-8000-000000000002'
    and field_definition_id='c2000000-0000-4000-8000-000000000001'),0::bigint,
  'metadata refresh never exposes another author private reference');
select set_config('request.jwt.claim.sub','c1000000-0000-4000-8000-000000000003',true);

delete from public.world_entry_field_values
  where entry_id='c3000000-0000-4000-8000-000000000002';
delete from public.world_entries where id='c3000000-0000-4000-8000-000000000004';
select set_config('request.jwt.claim.sub','c1000000-0000-4000-8000-000000000001',true);
delete from public.world_entries where id='c3000000-0000-4000-8000-000000000001';
select throws_ok($$select public.mutate_world_configuration(pg_temp.ref_world('main'),
  jsonb_build_object('type','delete_category','id',pg_temp.ref_category('main','locations')))$$,
  'P0001','Remove fields targeting this category before deleting it',
  'an empty category cannot be deleted while fields target it');
select lives_ok($$delete from public.worlds where id=pg_temp.ref_world('main')$$,
  'whole-world deletion still cascades category references');

reset role;
select finish();
rollback;
