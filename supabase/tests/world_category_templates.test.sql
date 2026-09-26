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

create function pg_temp.w4_template() returns jsonb language sql as $$
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
create temporary table w4_worlds (key text primary key, id uuid);
grant all on w4_worlds to authenticated;

set local role authenticated;
select set_config('request.jwt.claim.sub','a1000000-0000-0000-0000-000000000001',true);
select lives_ok($$insert into w4_worlds values ('main', public.create_world_with_template('W4 test',null,null,pg_temp.w4_template()))$$,
  'atomic creation accepts forward condition references');
select is((select count(*) from public.world_categories where world_id = (select id from w4_worlds where key='main')),2::bigint,'creates both categories');
select is((select count(*) from public.world_field_definitions where world_id = (select id from w4_worlds where key='main')),2::bigint,'creates both definitions');
select is(public.seed_world_template((select id from w4_worlds where key='main'),pg_temp.w4_template()),false,'retry is an atomic no-op');
select lives_ok($$select public.reorder_world_categories((select id from w4_worlds where key='main'),array['a2000000-0000-0000-0000-000000000002','a2000000-0000-0000-0000-000000000001']::uuid[])$$,
 'category reorder accepts a complete permutation');
select is((select sort_order from public.world_categories where id='a2000000-0000-0000-0000-000000000002'),0,'category reorder updates order');
select throws_ok($$select public.reorder_world_categories((select id from w4_worlds where key='main'),array['a2000000-0000-0000-0000-000000000002','a2000000-0000-0000-0000-000000000002']::uuid[])$$,
 'P0001','Reorder must include every category exactly once','duplicate reorder IDs fail atomically');
select lives_ok($$select public.reorder_world_fields('a2000000-0000-0000-0000-000000000001',array['a3000000-0000-0000-0000-000000000002','a3000000-0000-0000-0000-000000000001']::uuid[])$$,
 'field reorder accepts a complete permutation');
select throws_ok($$select public.reorder_world_fields('a2000000-0000-0000-0000-000000000001',array['a3000000-0000-0000-0000-000000000002','a3000000-0000-0000-0000-000000000099']::uuid[])$$,
 'P0001','Reorder must include every field exactly once','foreign reorder IDs fail atomically');
select is((select sort_order from public.world_field_definitions where id='a3000000-0000-0000-0000-000000000002'),0,'failed reorder preserves prior order');
select throws_ok($$select public.create_world_with_template('Rollback test',null,null,'{"version":1,"categories":[{}]}')$$,
  'P0001','Invalid template category','bad manifest is rejected');
select is((select count(*) from public.worlds where name='Rollback test'),0::bigint,'failed seed rolls world creation back');
select throws_ok($$select public.create_world_with_template('Rollback collision',null,null,pg_temp.w4_template())$$,
  '23505',null,'client UUID collision fails atomically');
select is((select count(*) from public.worlds where name='Rollback collision'),0::bigint,'collision leaves no half-created world');
select throws_ok($$update public.world_categories set subtitle_field_definition_id='a3000000-0000-0000-0000-000000000001'
  where id='a2000000-0000-0000-0000-000000000002'$$,'P0001','Subtitle field must belong to this category','cross-category subtitle is rejected');
select throws_ok($$update public.world_field_definitions set configuration='{}' where id='a3000000-0000-0000-0000-000000000001'$$,
  'P0001','Invalid field configuration','malformed configuration is rejected');
select throws_ok($$update public.world_field_definitions set binding='{"packageId":"test"}' where id='a3000000-0000-0000-0000-000000000001'$$,
  'P0001','Invalid oracle binding','incomplete binding is rejected');
select throws_ok($$update public.world_field_definitions set gm_only=true where id='a3000000-0000-0000-0000-000000000001'$$,
  'P0001','A public field cannot depend on a GM-only field','source visibility edits validate incoming dependencies');
select throws_ok($$delete from public.world_field_definitions where id='a3000000-0000-0000-0000-000000000001'$$,
  'P0001','Remove condition references before deleting this field','referenced source cannot be deleted');
select throws_ok($$update public.world_field_definitions set type='number', configuration=jsonb_set(configuration,'{suggestions}','[]')
  where id='a3000000-0000-0000-0000-000000000001'$$,
  'P0001','Condition source has an incompatible field type','source type edits validate incoming dependencies');
select throws_ok($$update public.world_field_definitions set configuration=jsonb_set(configuration,'{rules,0,conditions,0,fieldId}','"a3000000-0000-0000-0000-000000000099"')
  where id='a3000000-0000-0000-0000-000000000002'$$,
  'P0001','Condition references a missing or foreign-category field','missing condition source is rejected');
