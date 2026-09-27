-- Test the deployed old-to-new catalog transition in an isolated transaction.
-- Run with psql -v ON_ERROR_STOP=1 -f (relative includes require this file path).
begin;
create extension if not exists pgtap with schema extensions;
set search_path=public,extensions;
select no_plan();
\ir ../migrations/20260926010000_world_static_catalog.sql
insert into auth.users(id) values ('c1000000-0000-4000-8000-000000000001'),('c1000000-0000-4000-8000-000000000002');
select set_config('request.jwt.claim.sub','c1000000-0000-4000-8000-000000000001',true);
create temporary table upgrade_worlds(key text primary key,id uuid,old_template jsonb);
insert into upgrade_worlds(key,id) values
 ('forge',public.create_world('Old Forge',null,'world:starforged/forge')),
 ('isles',public.create_world('Old Isles',null,'world:sundered_isles/sundered_isles')),
 ('classic',public.create_world('Old Ironlands',null,'world:classic/ironlands')),
 ('elegy',public.create_world('Old Elegy',null,'world:elegy/santa_maria')),
 ('blank',public.create_world('Old blank')),
 ('unaffected',public.create_world('Retained values',null,'world:starforged/forge')),
 ('empty',public.create_world('Empty world')),
 ('custom',public.create_world('Already customized',null,'world:starforged/forge'));
update upgrade_worlds u set old_template=public.w4_static_world_template(u.id,w.setting_key)
 from public.worlds w where w.id=u.id;
create function pg_temp.upgrade_world(p_key text) returns uuid language sql as $$ select id from upgrade_worlds where key=p_key $$;
create function pg_temp.upgrade_field(p_key text,p_field text) returns uuid language sql as $$
 select extensions.uuid_generate_v5(pg_temp.upgrade_world(p_key),'field:locations:'||p_field) $$;

-- Store scalar and Yjs values for every field, including all retired identities
-- in every setting/category. No previous release data can be silently orphaned.
do $$
declare w record; c jsonb; f jsonb; entry_id uuid;
begin
 for w in select * from upgrade_worlds where key not in ('unaffected','empty') loop
  for c in select value from jsonb_array_elements(w.old_template->'categories') loop
   entry_id := gen_random_uuid();
   insert into public.world_entries(id,world_id,category_id,name,author_id)
    values(entry_id,w.id,(c->>'id')::uuid,'Existing entry',auth.uid());
   for f in select value from jsonb_array_elements(c->'fields') loop
    insert into public.world_entry_field_values(entry_id,field_definition_id,world_id,value,content)
    values(entry_id,(f->>'id')::uuid,w.id,
     case f->>'type' when 'text' then '"Existing text"'::jsonb when 'tags' then '["Existing tag"]'::jsonb when 'number' then '7'::jsonb else null end,
     case when f->>'type' in ('richText','oracleText') then decode('010203ff','hex') else null end);
   end loop;
  end loop;
 end loop;
end $$;
insert into public.world_entries(id,world_id,category_id,name,author_id)
 values('c2000000-0000-4000-8000-000000000001',pg_temp.upgrade_world('unaffected'),
 extensions.uuid_generate_v5(pg_temp.upgrade_world('unaffected'),'category:locations'),'Retained star',auth.uid());
insert into public.world_entry_field_values(entry_id,field_definition_id,world_id,value,content) values
 ('c2000000-0000-4000-8000-000000000001',pg_temp.upgrade_field('unaffected','locationType'),pg_temp.upgrade_world('unaffected'),'"Star"',null),
 ('c2000000-0000-4000-8000-000000000001',pg_temp.upgrade_field('unaffected','starDescription'),pg_temp.upgrade_world('unaffected'),null,decode('040506','hex'));
select public.mutate_world_configuration(pg_temp.upgrade_world('custom'),jsonb_build_object('type','update_category',
 'id',extensions.uuid_generate_v5(pg_temp.upgrade_world('custom'),'category:locations'),'changes',jsonb_build_object('name','My custom places')));
