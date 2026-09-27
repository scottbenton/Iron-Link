-- Faction defaults remain virtual until a configuration edit; values already
-- enforce world/category membership and GM privacy against the trusted catalog.
begin;
create extension if not exists pgtap with schema extensions;
set search_path=public,extensions;
select no_plan();
insert into auth.users(id) values
 ('d2000000-0000-4000-8000-000000000001'),('d2000000-0000-4000-8000-000000000002');
select set_config('request.jwt.claim.sub','d2000000-0000-4000-8000-000000000001',true);
create temporary table faction_test_worlds(key text primary key,id uuid,category jsonb);
grant select on faction_test_worlds to authenticated;
insert into faction_test_worlds(key,id) values
 ('forge',public.create_world('Faction Forge',null,'world:starforged/forge')),
 ('isles',public.create_world('Faction Isles',null,'world:sundered_isles/sundered_isles')),
 ('classic',public.create_world('No classic factions',null,'world:classic/ironlands')),
 ('elegy',public.create_world('No Elegy factions',null,'world:elegy/santa_maria')),
 ('blank',public.create_world('No blank factions'));
update faction_test_worlds u set category=c
 from public.worlds w,lateral jsonb_array_elements(public.w4_static_world_template(w.id,w.setting_key)->'categories') c
 where u.id=w.id and c->>'name'='Factions';
create function pg_temp.faction_world(p_key text) returns uuid language sql as $$ select id from faction_test_worlds where key=p_key $$;
create function pg_temp.faction_field(p_key text,p_field text) returns uuid language sql as $$ select extensions.uuid_generate_v5(pg_temp.faction_world(p_key),'field:factions:'||p_field) $$;
create function pg_temp.faction_entry(p_key text) returns uuid language sql as $$ select extensions.uuid_generate_v5(pg_temp.faction_world(p_key),'test-entry:factions') $$;
select is((select count(*) from faction_test_worlds where key in ('forge','isles') and (category->>'id')::uuid=extensions.uuid_generate_v5(id,'category:factions')),2::bigint,
 'Forge and Isles virtual factions use world-scoped stable category identities');
select is((select count(*) from faction_test_worlds where key in ('classic','elegy','blank') and category is not null),0::bigint,
 'classic, Elegy, and blank defaults have no Factions');
select is((select count(*) from faction_test_worlds where category is not null and (category->>'subtitle_field_definition_id')::uuid=extensions.uuid_generate_v5(id,'field:factions:factionType')),2::bigint,
 'virtual faction subtitles reference the same-world Type definition');
select is((select count(*) from public.world_categories where world_id in (select id from faction_test_worlds)),0::bigint,'creation leaves all faction definitions virtual');
insert into public.world_players(world_id,user_id,role)
 select id,'d2000000-0000-4000-8000-000000000002','viewer' from faction_test_worlds where category is not null;
set local role authenticated;
select lives_ok($$insert into public.world_entries(id,world_id,category_id,name,author_id)
 select pg_temp.faction_entry(key),id,(category->>'id')::uuid,'Existing faction',auth.uid() from faction_test_worlds where category is not null$$,
 'owners can create entries in virtual faction categories');
select lives_ok($$insert into public.world_entry_field_values(entry_id,field_definition_id,world_id,value,gm_only)
 select pg_temp.faction_entry(key),pg_temp.faction_field(key,'factionType'),id,'"Guild"'::jsonb,true from faction_test_worlds where category is not null$$,
 'public Type values are valid before customization');
select lives_ok($$insert into public.world_entry_field_values(entry_id,field_definition_id,world_id,content,gm_only) values
 (pg_temp.faction_entry('forge'),pg_temp.faction_field('forge','rumors'),pg_temp.faction_world('forge'),decode('010203','hex'),false),
 (pg_temp.faction_entry('isles'),pg_temp.faction_field('isles','cursedAspects'),pg_temp.faction_world('isles'),decode('040506','hex'),false)$$,
 'GM faction details are valid before customization');
select is((select count(*) from public.world_entry_field_values where world_id in (select id from faction_test_worlds) and gm_only),2::bigint,
 'GM faction value privacy is derived from trusted defaults despite client flags');
select is((select count(*) from public.world_entry_field_values where world_id in (select id from faction_test_worlds) and not gm_only),2::bigint,
 'public faction value privacy is derived from trusted defaults despite client flags');
select is((select count(*) from public.worlds where id in (select id from faction_test_worlds) and configuration_customized),0::bigint,
 'faction entry and value writes do not fork configuration');
select throws_ok($$insert into public.world_entry_field_values(entry_id,field_definition_id,world_id,value)
 values(pg_temp.faction_entry('forge'),pg_temp.faction_field('isles','factionType'),pg_temp.faction_world('forge'),'"Foreign"')$$,
 'P0001','Entry and field definition must belong to the same category and world','faction values cannot use another world definition');
select set_config('request.jwt.claim.sub','d2000000-0000-4000-8000-000000000002',true);
select is((select count(*) from public.world_entry_field_values where world_id in (select id from faction_test_worlds)),2::bigint,
 'viewers see only the public faction values before customization');
reset role;
create temporary table faction_values_before as select entry_id,field_definition_id,world_id,value,content,gm_only from public.world_entry_field_values where world_id in (select id from faction_test_worlds);
set local role authenticated;
select set_config('request.jwt.claim.sub','d2000000-0000-4000-8000-000000000001',true);
select lives_ok($$select public.mutate_world_configuration(id,jsonb_build_object('type','update_category',
 'id',category->>'id','changes',jsonb_build_object('name','My factions'))) from faction_test_worlds where category is not null$$,
 'first faction edit atomically materializes categories, fields, and conditional rules');
select is((select count(*) from public.worlds where id in (select id from faction_test_worlds where category is not null) and configuration_customized),2::bigint,
 'first faction edit switches both worlds to their own configuration');
select is((select count(*) from public.world_categories where world_id in (select id from faction_test_worlds where category is not null)),8::bigint,
 'the first edit copies all four categories in each setting');
select is((select count(*) from faction_test_worlds u,lateral jsonb_array_elements(u.category->'fields') f
 where not exists(select 1 from public.world_field_definitions d where d.id=(f->>'id')::uuid and d.category_id=(u.category->>'id')::uuid
 and d.world_id=u.id and d.type=f->>'type' and d.gm_only=(f->>'gm_only')::boolean and d.configuration=f->'configuration'
 and to_jsonb(d.binding) is not distinct from nullif(f->'binding','null'::jsonb))),0::bigint,
 'all faction identities, types, GM metadata, bindings and conditions survive the fork');
reset role;
select results_eq($$select entry_id,field_definition_id,world_id,value,content,gm_only from public.world_entry_field_values where world_id in (select id from faction_test_worlds) order by entry_id,field_definition_id$$,
 $$select * from faction_values_before order by entry_id,field_definition_id$$,'faction values preserve their identities, bytes, and privacy after customization');
set local role authenticated;
select set_config('request.jwt.claim.sub','d2000000-0000-4000-8000-000000000002',true);
select is((select count(*) from public.world_entry_field_values where world_id in (select id from faction_test_worlds)),2::bigint,
 'viewers still see only public faction values after customization');
reset role;
select * from finish();
rollback;
