-- Run with `supabase test db`; every fixture is rolled back.
begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;
select no_plan();

insert into auth.users (id) values
  ('a1000000-0000-0000-0000-000000000001'),
  ('a1000000-0000-0000-0000-000000000002'),
  ('a1000000-0000-0000-0000-000000000003'),
  ('a1000000-0000-0000-0000-000000000004');

create function pg_temp.world_configuration_template() returns jsonb language sql as $$
select '{"version":1,"categories":[
  {"id":"a2000000-0000-0000-0000-000000000001","name":"Locations","icon":null,"sort_order":0,
   "supports_hierarchy":true,"supports_map":true,"supports_bonds":false,
   "subtitle_field_definition_id":"a3000000-0000-0000-0000-000000000001","fields":[
    {"id":"a3000000-0000-0000-0000-000000000002","key":"description","label":"Description","type":"oracleText",
     "binding":null,"gm_only":false,"sort_order":1,
     "configuration":{"version":1,"suggestions":[],"helpText":"","visible":true,"rules":[
       {"conditions":[{"source":"entry","fieldId":"a3000000-0000-0000-0000-000000000001","operator":"equals","value":"Area"}],"visible":false}]}},
    {"id":"a3000000-0000-0000-0000-000000000001","key":"type","label":"Type","type":"text",
     "binding":null,"gm_only":false,"sort_order":0,
     "configuration":{"version":1,"suggestions":["Area"],"helpText":"","visible":true,"rules":[]}}
   ]},
  {"id":"a2000000-0000-0000-0000-000000000002","name":"Lore","icon":null,"sort_order":1,
   "supports_hierarchy":false,"supports_map":false,"supports_bonds":false,
   "subtitle_field_definition_id":null,"fields":[]}
]}'::jsonb $$;
-- Private test-only fixture helper: production clients cannot seed manifests.
create function pg_temp.world_configuration_fixture(name text, template jsonb) returns uuid
language plpgsql security definer set search_path = '' as $$
declare world_id uuid;
begin
  world_id := public.create_world(name);
  perform public.seed_world_template(world_id,template);
  return world_id;
end $$;
create temporary table world_configuration_worlds (key text primary key, id uuid);
grant all on world_configuration_worlds to authenticated;

set local role authenticated;
select set_config('request.jwt.claim.sub','a1000000-0000-0000-0000-000000000001',true);
select lives_ok($$insert into world_configuration_worlds values ('main', pg_temp.world_configuration_fixture('World configuration test',pg_temp.world_configuration_template()))$$,
  'custom fixture accepts forward condition references');
select is((select count(*) from public.world_categories where world_id = (select id from world_configuration_worlds where key='main')),2::bigint,'creates both categories');
select is((select count(*) from public.world_field_definitions where world_id = (select id from world_configuration_worlds where key='main')),2::bigint,'creates both definitions');
select is((select configuration_customized from public.worlds where id=(select id from world_configuration_worlds where key='main')),true,'materialized fixture is customized');
select lives_ok($$select public.mutate_world_configuration((select id from world_configuration_worlds where key='main'),jsonb_build_object('type','reorder_categories','ids',to_jsonb(array['a2000000-0000-0000-0000-000000000002','a2000000-0000-0000-0000-000000000001']::uuid[])))$$,
 'category reorder accepts a complete permutation');
select is((select sort_order from public.world_categories where id='a2000000-0000-0000-0000-000000000002'),0,'category reorder updates order');
select throws_ok($$select public.mutate_world_configuration((select id from world_configuration_worlds where key='main'),jsonb_build_object('type','reorder_categories','ids',to_jsonb(array['a2000000-0000-0000-0000-000000000002','a2000000-0000-0000-0000-000000000002']::uuid[])))$$,
 'P0001','Reorder must include every category exactly once','duplicate reorder IDs fail atomically');
select lives_ok($$select public.mutate_world_configuration((select id from world_configuration_worlds where key='main'),jsonb_build_object('type','reorder_fields','category_id','a2000000-0000-0000-0000-000000000001','ids',to_jsonb(array['a3000000-0000-0000-0000-000000000002','a3000000-0000-0000-0000-000000000001']::uuid[])))$$,
 'field reorder accepts a complete permutation');
