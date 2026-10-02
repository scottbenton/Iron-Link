-- Defaults, atomic first edits and the virtual-definition security boundary.
begin;
create extension if not exists pgtap with schema extensions;
set search_path = public,extensions;
select no_plan();
insert into auth.users(id) values
 ('b1000000-0000-4000-8000-000000000001'),
 ('b1000000-0000-4000-8000-000000000002'),
 ('b1000000-0000-4000-8000-000000000003'),
 ('b1000000-0000-4000-8000-000000000004');
create temporary table inherited_worlds(key text primary key,id uuid);
grant all on inherited_worlds to authenticated;
create function pg_temp.world_id(p_key text) returns uuid language sql as $$select id from inherited_worlds where key=p_key$$;
create function pg_temp.category_id(p_key text,p_category text default 'locations') returns uuid language sql as $$
 select extensions.uuid_generate_v5(pg_temp.world_id(p_key),'category:'||p_category)$$;
create function pg_temp.field_id(p_key text,p_field text,p_category text default 'locations') returns uuid language sql as $$
 select extensions.uuid_generate_v5(pg_temp.world_id(p_key),'field:'||p_category||':'||p_field)$$;
set local role authenticated;
select set_config('request.jwt.claim.sub','b1000000-0000-4000-8000-000000000001',true);
insert into inherited_worlds values ('main',public.create_world('Static world',null,'world:classic/ironlands')),
 ('blank',public.create_world('Blank world')),('rollback',public.create_world('Rollback static world'));
select throws_ok($$select public.mutate_world_configuration(pg_temp.world_id('main'),'{}')$$,
 'P0001','Invalid configuration operation','missing operation type cannot silently fork');
select is((select configuration_customized from public.worlds where id=pg_temp.world_id('main')),false,'world begins inherited');
select is((select count(*) from public.world_categories where world_id=pg_temp.world_id('main')),0::bigint,'creation writes no categories');
select is((select count(*) from public.world_field_definitions where world_id=pg_temp.world_id('main')),0::bigint,'creation writes no field definitions');
select is(public.get_world_category_counts(pg_temp.world_id('main'),pg_temp.category_id('main'))->>'entryCount','0','static category counts work without materializing');
select lives_ok($$insert into public.world_entries(id,world_id,category_id,name,author_id) values
 ('b4000000-0000-4000-8000-000000000001',pg_temp.world_id('main'),pg_temp.category_id('main'),'Static settlement',auth.uid())$$,
 'entry creation supports authoritative static category');
select lives_ok($$insert into public.world_entry_field_values(entry_id,field_definition_id,world_id,value,gm_only) values
 ('b4000000-0000-4000-8000-000000000001',pg_temp.field_id('main','locationType'),pg_temp.world_id('blank'),'"Settlement"',true)$$,
 'public values derive correct world and visibility from static definition');
select is((select world_id from public.world_entry_field_values where entry_id='b4000000-0000-4000-8000-000000000001'),pg_temp.world_id('main'),'client cannot spoof parent world');
select is((select gm_only from public.world_entry_field_values where entry_id='b4000000-0000-4000-8000-000000000001'),false,'client cannot spoof public field visibility');
select lives_ok($$insert into public.world_entry_field_values(entry_id,field_definition_id,world_id,content,gm_only) values
 ('b4000000-0000-4000-8000-000000000001',pg_temp.field_id('main','description'),pg_temp.world_id('main'),'\x010203',false)$$,
 'GM oracle content can be stored before customization');
select is((select gm_only from public.world_entry_field_values where field_definition_id=pg_temp.field_id('main','description')),true,'GM visibility is derived from trusted defaults');
select is((select configuration_customized from public.worlds where id=pg_temp.world_id('main')),false,'entry and value writes do not fork');
select is((select count(*) from public.world_categories where world_id=pg_temp.world_id('main')),0::bigint,'entry and value writes leave categories virtual');
select throws_ok($$insert into public.world_entries(world_id,category_id,name,author_id) values
 (pg_temp.world_id('main'),pg_temp.category_id('blank'),'Foreign category',auth.uid())$$,'P0001','Entry category must belong to its world','foreign virtual categories rejected');
select throws_ok($$insert into public.world_entry_field_values(entry_id,field_definition_id,world_id,value) values
 ('b4000000-0000-4000-8000-000000000001',pg_temp.field_id('blank','locationType'),pg_temp.world_id('main'),'"Unknown"')$$,
 'P0001','Entry and field definition must belong to the same category and world','foreign virtual fields rejected');
select throws_ok($$update public.worlds set setting_key='world:starforged/forge' where id=pg_temp.world_id('main')$$,
 'P0001','Customize the world configuration before changing a populated world setting','setting changes cannot reinterpret inherited entries');
update public.worlds set configuration_customized=true where id=pg_temp.world_id('main');
select is((select configuration_customized from public.worlds where id=pg_temp.world_id('main')),false,'client cannot forge customized state');
select throws_ok($$select public.mutate_world_configuration(pg_temp.world_id('rollback'),jsonb_build_object('type','update_field','id',pg_temp.field_id('rollback','locationType'),'changes',jsonb_build_object('type','invalid')))$$,
 '23514',null,'invalid first mutation is rejected');
