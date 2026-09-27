-- Additive Factions release. Run against an isolated clone with psql -f so
-- relative includes resolve. Both fixture data and catalog changes roll back.
begin;
create extension if not exists pgtap with schema extensions;
set search_path=public,extensions;
select no_plan();
\ir ../migrations/20260927010000_world_static_catalog.sql
insert into auth.users(id) values ('d1000000-0000-4000-8000-000000000001');
select set_config('request.jwt.claim.sub','d1000000-0000-4000-8000-000000000001',true);
create temporary table faction_upgrade_worlds(key text primary key,id uuid,old_template jsonb);
insert into faction_upgrade_worlds(key,id) values
 ('forge',public.create_world('Inherited Forge',null,'world:starforged/forge')),
 ('isles',public.create_world('Inherited Isles',null,'world:sundered_isles/sundered_isles')),
 ('custom-forge',public.create_world('Custom Forge',null,'world:starforged/forge')),
 ('custom-isles',public.create_world('Custom Isles',null,'world:sundered_isles/sundered_isles')),
 ('classic',public.create_world('Classic',null,'world:classic/ironlands')),
 ('elegy',public.create_world('Elegy',null,'world:elegy/santa_maria')),
 ('blank',public.create_world('Blank'));
update faction_upgrade_worlds u set old_template=public.w4_static_world_template(u.id,w.setting_key)
 from public.worlds w where w.id=u.id;
select public.mutate_world_configuration(id,jsonb_build_object('type','update_category',
 'id',extensions.uuid_generate_v5(id,'category:locations'),'changes',jsonb_build_object('name','My places')))
 from faction_upgrade_worlds where key like 'custom-%';
insert into public.world_entries(id,world_id,category_id,name,author_id)
 select extensions.uuid_generate_v5(id,'test-entry:location'),id,extensions.uuid_generate_v5(id,'category:locations'),'Existing location',auth.uid()
 from faction_upgrade_worlds;
insert into public.world_entry_field_values(entry_id,field_definition_id,world_id,value)
 select extensions.uuid_generate_v5(id,'test-entry:location'),extensions.uuid_generate_v5(id,'field:locations:locationType'),id,'"Existing location type"'::jsonb
 from faction_upgrade_worlds;
create temporary table faction_before_values as select entry_id,field_definition_id,world_id,value,content,gm_only from public.world_entry_field_values where world_id in (select id from faction_upgrade_worlds);
create temporary table faction_before_custom_fields as select * from public.world_field_definitions where world_id in (select id from faction_upgrade_worlds where key like 'custom-%');
create temporary table faction_before_custom_categories as select * from public.world_categories where world_id in (select id from faction_upgrade_worlds where key like 'custom-%');

\ir ../migrations/20260927020000_world_static_catalog.sql

select is((select count(*) from public.worlds where id in (select id from faction_upgrade_worlds where key not like 'custom-%') and configuration_customized),0::bigint,
 'additive catalog release does not customize inherited worlds');
select is((select count(*) from public.world_categories where world_id in (select id from faction_upgrade_worlds where key not like 'custom-%')),0::bigint,
 'additive release writes no inherited category rows');
select results_eq($$select entry_id,field_definition_id,world_id,value,content,gm_only from public.world_entry_field_values where world_id in (select id from faction_upgrade_worlds) order by entry_id,field_definition_id$$,
 $$select * from faction_before_values order by entry_id,field_definition_id$$,'all existing values retain identity, content, and privacy');
select results_eq($$select * from public.world_field_definitions where world_id in (select id from faction_upgrade_worlds where key like 'custom-%') order by id$$,
 $$select * from faction_before_custom_fields order by id$$,'custom field rows are entirely unchanged');
select results_eq($$select * from public.world_categories where world_id in (select id from faction_upgrade_worlds where key like 'custom-%') order by id$$,
 $$select * from faction_before_custom_categories order by id$$,'custom category rows are entirely unchanged');
select is((select count(*) from faction_upgrade_worlds u join public.worlds w on w.id=u.id
 where (select jsonb_agg(c.value order by c.ordinality) from jsonb_array_elements(public.w4_static_world_template(u.id,w.setting_key)->'categories') with ordinality c(value,ordinality) where c.ordinality <= 3)
 is distinct from u.old_template->'categories'),0::bigint,'Locations, NPCs, and Lore defaults remain byte-for-byte equivalent');
select is((select count(*) from faction_upgrade_worlds u,lateral public.w4_effective_categories(u.id) c where u.key in ('forge','isles') and c->>'name'='Factions'),2::bigint,
 'inherited Forge and Isles gain the new Factions category');
select is((select count(*) from faction_upgrade_worlds u,lateral public.w4_effective_categories(u.id) c where u.key not in ('forge','isles') and c->>'name'='Factions'),0::bigint,
 'existing custom worlds and other settings do not gain Factions');
select * from finish();
rollback;