select throws_ok($$select public.mutate_world_configuration((select id from world_configuration_worlds where key='main'),jsonb_build_object('type','reorder_fields','category_id','a2000000-0000-0000-0000-000000000001','ids',to_jsonb(array['a3000000-0000-0000-0000-000000000002','a3000000-0000-0000-0000-000000000099']::uuid[])))$$,
 'P0001','Reorder must include every field exactly once','foreign reorder IDs fail atomically');
select is((select sort_order from public.world_field_definitions where id='a3000000-0000-0000-0000-000000000002'),0,'failed reorder preserves prior order');
select throws_ok($$select pg_temp.world_configuration_fixture('Rollback test','{"version":1,"categories":[{}]}')$$,
  'P0001','Invalid template category','bad manifest is rejected');
select is((select count(*) from public.worlds where name='Rollback test'),0::bigint,'failed seed rolls world creation back');
select throws_ok($$select pg_temp.world_configuration_fixture('Rollback collision',pg_temp.world_configuration_template())$$,
  '23505',null,'client UUID collision fails atomically');
select is((select count(*) from public.worlds where name='Rollback collision'),0::bigint,'collision leaves no half-created world');
select throws_ok($$select public.mutate_world_configuration((select id from world_configuration_worlds where key='main'),jsonb_build_object('type','update_category','id','a2000000-0000-0000-0000-000000000002','changes',(select jsonb_build_object('subtitle_field_definition_id','a3000000-0000-0000-0000-000000000001') from public.world_categories where id='a2000000-0000-0000-0000-000000000002')))$$,'P0001','Subtitle field must belong to this category','cross-category subtitle is rejected');
select throws_ok($$select public.mutate_world_configuration((select id from world_configuration_worlds where key='main'),jsonb_build_object('type','update_field','id','a3000000-0000-0000-0000-000000000001','changes',(select jsonb_build_object('configuration','{}'::jsonb) from public.world_field_definitions where id='a3000000-0000-0000-0000-000000000001')))$$,
  'P0001','Invalid field configuration','malformed configuration is rejected');
select throws_ok($$select public.mutate_world_configuration((select id from world_configuration_worlds where key='main'),jsonb_build_object('type','update_field','id','a3000000-0000-0000-0000-000000000001','changes',(select jsonb_build_object('binding','{"packageId":"test"}'::jsonb) from public.world_field_definitions where id='a3000000-0000-0000-0000-000000000001')))$$,
  'P0001','Invalid oracle binding','incomplete binding is rejected');
select throws_ok($$select public.mutate_world_configuration((select id from world_configuration_worlds where key='main'),jsonb_build_object('type','update_field','id','a3000000-0000-0000-0000-000000000001','changes',(select jsonb_build_object('gm_only',true) from public.world_field_definitions where id='a3000000-0000-0000-0000-000000000001')))$$,
  'P0001','A public field cannot depend on a GM-only field','source visibility edits validate incoming dependencies');
select throws_ok($$select public.mutate_world_configuration((select id from world_configuration_worlds where key='main'),jsonb_build_object('type','delete_field','id','a3000000-0000-0000-0000-000000000001'))$$,
  'P0001','Remove condition references before deleting this field','referenced source cannot be deleted');
select throws_ok($$select public.mutate_world_configuration((select id from world_configuration_worlds where key='main'),jsonb_build_object('type','update_field','id','a3000000-0000-0000-0000-000000000001','changes',(select jsonb_build_object('type','number','configuration',jsonb_set(configuration,'{suggestions}','[]')) from public.world_field_definitions where id='a3000000-0000-0000-0000-000000000001')))$$,
  'P0001','Condition source has an incompatible field type','source type edits validate incoming dependencies');
select throws_ok($$select public.mutate_world_configuration((select id from world_configuration_worlds where key='main'),jsonb_build_object('type','update_field','id','a3000000-0000-0000-0000-000000000002','changes',(select jsonb_build_object('configuration',jsonb_set(configuration,'{rules,0,conditions,0,fieldId}','"a3000000-0000-0000-0000-000000000099"')) from public.world_field_definitions where id='a3000000-0000-0000-0000-000000000002')))$$,
  'P0001','Condition references a missing or foreign-category field','missing condition source is rejected');