select lives_ok($$update public.world_field_definitions set configuration=jsonb_set(configuration,'{rules,0,conditions,0,fieldId}','"A3000000-0000-0000-0000-000000000001"')
  where id='a3000000-0000-0000-0000-000000000002'$$,'UUID references accept canonical-equivalent spelling');
select is((select configuration->'rules'->0->'conditions'->0->>'fieldId' from public.world_field_definitions
  where id='a3000000-0000-0000-0000-000000000002'),'a3000000-0000-0000-0000-000000000001',
  'condition references use canonical UUID keys for runtime lookup');
select throws_ok($$delete from public.world_field_definitions where id='a3000000-0000-0000-0000-000000000001'$$,
  'P0001','Remove condition references before deleting this field','UUID case cannot bypass deletion references');
select throws_ok($$update public.world_field_definitions set key='different' where id='a3000000-0000-0000-0000-000000000001'$$,
  'P0001','Field identity, category and key cannot change','stable field keys cannot change');

insert into public.world_entries (id,world_id,category_id,name,author_id) values
 ('a4000000-0000-0000-0000-000000000001',(select id from w4_worlds where key='main'),'a2000000-0000-0000-0000-000000000001','Area','a1000000-0000-0000-0000-000000000001'),
 ('a4000000-0000-0000-0000-000000000002',(select id from w4_worlds where key='main'),'a2000000-0000-0000-0000-000000000002','Lore','a1000000-0000-0000-0000-000000000001');
insert into public.world_entry_field_values (entry_id,field_definition_id,world_id,content)
 values ('a4000000-0000-0000-0000-000000000001','a3000000-0000-0000-0000-000000000002',(select id from w4_worlds where key='main'),'\x010203');
select throws_ok($$insert into public.world_entry_field_values (entry_id,field_definition_id,world_id,value)
 values ('a4000000-0000-0000-0000-000000000002','a3000000-0000-0000-0000-000000000001',(select id from w4_worlds where key='main'),'"forbidden"')$$,
 'P0001','Entry and field definition must belong to the same category and world','cross-category value cannot be inserted');
select lives_ok($$update public.world_field_definitions set type='richText' where id='a3000000-0000-0000-0000-000000000002'$$,
  'compatible Yjs type change succeeds');
select is((select encode(content,'hex') from public.world_entry_field_values where field_definition_id='a3000000-0000-0000-0000-000000000002'),'010203','compatible type change preserves bytes');
select throws_ok($$update public.world_field_definitions set type='text' where id='a3000000-0000-0000-0000-000000000002'$$,
  'P0001','This type change cannot preserve existing values; create a new field','incompatible populated type change is blocked');
select throws_ok($$delete from public.world_categories where id='a2000000-0000-0000-0000-000000000001'$$,
  'P0001','Delete category entries and their stored files before deleting the category','populated category deletion is blocked');
select throws_ok($$update public.world_entries set category_id='a2000000-0000-0000-0000-000000000002' where id='a4000000-0000-0000-0000-000000000001'$$,
  'P0001','Entry identity, world and category cannot change','moving entries cannot invalidate existing values');
select lives_ok($$update public.world_field_definitions set gm_only=true where id='a3000000-0000-0000-0000-000000000002'$$,'dependent field can become GM-only');
select is((select gm_only from public.world_entry_field_values where field_definition_id='a3000000-0000-0000-0000-000000000002'),true,'GM visibility propagates to existing values');
select is(public.get_world_category_counts('a2000000-0000-0000-0000-000000000001')->>'entryCount','1','editor gets entry count');
select is(public.get_world_category_counts('a2000000-0000-0000-0000-000000000001')->'valueCounts'->>'a3000000-0000-0000-0000-000000000002','1','editor counts GM values');

insert into public.world_players (world_id,user_id,role) values
  ((select id from w4_worlds where key='main'),'a1000000-0000-0000-0000-000000000002','viewer'),
  ((select id from w4_worlds where key='main'),'a1000000-0000-0000-0000-000000000003','editor');
select set_config('request.jwt.claim.sub','a1000000-0000-0000-0000-000000000002',true);
select throws_ok($$select public.seed_world_template((select id from w4_worlds where key='main'),pg_temp.w4_template())$$,
 '42501','Only world editors can seed a template','viewer cannot seed even an existing world');
select throws_ok($$select public.get_world_category_counts('a2000000-0000-0000-0000-000000000001')$$,
 '42501','Only world editors can count category content','viewer cannot infer private counts');