create temporary table before_values as select entry_id,field_definition_id,world_id,value,content,gm_only from public.world_entry_field_values where world_id in (select id from upgrade_worlds);
create temporary table before_custom_fields as select * from public.world_field_definitions where world_id=pg_temp.upgrade_world('custom');
create temporary table before_custom_categories as select * from public.world_categories where world_id=pg_temp.upgrade_world('custom');
select is((select count(*) from public.worlds where id in (select id from upgrade_worlds where key in ('forge','isles','classic','elegy','blank')) and configuration_customized),0::bigint,'affected worlds begin inherited despite their values');

\ir ../migrations/20260927010000_world_static_catalog.sql

select is((select count(*) from public.worlds where id in (select id from upgrade_worlds where key in ('forge','isles','classic','elegy','blank')) and configuration_customized),5::bigint,'only affected inherited worlds freeze before replacing the catalog');
select is((select count(*) from public.worlds where id in (select id from upgrade_worlds where key in ('unaffected','empty')) and configuration_customized),0::bigint,'unaffected populated and empty worlds remain inherited');
select is((select count(*) from public.world_categories where world_id in (select id from upgrade_worlds where key in ('unaffected','empty'))),0::bigint,'unaffected defaults stay virtual');
select results_eq($$select entry_id,field_definition_id,world_id,value,content,gm_only from public.world_entry_field_values where world_id in (select id from upgrade_worlds) order by entry_id,field_definition_id$$,
 $$select * from before_values order by entry_id,field_definition_id$$,'every existing scalar/Yjs value retains its identity, bytes, and privacy');
select results_eq($$select * from public.world_field_definitions where world_id=pg_temp.upgrade_world('custom') order by id$$,
 $$select * from before_custom_fields order by id$$,'custom field definitions are entirely unchanged');
select results_eq($$select * from public.world_categories where world_id=pg_temp.upgrade_world('custom') order by id$$,
 $$select * from before_custom_categories order by id$$,'custom categories are entirely unchanged');
select is((select count(*) from upgrade_worlds u,
 lateral jsonb_array_elements(u.old_template->'categories') c,
 lateral jsonb_array_elements(c->'fields') f
 where u.key in ('forge','isles','classic','elegy','blank') and not exists (
 select 1 from public.world_field_definitions d where d.id=(f->>'id')::uuid and d.world_id=u.id
 and d.category_id=(c->>'id')::uuid and d.key=f->>'key' and d.label=f->>'label' and d.type=f->>'type'
 and d.gm_only=(f->>'gm_only')::boolean and d.sort_order=(f->>'sort_order')::integer
 and d.configuration=f->'configuration' and to_jsonb(d.binding) is not distinct from nullif(f->'binding','null'::jsonb))),
 0::bigint,'preservation uses the complete old trusted fields, types, privacy, raw bindings, and conditions');
select is((select type from public.world_field_definitions where id=pg_temp.upgrade_field('forge','planetDescription')),'text','legacy planet Description remains scalar text');
select is((select type from public.world_field_definitions where id=pg_temp.upgrade_field('forge','starDescription')),'oracleText','legacy star Description retains OracleText storage');
select is((select count(*) from public.w4_effective_categories(pg_temp.upgrade_world('unaffected')) c,lateral jsonb_array_elements(c->'fields') f where f->>'key'='planetDescription'),0::bigint,'unaffected inherited world receives simplified defaults');
select is((select count(*) from public.w4_effective_categories(pg_temp.upgrade_world('unaffected')) c,lateral jsonb_array_elements(c->'fields') f where f->>'key'='gmNotes'),0::bigint,'new defaults have no extra GM Notes');
select lives_ok($$update public.world_entry_field_values set value='"Edited legacy text"' where field_definition_id=pg_temp.upgrade_field('forge','planetDescription')$$,'preserved legacy values stay editable after release');
insert into public.world_players(world_id,user_id,role) values(pg_temp.upgrade_world('forge'),'c1000000-0000-4000-8000-000000000002','viewer');
grant select on upgrade_worlds to authenticated;
set local role authenticated;
select set_config('request.jwt.claim.sub','c1000000-0000-4000-8000-000000000002',true);
select is((select count(*) from public.world_entry_field_values where world_id=pg_temp.upgrade_world('forge') and gm_only),0::bigint,'viewer still cannot read migration-preserved GM values');
reset role;
select * from finish();
rollback;