select lives_ok($$select public.mutate_world_configuration((select id from world_configuration_worlds where key='main'),jsonb_build_object('type','update_field','id','a3000000-0000-0000-0000-000000000002','changes',(select jsonb_build_object('configuration',jsonb_set(configuration,'{rules,0,conditions,0,fieldId}','"A3000000-0000-0000-0000-000000000001"')) from public.world_field_definitions where id='a3000000-0000-0000-0000-000000000002')))$$,'UUID references accept canonical-equivalent spelling');
select is((select configuration->'rules'->0->'conditions'->0->>'fieldId' from public.world_field_definitions
  where id='a3000000-0000-0000-0000-000000000002'),'a3000000-0000-0000-0000-000000000001',
  'condition references use canonical UUID keys for runtime lookup');
select throws_ok($$select public.mutate_world_configuration((select id from world_configuration_worlds where key='main'),jsonb_build_object('type','delete_field','id','a3000000-0000-0000-0000-000000000001'))$$,
  'P0001','Remove condition references before deleting this field','UUID case cannot bypass deletion references');
select throws_ok($$select public.mutate_world_configuration((select id from world_configuration_worlds where key='main'),jsonb_build_object('type','update_field','id','a3000000-0000-0000-0000-000000000001','changes',(select jsonb_build_object('key','different') from public.world_field_definitions where id='a3000000-0000-0000-0000-000000000001')))$$,
  'P0001','Invalid field changes','stable field keys cannot change');

insert into public.world_entries (id,world_id,category_id,name,author_id) values
 ('a4000000-0000-0000-0000-000000000001',(select id from world_configuration_worlds where key='main'),'a2000000-0000-0000-0000-000000000001','Area','a1000000-0000-0000-0000-000000000001'),
 ('a4000000-0000-0000-0000-000000000002',(select id from world_configuration_worlds where key='main'),'a2000000-0000-0000-0000-000000000002','Lore','a1000000-0000-0000-0000-000000000001');
insert into public.world_entry_field_values (entry_id,field_definition_id,world_id,content)
 values ('a4000000-0000-0000-0000-000000000001','a3000000-0000-0000-0000-000000000002',(select id from world_configuration_worlds where key='main'),'\x010203');
select throws_ok($$insert into public.world_entry_field_values (entry_id,field_definition_id,world_id,value)
 values ('a4000000-0000-0000-0000-000000000002','a3000000-0000-0000-0000-000000000001',(select id from world_configuration_worlds where key='main'),'"forbidden"')$$,
 'P0001','Entry and field definition must belong to the same category and world','cross-category value cannot be inserted');
select lives_ok($$select public.mutate_world_configuration((select id from world_configuration_worlds where key='main'),jsonb_build_object('type','update_field','id','a3000000-0000-0000-0000-000000000002','changes',(select jsonb_build_object('type','richText') from public.world_field_definitions where id='a3000000-0000-0000-0000-000000000002')))$$,
  'compatible Yjs type change succeeds');
select is((select encode(content,'hex') from public.world_entry_field_values where field_definition_id='a3000000-0000-0000-0000-000000000002'),'010203','compatible type change preserves bytes');
select throws_ok($$select public.mutate_world_configuration((select id from world_configuration_worlds where key='main'),jsonb_build_object('type','update_field','id','a3000000-0000-0000-0000-000000000002','changes',(select jsonb_build_object('type','text') from public.world_field_definitions where id='a3000000-0000-0000-0000-000000000002')))$$,
  'P0001','This type change cannot preserve existing values; create a new field','incompatible populated type change is blocked');
select throws_ok($$select public.mutate_world_configuration((select id from world_configuration_worlds where key='main'),jsonb_build_object('type','delete_category','id','a2000000-0000-0000-0000-000000000001'))$$,
  'P0001','Delete category entries and their stored files before deleting the category','populated category deletion is blocked');
select throws_ok($$update public.world_entries set category_id='a2000000-0000-0000-0000-000000000002' where id='a4000000-0000-0000-0000-000000000001'$$,
  'P0001','Entry identity, world and category cannot change','moving entries cannot invalidate existing values');