select is((select count(*) from public.world_entry_field_values where field_definition_id='a3000000-0000-0000-0000-000000000002'),0::bigint,'viewer cannot see GM values');
select is(public.get_world_playsets((select id from w4_worlds where key='main')),'[]'::jsonb,'world viewer can read playset union');
select set_config('request.jwt.claim.sub','a1000000-0000-0000-0000-000000000003',true);
select is(public.get_world_category_counts('a2000000-0000-0000-0000-000000000001')->>'entryCount','1','editor member may count');

reset role;
insert into public.games (id,name,game_type,world_id,rulesets,expansions,playset) values
 ('a5000000-0000-0000-0000-000000000001','Private game','guided',(select id from w4_worlds where key='main'),'["starforged"]','[]','{}');
insert into public.game_players (game_id,user_id,role) values
 ('a5000000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000004','guide');
alter table public.worlds disable trigger worlds_set_updated_at;
update public.worlds set updated_at='2000-01-01' where id=(select id from w4_worlds where key='main');
alter table public.worlds enable trigger worlds_set_updated_at;
update public.games set playset='{"oracles":{}}' where id='a5000000-0000-0000-0000-000000000001';
select ok((select updated_at > '2000-01-01' from public.worlds where id=(select id from w4_worlds where key='main')),
 'linked game playset edits invalidate world subscribers');
update public.games set playset='{}' where id='a5000000-0000-0000-0000-000000000001';
set local role authenticated;
select set_config('request.jwt.claim.sub','a1000000-0000-0000-0000-000000000002',true);
select ok(not (public.get_world_playsets((select id from w4_worlds where key='main'))->0 ?| array['id','name','world_id']),
 'playset union exposes no game identity');
select is(public.get_world_playsets((select id from w4_worlds where key='main')),
 '[{"rulesets":["starforged"],"expansions":[],"playset":{}}]'::jsonb,'union includes private linked game without its identity');
select set_config('request.jwt.claim.sub','a1000000-0000-0000-0000-000000000099',true);
select throws_ok($$select public.get_world_playsets((select id from w4_worlds where key='main'))$$,
 '42501','Only world members can read linked playsets','nonmembers cannot read union');

select set_config('request.jwt.claim.sub','a1000000-0000-0000-0000-000000000004',true);
select is(public.world_role((select id from w4_worlds where key='main'),auth.uid()),'guide','guide fixture derives permissions through linked game');
select lives_ok($$update public.world_field_definitions set label='Guide description' where id='a3000000-0000-0000-0000-000000000002'$$,
 'guides retain definition edit rights');
select is(public.get_world_category_counts('a2000000-0000-0000-0000-000000000001')->'valueCounts'->>'a3000000-0000-0000-0000-000000000002','1','guides can count private values for type validation');
with deleted as (delete from public.world_field_definitions where id='a3000000-0000-0000-0000-000000000002' returning id)
select is((select count(*) from deleted),0::bigint,
 'guides cannot delete definitions');
with deleted as (delete from public.world_categories where id='a2000000-0000-0000-0000-000000000002' returning id)
select is((select count(*) from deleted),0::bigint,
 'guides cannot delete categories');

select set_config('request.jwt.claim.sub','a1000000-0000-0000-0000-000000000001',true);
insert into public.world_field_definitions (id,category_id,world_id,key,label,type,gm_only) values
 ('a3000000-0000-0000-0000-000000000003','a2000000-0000-0000-0000-000000000001',(select id from w4_worlds where key='main'),'selector','Selector','text',true),
 ('a3000000-0000-0000-0000-000000000004','a2000000-0000-0000-0000-000000000002',(select id from w4_worlds where key='main'),'foreign','Foreign','text',false);
select lives_ok($$update public.world_field_definitions set configuration=jsonb_set(configuration,'{rules}',
 '[{"conditions":[{"source":"ancestor","fieldId":"a3000000-0000-0000-0000-000000000001","operator":"equals","value":"Area","ancestor":{"fieldId":"A3000000-0000-0000-0000-000000000003","value":"Area"}}],"binding":null}]')
 where id='a3000000-0000-0000-0000-000000000002'$$,'nearest ancestor conditions accept a same-category text selector');
select is((select configuration->'rules'->0->'conditions'->0->'ancestor'->>'fieldId' from public.world_field_definitions
  where id='a3000000-0000-0000-0000-000000000002'),'a3000000-0000-0000-0000-000000000003',
  'ancestor selector references use canonical UUID keys for runtime lookup');