select is((select configuration_customized from public.worlds where id=pg_temp.world_id('rollback')),false,'failed first mutation rolls back marker');
select is((select count(*) from public.world_categories where world_id=pg_temp.world_id('rollback')),0::bigint,'failed first mutation rolls back all copied defaults');
select throws_ok($$select public.mutate_world_configuration(pg_temp.world_id('main'),jsonb_build_object('type','update_category','id',pg_temp.category_id('blank'),'changes',jsonb_build_object('name','Foreign')))$$,
 'P0001','Unknown world category','foreign mutation fails without forking');
select is((select configuration_customized from public.worlds where id=pg_temp.world_id('main')),false,'foreign mutation leaves inheritance intact');
select lives_ok($$select public.mutate_world_configuration(pg_temp.world_id('main'),jsonb_build_object('type','update_category','id',pg_temp.category_id('main'),'changes',jsonb_build_object('name','Places')))$$,
 'first configuration edit atomically copies defaults and edits');
select is((select configuration_customized from public.worlds where id=pg_temp.world_id('main')),true,'successful first edit marks customized');
select is((select count(*) from public.world_categories where world_id=pg_temp.world_id('main')),3::bigint,'first edit copies whole configuration');
select is((select name from public.world_categories where id=pg_temp.category_id('main')),'Places','requested change is applied');
select is((select value from public.world_entry_field_values where field_definition_id=pg_temp.field_id('main','locationType')),'"Settlement"'::jsonb,'fork preserves public value identity');
select is((select encode(content,'hex') from public.world_entry_field_values where field_definition_id=pg_temp.field_id('main','description')),'010203','fork preserves Yjs content');
select is(public.get_world_category_counts(pg_temp.world_id('main'),pg_temp.category_id('main'))->>'entryCount','1','customized counts retain inherited entries');
select lives_ok($$select public.mutate_world_configuration(pg_temp.world_id('main'),jsonb_build_object('type','update_category','id',pg_temp.category_id('main','lore'),'changes',jsonb_build_object('name','Knowledge')))$$,
 'later edit updates existing configuration');
select is((select name from public.world_categories where id=pg_temp.category_id('main')),'Places','later edit preserves previous changes');
update public.worlds set configuration_customized=false where id=pg_temp.world_id('main');
select is((select configuration_customized from public.worlds where id=pg_temp.world_id('main')),true,'client cannot reattach customized world');
select throws_ok($$insert into public.world_categories(world_id,name) values(pg_temp.world_id('main'),'Bypass')$$,'42501',null,'direct category writes cannot bypass fork transaction');
select throws_ok($$update public.world_field_definitions set label='Bypass' where world_id=pg_temp.world_id('main')$$,'42501',null,'direct field writes cannot bypass mutation authorization');
select throws_ok($$select public.seed_world_template(pg_temp.world_id('blank'),'{}')$$,'42501',null,'legacy seed is no longer public');

insert into public.world_players(world_id,user_id,role) values
 (pg_temp.world_id('main'),'b1000000-0000-4000-8000-000000000002','viewer');
select set_config('request.jwt.claim.sub','b1000000-0000-4000-8000-000000000002',true);
select is((select count(*) from public.world_entry_field_values where field_definition_id=pg_temp.field_id('main','description')),0::bigint,'viewer cannot read inherited GM content after fork');
select throws_ok($$select public.mutate_world_configuration(pg_temp.world_id('main'),jsonb_build_object('type','delete_category','id',pg_temp.category_id('main')))$$,
 '42501','Only world editors can change configuration','viewer cannot mutate configuration');
select set_config('request.jwt.claim.sub','b1000000-0000-4000-8000-000000000003',true);
select throws_ok($$select public.mutate_world_configuration(pg_temp.world_id('blank'),'{}')$$,
 '42501','Only world editors can change configuration','nonmember cannot mutate configuration');
select throws_ok($$select public.get_world_category_counts(pg_temp.world_id('blank'),pg_temp.category_id('blank'))$$,
 '42501','Only world editors can count category content','nonmember cannot count virtual content');
reset role;
insert into public.games(id,name,game_type,world_id,rulesets,expansions,playset) values
 ('b5000000-0000-4000-8000-000000000001','Guide game','guided',pg_temp.world_id('blank'),'["classic"]','[]','{}');
insert into public.game_players(game_id,user_id,role) values
 ('b5000000-0000-4000-8000-000000000001','b1000000-0000-4000-8000-000000000004','guide');
set local role authenticated;
select set_config('request.jwt.claim.sub','b1000000-0000-4000-8000-000000000004',true);
select throws_ok($$select public.mutate_world_configuration(pg_temp.world_id('blank'),jsonb_build_object('type','delete_category','id',pg_temp.category_id('blank')))$$,
 '42501','Only world owners and editors can delete configuration','guide cannot delete virtual defaults');