select lives_ok($$select public.mutate_world_configuration((select id from world_configuration_worlds where key='main'),jsonb_build_object('type','update_field','id','a3000000-0000-0000-0000-000000000002','changes',(select jsonb_build_object('gm_only',true) from public.world_field_definitions where id='a3000000-0000-0000-0000-000000000002')))$$,'dependent field can become GM-only');
select is((select gm_only from public.world_entry_field_values where field_definition_id='a3000000-0000-0000-0000-000000000002'),true,'GM visibility propagates to existing values');
select is(public.get_world_category_counts((select id from world_configuration_worlds where key='main'),'a2000000-0000-0000-0000-000000000001')->>'entryCount','1','editor gets entry count');
select is(public.get_world_category_counts((select id from world_configuration_worlds where key='main'),'a2000000-0000-0000-0000-000000000001')->'valueCounts'->>'a3000000-0000-0000-0000-000000000002','1','editor counts GM values');

insert into public.world_players (world_id,user_id,role) values
  ((select id from world_configuration_worlds where key='main'),'a1000000-0000-0000-0000-000000000002','viewer'),
  ((select id from world_configuration_worlds where key='main'),'a1000000-0000-0000-0000-000000000003','editor');
select set_config('request.jwt.claim.sub','a1000000-0000-0000-0000-000000000002',true);
select throws_ok($$select public.seed_world_template((select id from world_configuration_worlds where key='main'),pg_temp.world_configuration_template())$$,
 '42501','permission denied for function seed_world_template','viewer cannot call retired seed RPC');
select throws_ok($$select public.get_world_category_counts((select id from world_configuration_worlds where key='main'),'a2000000-0000-0000-0000-000000000001')$$,
 '42501','Only world editors can count category content','viewer cannot infer private counts');
select is((select count(*) from public.world_entry_field_values where field_definition_id='a3000000-0000-0000-0000-000000000002'),0::bigint,'viewer cannot see GM values');
select is(public.get_world_playsets((select id from world_configuration_worlds where key='main')),'[]'::jsonb,'world viewer can read playset union');
select set_config('request.jwt.claim.sub','a1000000-0000-0000-0000-000000000003',true);
select is(public.get_world_category_counts((select id from world_configuration_worlds where key='main'),'a2000000-0000-0000-0000-000000000001')->>'entryCount','1','editor member may count');

reset role;
insert into public.games (id,name,game_type,world_id,rulesets,expansions,playset) values
 ('a5000000-0000-0000-0000-000000000001','Private game','guided',(select id from world_configuration_worlds where key='main'),'["starforged"]','[]','{}');
insert into public.game_players (game_id,user_id,role) values
 ('a5000000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000004','guide');
alter table public.worlds disable trigger worlds_set_updated_at;
update public.worlds set updated_at='2000-01-01' where id=(select id from world_configuration_worlds where key='main');
alter table public.worlds enable trigger worlds_set_updated_at;
update public.games set playset='{"oracles":{}}' where id='a5000000-0000-0000-0000-000000000001';
select ok((select updated_at > '2000-01-01' from public.worlds where id=(select id from world_configuration_worlds where key='main')),
 'linked game playset edits invalidate world subscribers');
update public.games set playset='{}' where id='a5000000-0000-0000-0000-000000000001';
set local role authenticated;
select set_config('request.jwt.claim.sub','a1000000-0000-0000-0000-000000000002',true);
select ok(not (public.get_world_playsets((select id from world_configuration_worlds where key='main'))->0 ?| array['id','name','world_id']),
 'playset union exposes no game identity');
select is(public.get_world_playsets((select id from world_configuration_worlds where key='main')),
 '[{"rulesets":["starforged"],"expansions":[],"playset":{}}]'::jsonb,'union includes private linked game without its identity');
select set_config('request.jwt.claim.sub','a1000000-0000-0000-0000-000000000099',true);
select throws_ok($$select public.get_world_playsets((select id from world_configuration_worlds where key='main'))$$,
 '42501','Only world members can read linked playsets','nonmembers cannot read union');