select throws_ok($$update public.world_field_definitions set gm_only=false where id='a3000000-0000-0000-0000-000000000002'$$,
 'P0001','A public field cannot depend on a GM-only ancestor selector','target visibility edits validate ancestor GM dependency');
select throws_ok($$delete from public.world_field_definitions where id='a3000000-0000-0000-0000-000000000003'$$,
 'P0001','Remove condition references before deleting this field','ancestor selector cannot be deleted while referenced');
select throws_ok($$update public.world_field_definitions set type='number' where id='a3000000-0000-0000-0000-000000000003'$$,
 'P0001','Ancestor selector must reference a text field in the same category','ancestor selector type changes are checked');
select throws_ok($$update public.world_field_definitions set configuration=jsonb_set(configuration,'{rules,0,conditions,0,fieldId}','"a3000000-0000-0000-0000-000000000004"')
 where id='a3000000-0000-0000-0000-000000000002'$$,
 'P0001','Condition references a missing or foreign-category field','foreign-category condition references are rejected');
insert into w4_worlds values ('legacy',public.create_world('Legacy empty world'));
select is(public.seed_world_template((select id from w4_worlds where key='legacy'),
 replace(replace(pg_temp.w4_template()::text,'a2000000','b2000000'),'a3000000','b3000000')::jsonb),true,'legacy empty world is backfilled');
select lives_ok($$delete from public.world_categories where world_id=(select id from w4_worlds where key='legacy')$$,
 'empty seeded categories can be deleted with their field dependency graph');
select is(public.seed_world_template((select id from w4_worlds where key='legacy'),pg_temp.w4_template()),false,'deleted defaults are not reapplied');
insert into w4_worlds values ('cascade', public.create_world_with_template('Cascade world',null,null,
 replace(replace(pg_temp.w4_template()::text,'a2000000','c2000000'),'a3000000','c3000000')::jsonb));
insert into public.world_entries (id,world_id,category_id,name,author_id) values
 ('c4000000-0000-0000-0000-000000000001',(select id from w4_worlds where key='cascade'),
 'c2000000-0000-0000-0000-000000000001','Cascade entry',auth.uid());
insert into public.world_entry_field_values (entry_id,field_definition_id,world_id,value) values
 ('c4000000-0000-0000-0000-000000000001','c3000000-0000-0000-0000-000000000001',(select id from w4_worlds where key='cascade'),'"Area"');
select lives_ok($$delete from public.worlds where id=(select id from w4_worlds where key='cascade')$$,
 'world deletion cascades populated categories and interdependent fields');
select is((select count(*) from public.world_entry_field_values where entry_id='c4000000-0000-0000-0000-000000000001'),0::bigint,
 'world deletion cascades values');
insert into w4_worlds values ('manual',public.create_world('Manual world'));
insert into public.world_categories (id,world_id,name) values
 ('a2000000-0000-0000-0000-000000000003',(select id from w4_worlds where key='manual'),'Custom');
select is(public.seed_world_template((select id from w4_worlds where key='manual'),pg_temp.w4_template()),false,'customized worlds remain untouched');
delete from public.world_categories where id='a2000000-0000-0000-0000-000000000003';
select is(public.seed_world_template((select id from w4_worlds where key='manual'),pg_temp.w4_template()),false,'deleted customization is not silently reseeded');
select throws_ok($$delete from public.world_template_receipts$$,'42501',null,'clients cannot erase seed receipts');
select lives_ok($$delete from public.world_field_definitions where id='a3000000-0000-0000-0000-000000000002'$$,'unreferenced field deletion succeeds');
select is((select count(*) from public.world_entry_field_values where field_definition_id='a3000000-0000-0000-0000-000000000002'),0::bigint,'field deletion cascades values');
select lives_ok($$delete from public.world_field_definitions where id='a3000000-0000-0000-0000-000000000001'$$,'subtitle field can be deleted after references are removed');
select is((select subtitle_field_definition_id from public.world_categories where id='a2000000-0000-0000-0000-000000000001'),null::uuid,'deleting subtitle clears category pointer');
reset role;

select ok(not has_function_privilege('anon','public.seed_world_template(uuid,jsonb)','EXECUTE'),'anonymous seed RPC denied');
select ok(not has_function_privilege('anon','public.create_world_with_template(text,text,text,jsonb)','EXECUTE'),'anonymous create RPC denied');
select ok(not has_function_privilege('anon','public.get_world_category_counts(uuid)','EXECUTE'),'anonymous count RPC denied');
select ok(not has_function_privilege('authenticated','public.w4_validate_category_fields(uuid)','EXECUTE'),'internal dependency validator is not exposed');
select * from finish();
rollback;