select is((select configuration_customized from public.worlds where id=pg_temp.world_id('blank')),false,'denied guide delete does not fork');
select lives_ok($$select public.mutate_world_configuration(pg_temp.world_id('blank'),jsonb_build_object('type','update_category','id',pg_temp.category_id('blank'),'changes',jsonb_build_object('name','Guide places')))$$,
 'guide can customize via allowed edit');
select set_config('request.jwt.claim.sub','b1000000-0000-4000-8000-000000000001',true);
select lives_ok($$select public.mutate_world_configuration(pg_temp.world_id('blank'),jsonb_build_object('type','delete_category','id',id)) from public.world_categories where world_id=pg_temp.world_id('blank')$$,
 'owner can delete all empty customized categories');
select is((select count(*) from public.world_categories where world_id=pg_temp.world_id('blank')),0::bigint,'empty custom configuration persists');
select is((select configuration_customized from public.worlds where id=pg_temp.world_id('blank')),true,'deleting all categories never reapplies defaults');
select lives_ok($$select public.mutate_world_configuration(pg_temp.world_id('main'),jsonb_build_object('type','delete_field','id',pg_temp.field_id('main','description')))$$,
 'field deletion works after virtual value became stored');
select is((select count(*) from public.world_entry_field_values where field_definition_id=pg_temp.field_id('main','description')),0::bigint,'replacement cascade deletes field values');
select lives_ok($$delete from public.worlds where id=pg_temp.world_id('main')$$,'whole-world delete cascades inherited entry data');
select is((select count(*) from public.world_entries where id='b4000000-0000-4000-8000-000000000001'),0::bigint,'whole-world deletion removes entries');

-- Bindings can pin current playset resolution but cannot mutate schema.
insert into inherited_worlds values ('bindings',public.create_world('Binding world',null,'world:starforged/forge'));
select throws_ok($$select public.mutate_world_configuration(pg_temp.world_id('bindings'),
 jsonb_build_object('type','update_category','id',pg_temp.category_id('bindings'),'changes',jsonb_build_object('name','Pinned')),
 jsonb_build_array(jsonb_build_object('id',pg_temp.field_id('bindings','locationType'),'binding',null,'rule_bindings','[]'::jsonb,'gm_only',false)))$$,
 'P0001','Invalid default binding snapshot','binding snapshot cannot override security metadata');
select is((select configuration_customized from public.worlds where id=pg_temp.world_id('bindings')),false,'bad binding snapshot rolls fork back');
reset role;
create function pg_temp.rule_snapshot(p_world_id uuid) returns jsonb language sql security definer set search_path='' as $$
 select jsonb_build_array(jsonb_build_object('id',f->>'id','binding',f->'binding','rule_bindings',
   jsonb_build_array(jsonb_build_object('index',r.ordinality-1,'binding',r.value->'binding','conditions',r.value->'conditions'))))
 from jsonb_array_elements(public.w4_static_world_template(p_world_id,'world:starforged/forge')->'categories') c,
 lateral jsonb_array_elements(c->'fields') f,
 lateral jsonb_array_elements(f->'configuration'->'rules') with ordinality r(value,ordinality)
 where r.value ? 'binding' limit 1
$$;
set local role authenticated;
select throws_ok($$select public.mutate_world_configuration(pg_temp.world_id('bindings'),
 jsonb_build_object('type','update_category','id',pg_temp.category_id('bindings'),'changes',jsonb_build_object('name','Pinned')),
 jsonb_set(pg_temp.rule_snapshot(pg_temp.world_id('bindings')),'{0,rule_bindings,0,conditions}','[]'))$$,
 'P0001','World defaults changed; reload before editing configuration','stale conditional binding indices require reload');
select lives_ok($$select public.mutate_world_configuration(pg_temp.world_id('bindings'),
 jsonb_build_object('type','update_category','id',pg_temp.category_id('bindings'),'changes',jsonb_build_object('name','Pinned')),
 jsonb_set(pg_temp.rule_snapshot(pg_temp.world_id('bindings')),'{0,binding}',
 '{"packageId":"custom","oracleId":"oracle_rollable:custom/name","resolvedOracleId":"oracle_rollable:custom/resolved"}'))$$,
 'validated default binding snapshot is copied before first edit');
select is((select binding->>'resolvedOracleId' from public.world_field_definitions
 where id=(pg_temp.rule_snapshot(pg_temp.world_id('bindings'))->0->>'id')::uuid),'oracle_rollable:custom/resolved',
 'fork preserves client playset resolution');
select lives_ok($$select public.mutate_world_configuration(pg_temp.world_id('bindings'),
 jsonb_build_object('type','update_category','id',pg_temp.category_id('bindings'),'changes',jsonb_build_object('name','Still pinned')),
 '[{"ignored":"stale snapshot"}]')$$,'later changes ignore first-fork snapshot');
reset role;
select * from finish();
rollback;