select set_config('request.jwt.claim.sub','a1000000-0000-0000-0000-000000000004',true);
select is(public.world_role((select id from world_configuration_worlds where key='main'),auth.uid()),'guide','guide fixture derives permissions through linked game');
select lives_ok($$select public.mutate_world_configuration((select id from world_configuration_worlds where key='main'),jsonb_build_object('type','update_field','id','a3000000-0000-0000-0000-000000000002','changes',(select jsonb_build_object('label','Guide description') from public.world_field_definitions where id='a3000000-0000-0000-0000-000000000002')))$$,
 'guides retain definition edit rights');
select is(public.get_world_category_counts((select id from world_configuration_worlds where key='main'),'a2000000-0000-0000-0000-000000000001')->'valueCounts'->>'a3000000-0000-0000-0000-000000000002','1','guides can count private values for type validation');
select throws_ok($$select public.mutate_world_configuration((select id from world_configuration_worlds where key='main'),'{"type":"delete_field","id":"a3000000-0000-0000-0000-000000000002"}')$$,
 '42501','Only world owners and editors can delete configuration','guides cannot delete definitions');
select throws_ok($$select public.mutate_world_configuration((select id from world_configuration_worlds where key='main'),'{"type":"delete_category","id":"a2000000-0000-0000-0000-000000000002"}')$$,
 '42501','Only world owners and editors can delete configuration','guides cannot delete categories');

select set_config('request.jwt.claim.sub','a1000000-0000-0000-0000-000000000001',true);
select public.mutate_world_configuration((select id from world_configuration_worlds where key='main'),'{"type":"create_field","category_id":"a2000000-0000-0000-0000-000000000001","field":{"id":"a3000000-0000-0000-0000-000000000003","key":"selector","label":"Selector","type":"text","gm_only":true}}');
select public.mutate_world_configuration((select id from world_configuration_worlds where key='main'),'{"type":"create_field","category_id":"a2000000-0000-0000-0000-000000000002","field":{"id":"a3000000-0000-0000-0000-000000000004","key":"foreign","label":"Foreign","type":"text","gm_only":false}}');
select lives_ok($$select public.mutate_world_configuration((select id from world_configuration_worlds where key='main'),jsonb_build_object('type','update_field','id','a3000000-0000-0000-0000-000000000002','changes',(select jsonb_build_object('configuration',jsonb_set(configuration,'{rules}',
 '[{"conditions":[{"source":"ancestor","fieldId":"a3000000-0000-0000-0000-000000000001","operator":"equals","value":"Area","ancestor":{"fieldId":"A3000000-0000-0000-0000-000000000003","value":"Area"}}],"binding":null}]')) from public.world_field_definitions where id='a3000000-0000-0000-0000-000000000002')))$$,'nearest ancestor conditions accept a same-category text selector');
select is((select configuration->'rules'->0->'conditions'->0->'ancestor'->>'fieldId' from public.world_field_definitions
  where id='a3000000-0000-0000-0000-000000000002'),'a3000000-0000-0000-0000-000000000003',
  'ancestor selector references use canonical UUID keys for runtime lookup');
select throws_ok($$select public.mutate_world_configuration((select id from world_configuration_worlds where key='main'),jsonb_build_object('type','update_field','id','a3000000-0000-0000-0000-000000000002','changes',(select jsonb_build_object('gm_only',false) from public.world_field_definitions where id='a3000000-0000-0000-0000-000000000002')))$$,
 'P0001','A public field cannot depend on a GM-only ancestor selector','target visibility edits validate ancestor GM dependency');
select throws_ok($$select public.mutate_world_configuration((select id from world_configuration_worlds where key='main'),jsonb_build_object('type','delete_field','id','a3000000-0000-0000-0000-000000000003'))$$,
 'P0001','Remove condition references before deleting this field','ancestor selector cannot be deleted while referenced');
select throws_ok($$select public.mutate_world_configuration((select id from world_configuration_worlds where key='main'),jsonb_build_object('type','update_field','id','a3000000-0000-0000-0000-000000000003','changes',(select jsonb_build_object('type','number') from public.world_field_definitions where id='a3000000-0000-0000-0000-000000000003')))$$,
 'P0001','Ancestor selector must reference a text field in the same category','ancestor selector type changes are checked');
