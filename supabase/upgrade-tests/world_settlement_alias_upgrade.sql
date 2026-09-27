-- Rename the suggested Forge settlement type without rewriting saved values.
-- Run with psql -f on an isolated migrated clone; all changes roll back.
begin;
create extension if not exists pgtap with schema extensions;
set search_path=public,extensions;
select no_plan();
\ir ../migrations/20260927020000_world_static_catalog.sql
insert into auth.users(id) values ('d3000000-0000-4000-8000-000000000001');
select set_config('request.jwt.claim.sub','d3000000-0000-4000-8000-000000000001',true);
create temporary table settlement_worlds(key text primary key,id uuid,old_template jsonb);
insert into settlement_worlds(key,id) values
 ('inherited',public.create_world('Inherited orbital settlement',null,'world:starforged/forge')),
 ('custom',public.create_world('Custom orbital settlement',null,'world:starforged/forge'));
update settlement_worlds set old_template=public.w4_static_world_template(id,'world:starforged/forge');
select public.mutate_world_configuration(id,jsonb_build_object('type','update_category',
 'id',extensions.uuid_generate_v5(id,'category:locations'),'changes',jsonb_build_object('name','My places')))
 from settlement_worlds where key='custom';
insert into public.world_entries(id,world_id,category_id,name,author_id)
 select extensions.uuid_generate_v5(id,'test-entry:orbital'),id,extensions.uuid_generate_v5(id,'category:locations'),'Orbital settlement',auth.uid() from settlement_worlds;
insert into public.world_entry_field_values(entry_id,field_definition_id,world_id,value,content)
 select extensions.uuid_generate_v5(id,'test-entry:orbital'),extensions.uuid_generate_v5(id,'field:locations:locationType'),id,'"Orbital Settlement"'::jsonb,null from settlement_worlds
 union all
 select extensions.uuid_generate_v5(id,'test-entry:orbital'),extensions.uuid_generate_v5(id,'field:locations:settlementPopulation'),id,null,decode('010203ff','hex') from settlement_worlds;
create temporary table settlement_before_values as select entry_id,field_definition_id,world_id,value,content,gm_only from public.world_entry_field_values where world_id in (select id from settlement_worlds);
create temporary table settlement_before_custom as select * from public.world_field_definitions where world_id=(select id from settlement_worlds where key='custom');

\ir ../migrations/20260927030000_world_static_catalog.sql

select results_eq($$select entry_id,field_definition_id,world_id,value,content,gm_only from public.world_entry_field_values where world_id in (select id from settlement_worlds) order by entry_id,field_definition_id$$,
 $$select * from settlement_before_values order by entry_id,field_definition_id$$,'saved Orbital Settlement and Yjs population values remain unchanged');
select results_eq($$select * from public.world_field_definitions where world_id=(select id from settlement_worlds where key='custom') order by id$$,
 $$select * from settlement_before_custom order by id$$,'existing custom configuration retains its own suggestions and rules');
select is((select configuration_customized from public.worlds where id=(select id from settlement_worlds where key='inherited')),false,'the alias update does not fork inherited worlds');
create temporary table settlement_new_fields as
 select f from settlement_worlds u,lateral jsonb_array_elements(public.w4_static_world_template(u.id,'world:starforged/forge')->'categories') c,
 lateral jsonb_array_elements(c->'fields') f where u.key='inherited' and c->>'name'='Locations';
select ok((select f->'configuration'->'suggestions' ? 'Non-Planetary Settlement' and not(f->'configuration'->'suggestions' ? 'Orbital Settlement') from settlement_new_fields where f->>'key'='locationType'),
 'only Non-Planetary Settlement is suggested');
select is((select count(*) from settlement_new_fields where f->>'key' in (
 'settlementLocation','settlementFirstLook','settlementInitialContact','settlementAuthority','settlementProjects','settlementTrouble','settlementPopulation')),
 7::bigint,'every settlement field is covered by alias compatibility checks');
select is((select count(*) from settlement_new_fields where f->>'key' in (
 'settlementLocation','settlementFirstLook','settlementInitialContact','settlementAuthority','settlementProjects','settlementTrouble','settlementPopulation')
 and exists (select 1 from jsonb_array_elements(f->'configuration'->'rules') r where r->'conditions'->0->>'value'='Orbital Settlement')
 and (select jsonb_agg(r order by ordinal) from jsonb_array_elements(f->'configuration'->'rules') with ordinality a(r,ordinal) where r->'conditions'->0->>'value'='Orbital Settlement')
 is not distinct from
 (select jsonb_agg(replace(r::text,'Non-Planetary Settlement','Orbital Settlement')::jsonb order by ordinal) from jsonb_array_elements(f->'configuration'->'rules') with ordinality a(r,ordinal) where r->'conditions'->0->>'value'='Non-Planetary Settlement')),
 7::bigint,'legacy and new values have equivalent visibility and binding rules, including all population regions');
select is((select count(*) from settlement_worlds u,lateral jsonb_array_elements(u.old_template->'categories') c,
 lateral jsonb_array_elements(c->'fields') old_f
 where u.key='inherited' and not exists (
 select 1 from jsonb_array_elements(public.w4_static_world_template(u.id,'world:starforged/forge')->'categories') new_c,
 lateral jsonb_array_elements(new_c->'fields') new_f where new_c->>'id'=c->>'id' and new_f->>'id'=old_f->>'id'
 and new_f->>'key'=old_f->>'key' and new_f->>'type'=old_f->>'type' and new_f->>'gm_only'=old_f->>'gm_only')),
 0::bigint,'field identity, storage type, and privacy are unchanged');
select lives_ok($$select public.mutate_world_configuration(id,jsonb_build_object('type','update_category',
 'id',extensions.uuid_generate_v5(id,'category:locations'),'changes',jsonb_build_object('name','Now custom'))) from settlement_worlds where key='inherited'$$,
 'a first edit can copy the alias-compatible configuration');
select results_eq($$select entry_id,field_definition_id,world_id,value,content,gm_only from public.world_entry_field_values where world_id in (select id from settlement_worlds) order by entry_id,field_definition_id$$,
 $$select * from settlement_before_values order by entry_id,field_definition_id$$,'first customization still preserves the old scalar label and Yjs bytes');
select * from finish();
rollback;