select throws_ok($$select public.mutate_world_configuration((select id from world_configuration_worlds where key='main'),jsonb_build_object('type','update_field','id','a3000000-0000-0000-0000-000000000002','changes',(select jsonb_build_object('configuration',jsonb_set(configuration,'{rules,0,conditions,0,fieldId}','"a3000000-0000-0000-0000-000000000004"')) from public.world_field_definitions where id='a3000000-0000-0000-0000-000000000002')))$$,
 'P0001','Condition references a missing or foreign-category field','foreign-category condition references are rejected');
insert into world_configuration_worlds values ('legacy',pg_temp.world_configuration_fixture('Existing custom world',
 replace(replace(pg_temp.world_configuration_template()::text,'a2000000','b2000000'),'a3000000','b3000000')::jsonb));
select lives_ok($$select public.mutate_world_configuration((select id from world_configuration_worlds where key='legacy'),
 jsonb_build_object('type','delete_category','id',id)) from public.world_categories where world_id=(select id from world_configuration_worlds where key='legacy')$$,
 'empty custom categories can be deleted with their field dependency graph');
select is((select configuration_customized from public.worlds where id=(select id from world_configuration_worlds where key='legacy')),true,'deleted defaults retain customized state');
select is((select count(*) from public.world_categories where world_id=(select id from world_configuration_worlds where key='legacy')),0::bigint,'deleted custom configuration stays empty');
insert into world_configuration_worlds values ('cascade', pg_temp.world_configuration_fixture('Cascade world',
 replace(replace(pg_temp.world_configuration_template()::text,'a2000000','c2000000'),'a3000000','c3000000')::jsonb));
insert into public.world_entries (id,world_id,category_id,name,author_id) values
 ('c4000000-0000-0000-0000-000000000001',(select id from world_configuration_worlds where key='cascade'),
 'c2000000-0000-0000-0000-000000000001','Cascade entry',auth.uid());
insert into public.world_entry_field_values (entry_id,field_definition_id,world_id,value) values
 ('c4000000-0000-0000-0000-000000000001','c3000000-0000-0000-0000-000000000001',(select id from world_configuration_worlds where key='cascade'),'"Area"');
select lives_ok($$delete from public.worlds where id=(select id from world_configuration_worlds where key='cascade')$$,
 'world deletion cascades populated categories and interdependent fields');
select is((select count(*) from public.world_entry_field_values where entry_id='c4000000-0000-0000-0000-000000000001'),0::bigint,
 'world deletion cascades values');
select throws_ok($$insert into public.world_categories (id,world_id,name) values
 ('a2000000-0000-0000-0000-000000000003',(select id from world_configuration_worlds where key='main'),'Bypass')$$,
 '42501',null,'clients cannot bypass atomic configuration mutation with direct inserts');
select throws_ok($$update public.world_field_definitions set label='Bypass' where id='a3000000-0000-0000-0000-000000000001'$$,
 '42501',null,'clients cannot bypass atomic configuration mutation with direct updates');
select throws_ok($$delete from public.world_template_receipts$$,'42501',null,'clients cannot erase seed receipts');
select lives_ok($$select public.mutate_world_configuration((select id from world_configuration_worlds where key='main'),jsonb_build_object('type','delete_field','id','a3000000-0000-0000-0000-000000000002'))$$,'unreferenced field deletion succeeds');
select is((select count(*) from public.world_entry_field_values where field_definition_id='a3000000-0000-0000-0000-000000000002'),0::bigint,'field deletion cascades values');
select lives_ok($$select public.mutate_world_configuration((select id from world_configuration_worlds where key='main'),jsonb_build_object('type','delete_field','id','a3000000-0000-0000-0000-000000000001'))$$,'subtitle field can be deleted after references are removed');
select is((select subtitle_field_definition_id from public.world_categories where id='a2000000-0000-0000-0000-000000000001'),null::uuid,'deleting subtitle clears category pointer');
reset role;

select ok(not has_function_privilege('anon','public.seed_world_template(uuid,jsonb)','EXECUTE'),'anonymous seed RPC denied');
select ok(not has_function_privilege('anon','public.get_world_category_counts(uuid,uuid)','EXECUTE'),'anonymous count RPC denied');
select ok(not has_function_privilege('authenticated','public.world_configuration_validate_category_fields(uuid)','EXECUTE'),'internal dependency validator is not exposed');
select * from finish();
rollback;
