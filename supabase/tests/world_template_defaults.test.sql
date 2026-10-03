-- The migrated database owns defaults. Check contracts, not a second catalog copy.
begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;
select no_plan();

select is((select count(*) from public.world_templates),5::bigint,'defaults are stored in five shared setting rows');
select ok((select relrowsecurity from pg_class where oid='public.world_templates'::regclass),'shared templates have RLS enabled');
select is((select provolatile::text from pg_proc where oid='public.get_world_template(uuid,text)'::regprocedure),
 's','template resolver reads current shared rows rather than immutable function source');
select ok(not has_function_privilege('authenticated','public.get_world_template(uuid,text)','EXECUTE')
 and not has_function_privilege('anon','public.get_world_template(uuid,text)','EXECUTE'),
 'raw template resolver is not exposed to clients');
select ok(not has_function_privilege('authenticated','public.get_world_effective_categories(uuid)','EXECUTE')
 and not has_function_privilege('anon','public.get_world_effective_categories(uuid)','EXECUTE'),
 'raw effective categories resolver is not exposed to clients');
set local role authenticated;
select throws_ok($$select * from public.world_templates$$,'42501',null,'authenticated clients cannot read raw template rows');
select throws_ok($$insert into public.world_templates values ('custom','{"version":1,"categories":[]}'::jsonb)$$,
 '42501',null,'authenticated clients cannot add shared templates');
select throws_ok($$update public.world_templates set configuration=configuration where setting_key='blank'$$,
 '42501',null,'authenticated clients cannot update shared templates');
select throws_ok($$delete from public.world_templates where setting_key='blank'$$,
 '42501',null,'authenticated clients cannot delete shared templates');
select throws_ok($$truncate public.world_templates$$,'42501',null,'authenticated clients cannot truncate shared templates');
set local role anon;
select throws_ok($$select * from public.world_templates$$,'42501',null,'anonymous clients cannot read raw template rows');
select throws_ok($$insert into public.world_templates values ('custom','{"version":1,"categories":[]}'::jsonb)$$,
 '42501',null,'anonymous clients cannot add shared templates');
select throws_ok($$update public.world_templates set configuration=configuration where setting_key='blank'$$,
 '42501',null,'anonymous clients cannot update shared templates');
select throws_ok($$delete from public.world_templates where setting_key='blank'$$,
 '42501',null,'anonymous clients cannot delete shared templates');
select throws_ok($$select public.get_world_template('f1000000-0000-4000-8000-000000000001','blank')$$,
 '42501',null,'anonymous clients cannot bypass configuration authorization through the template resolver');
reset role;


create temporary table catalog_worlds(key text primary key, setting_key text, id uuid, template jsonb, other_template jsonb);
insert into catalog_worlds(key, setting_key, id) select key, setting_key,
 extensions.uuid_generate_v5('f1000000-0000-4000-8000-000000000001',key)
from (values ('blank',null), ('classic','world:classic/ironlands'), ('forge','world:starforged/forge'),
 ('isles','world:sundered_isles/sundered_isles'), ('elegy','world:elegy/santa_maria')) s(key,setting_key);
update catalog_worlds set template=public.get_world_template(id,setting_key),
 other_template=public.get_world_template(extensions.uuid_generate_v5(id,'other-world'),setting_key);
create temporary view catalog_categories as
 select w.key,w.id as world_id,c.value as category,lower(c.value->>'name') as category_key
 from catalog_worlds w,lateral jsonb_array_elements(w.template->'categories') c;
create temporary view catalog_fields as
 select c.key,c.world_id,c.category,c.category_key,f.value as field
 from catalog_categories c,lateral jsonb_array_elements(c.category->'fields') f;
create temporary view catalog_rules as
 select f.*,r.value as rule from catalog_fields f,lateral jsonb_array_elements(f.field->'configuration'->'rules') r;
create temporary view catalog_bindings as
 select key,field->'binding' as binding from catalog_fields where field->'binding'<>'null'::jsonb
 union all select key,rule->'binding' from catalog_rules where rule->'binding'<>'null'::jsonb;

select is(public.get_world_template('f1000000-0000-4000-8000-000000000001','unknown'),
 public.get_world_template('f1000000-0000-4000-8000-000000000001',null),'unknown settings inherit Blank');
select is(template->>'version','1',key||' catalog uses version 1') from catalog_worlds;
select is(template,public.get_world_template(id,setting_key),key||' identities and payload are stable') from catalog_worlds;
select is((select jsonb_agg(c->'name' order by (c->>'sort_order')::int) from jsonb_array_elements(template->'categories') c),
 case when key in ('blank','forge','isles') then '["Locations","NPCs","Lore","Factions"]' else '["Locations","NPCs","Lore"]' end::jsonb,
 key||' has the supported categories in order') from catalog_worlds;
select ok(not exists(select 1 from catalog_categories c where c.key=w.key and
 (c.category->>'id')::uuid<>extensions.uuid_generate_v5(w.id,'category:'||c.category_key))
 and not exists(select 1 from catalog_fields f where f.key=w.key and
 (f.field->>'id')::uuid<>extensions.uuid_generate_v5(w.id,'field:'||f.category_key||':'||(f.field->>'key'))),
 key||' uses world-scoped UUID identities') from catalog_worlds w;
select ok(not exists(select 1 from jsonb_array_elements(w.other_template->'categories') c
 where exists(select 1 from catalog_categories old where old.key=w.key and old.category->>'id'=c->>'id')
 or exists(select 1 from jsonb_array_elements(c->'fields') f join catalog_fields old on old.field->>'id'=f->>'id' where old.key=w.key)),
 key||' rebases category and field identities for another world') from catalog_worlds w;
select is((select count(*) from (select category->>'id' id from catalog_categories where key=w.key
 union all select field->>'id' from catalog_fields where key=w.key) ids),
 (select count(distinct id) from (select category->>'id' id from catalog_categories where key=w.key
 union all select field->>'id' from catalog_fields where key=w.key) ids),key||' has no identity collisions') from catalog_worlds w;
select ok(not exists(select 1 from catalog_categories c where c.key=w.key
 and c.category->'subtitle_field_definition_id'<>'null'::jsonb and not exists(
 select 1 from jsonb_array_elements(c.category->'fields') f where f->'id'=c.category->'subtitle_field_definition_id')),
 key||' subtitles reference their own category fields') from catalog_worlds w;
select ok(not exists(select 1 from catalog_categories c where c.key=w.key and
 (c.category->>'supports_hierarchy')::boolean<>(c.category_key='locations')
 or c.key=w.key and (c.category->>'supports_map')::boolean<>(c.category_key='locations')
 or c.key=w.key and (c.category->>'supports_bonds')::boolean<>(c.category_key in ('locations','npcs'))),
 key||' category capabilities match their roles') from catalog_worlds w;
select ok(not exists(select 1 from catalog_fields f where f.key=w.key and
 (f.field->>'key' in ('gmNotes','truths') or lower(f.field->>'label') in ('gm notes','truths'))),
 key||' omits GM Notes and truths from category fields') from catalog_worlds w;
select ok(not exists(select 1 from catalog_fields f where f.key=w.key and f.field->>'type' in ('categorySelect','categoryMultiSelect')
 and not exists(select 1 from catalog_categories c where c.key=f.key and c.category->>'id'=f.field->'configuration'->>'targetCategoryId')),
 key||' rebases every linked category target') from catalog_worlds w;
select ok(not exists(select 1 from catalog_rules r,lateral jsonb_array_elements(r.rule->'conditions') condition
 where r.key=w.key and (not exists(select 1 from catalog_fields source where source.key=r.key
 and source.category_key=r.category_key and source.field->>'id'=condition->>'fieldId'
 and source.field->>'type'='text' and (source.field->>'gm_only'='false' or r.field->>'gm_only'='true'))
 or condition ? 'ancestor' and not exists(select 1 from catalog_fields source where source.key=r.key
 and source.category_key=r.category_key and source.field->>'id'=condition->'ancestor'->>'fieldId' and source.field->>'type'='text'))),
 key||' conditional and ancestor IDs rebase within their category with safe visibility') from catalog_worlds w;
select lives_ok($$select public.world_configuration_validate_field(field->'configuration',field->>'type'),
 public.world_configuration_validate_binding(field->'binding') from catalog_fields$$,'all authored field configurations and base bindings pass database validation');
select lives_ok($$select public.world_configuration_validate_binding(rule->'binding') from catalog_rules$$,'all conditional bindings pass database validation');
select ok(not exists(select 1 from catalog_bindings where binding->>'resolvedOracleId'<>binding->>'oracleId'
 or binding->>'packageId'<>split_part(split_part(binding->>'oracleId',':',2),'/',1)),
 'base and conditional bindings pin their package oracle as the initial selection');
select is((select count(*) from catalog_bindings where key='blank'),0::bigint,'Blank has no oracle bindings');
select is((select count(*) from catalog_bindings where key='classic' and binding->>'packageId'='delve'),0::bigint,'Classic has no Delve defaults');
select is(field->'configuration'->'suggestions',expected::jsonb,key||' location type suggestions remain editable text')
 from catalog_fields join (values
 ('classic','["Settlement","Tower","Ruin","Camp"]'),
 ('forge','["Sector","Planet","Planetside Settlement","Non-Planetary Settlement","Star","Derelict","Vault"]'),
 ('elegy','[]')) s(key,expected) using(key) where category_key='locations' and field->>'key'='locationType';
select is(field->>'type','text',key||' location type permits custom values') from catalog_fields where field->>'key'='locationType';
select is(category->'icon'->>'key',case key when 'forge' then 'GiRingedPlanet' when 'isles' then 'GiCompass' else 'GiWorld' end,
 key||' uses the selected Locations icon') from catalog_categories where category_key='locations';
select ok(bool_and(category->'icon'=case category_key
 when 'npcs' then '{"key":"mui:Groups2","color":"blue"}'::jsonb
 when 'lore' then '{"key":"GiBookmarklet","color":"purple"}'::jsonb
 else '{"key":"GiBlackFlag","color":"red"}'::jsonb end),'shared category icons are stable')
 from catalog_categories where category_key<>'locations';
select ok(bool_and(field->>'type'='categorySelect' and field->'configuration'->>'targetCategoryId'=
 extensions.uuid_generate_v5(world_id,'category:locations')::text and category->>'subtitle_field_definition_id'=field->>'id'),
 'NPC Location links Locations and supplies the NPC subtitle') from catalog_fields where category_key='npcs' and field->>'key'='location';
select ok(bool_and(category->>'subtitle_field_definition_id'=field->>'id'),
 'Lore Tags supply the Lore subtitle') from catalog_fields where category_key='lore' and field->>'key'='tags';
select is((select jsonb_agg(field->'key' order by (field->>'sort_order')::int) from catalog_fields where key='blank' and category_key='factions'),
 '["factionType","tags"]'::jsonb,'Blank factions provide unbound type and tags');
select is((select field->>'label' from catalog_fields where key='forge' and field->>'key'='derelictOuterFirstLook'),
 'Outer First Look','Forge names the outer derelict oracle accurately');
select is((select count(*) from catalog_fields where key='forge' and category_key='locations' and field->>'label'='Description'),
 1::bigint,'Forge has one conditional Description field');
select ok((select field->>'key'='starDescription' and field->>'type'='oracleText' and field->>'gm_only'='false'
 and field->'binding'='null'::jsonb and field->'configuration'->>'visible'='false'
 from catalog_fields where key='forge' and field->>'label'='Description'),'Forge Description is public, conditional and editable without an oracle');
select is((select jsonb_agg(rule->'conditions'->0->'value' order by rule->'conditions'->0->>'value')
 from catalog_rules where key='forge' and field->>'key'='starDescription'),'["Planet","Star"]'::jsonb,
 'Forge Description is available for Planets and Stars');
select is((select rule->'binding'->>'oracleId' from catalog_rules where key='forge' and field->>'key'='starDescription'
 and rule->'conditions'->0->>'value'='Star'),'oracle_rollable:starforged/space/stellar_object','Star Description targets its stellar oracle');
select is((select field->>'type' from catalog_fields where key='forge' and field->>'key'='derelictLocation'),'text',
 'Derelict Location stays scalar for its Type conditions');
select is((select count(*) from catalog_fields where key='forge' and category_key='locations' and field->>'label'='Location'),2::bigint,
 'Forge keeps Derelict Location separate from merged settlement Location');
select is((select count(*) from catalog_fields where key='isles' and category_key='locations' and field->>'label'=label),1::bigint,
 'Isles has one merged '||label||' field') from (values ('Location'),('First Look'),('Details'),('Size')) labels(label);

-- Spot-check the merged oracle routing encoded in the canonical release data.
select ok(exists(select 1 from catalog_rules r where r.key=expected.key and r.field->>'key'=expected.field_key
 and r.rule->>'visible'='true' and r.rule->'binding'->>'oracleId'='oracle_rollable:'||expected.oracle
 and exists(select 1 from jsonb_array_elements(r.rule->'conditions') c where c->>'source'='entry'
 and c->>'fieldId'=extensions.uuid_generate_v5(r.world_id,'field:locations:locationType')::text
 and c->>'operator'='equals' and c->>'value'=expected.location_type)),
 expected.key||' routes '||expected.field_key||' for '||expected.location_type)
from (values
 ('forge','settlementLocation','Planetside Settlement','starforged/settlement/location'),
 ('forge','settlementLocation','Non-Planetary Settlement','starforged/settlement/location'),
 ('forge','settlementLocation','Orbital Settlement','starforged/settlement/location'),
 ('forge','settlementLocation','Vault','starforged/precursor_vault/location'),
 ('forge','derelictOuterFirstLook','Vault','starforged/precursor_vault/outer_first_look'),
 ('isles','settlementLocation','Shipwreck','sundered_isles/shipwreck/location'),
 ('isles','settlementFirstLook','Shipwreck','sundered_isles/shipwreck/first_look'),
 ('isles','settlementDetails','Shipwreck','sundered_isles/shipwreck/details'),
 ('isles','islandSize','Island','sundered_isles/island/landscape/size')) expected(key,field_key,location_type,oracle);
select is(field->'configuration'->'suggestions',expected::jsonb,key||' Region suggestions match the setting')
 from catalog_fields join (values ('forge','["Terminus","Outlands","Expanse","Void"]'),
 ('isles','["Myriads","Margins","Reaches"]')) s(key,expected) using(key) where field->>'key'='region';
select ok(field->'binding'='null'::jsonb and field->>'gm_only'='false' and field->'configuration'->>'visible'='false'
 and jsonb_array_length(field->'configuration'->'rules')=1
 and field->'configuration'->'rules'->0->'conditions'->0->>'value'=case key when 'forge' then 'Sector' else 'Area' end,
 key||' exposes Region only on the ancestor category') from catalog_fields where field->>'key'='region';
select ok(bool_and(c->>'fieldId'=extensions.uuid_generate_v5(r.world_id,'field:locations:region')::text
 and c->'ancestor'->>'fieldId'=extensions.uuid_generate_v5(r.world_id,'field:locations:locationType')::text
 and c->'ancestor'->>'value'=case r.key when 'forge' then 'Sector' else 'Area' end
 and r.rule->'binding'->>'oracleId' like '%/'||lower(c->>'value')),
 'regional bindings select the nearest Sector or Area and the matching region oracle')
 from catalog_rules r,lateral jsonb_array_elements(r.rule->'conditions') c where c->>'source'='ancestor';
select ok(exists(select 1 from catalog_rules r where r.key=expected.key and r.field->>'key'=expected.field_key
 and r.rule->>'visible'='true' and coalesce(r.rule->'binding','null')='null'::jsonb
 and not exists(select 1 from jsonb_array_elements(r.rule->'conditions') c where c->>'source'='ancestor')),
 expected.key||' '||expected.field_key||' has an editable fallback without a region')
 from (values ('forge','planetSettlements'),('forge','settlementPopulation'),('isles','islandVitality'),('isles','islandSize')) expected(key,field_key);
select is((select count(*) from catalog_rules where key='forge' and field->>'key'='settlementPopulation' and rule->'binding'<>'null'::jsonb),
 9::bigint,'all three settlement aliases have all three regional population bindings');
select is((select rule->'binding'->>'oracleId' from catalog_rules r where key='forge' and field->>'key'='planetSettlements'
 and exists(select 1 from jsonb_array_elements(rule->'conditions') c where c->>'value'='Desert World')
 and exists(select 1 from jsonb_array_elements(rule->'conditions') c where c->>'value'='Outlands')),
 'oracle_rollable:starforged/planet/desert/settlements/outlands','planet settlements combine class with ancestor region');
select is((select rule->'binding'->>'oracleId' from catalog_rules r where key='isles' and field->>'key'='islandSize'
 and exists(select 1 from jsonb_array_elements(rule->'conditions') c where c->>'value'='Settlement')
 and exists(select 1 from jsonb_array_elements(rule->'conditions') c where c->>'value'='Reaches')),
 'oracle_rollable:sundered_isles/settlement/size/reaches','merged Isles Size preserves regional settlements');

-- Type-specific faction details and the private Cursed modifier are authored rules.
select ok(exists(select 1 from catalog_rules r where r.key=expected.key and r.category_key='factions'
 and r.field->>'key'=expected.field_key and r.field->'configuration'->>'visible'='false'
 and r.rule->>'visible'='true' and coalesce(r.rule->>'label',r.field->>'label')=expected.label
 and r.rule->'binding'->>'oracleId'='oracle_rollable:'||expected.oracle
 and r.rule->'conditions'=jsonb_build_array(jsonb_build_object('source','entry','fieldId',
 extensions.uuid_generate_v5(r.world_id,'field:factions:factionType')::text,'operator','equals','value',expected.faction_type))),
 expected.key||' routes '||expected.faction_type||' '||expected.field_key||' with the correct label')
from (values
 ('forge','Dominion','focus','starforged/faction/dominion','Focus'),
 ('forge','Guild','focus','starforged/faction/guild','Specialty'),
 ('forge','Fringe Group','focus','starforged/faction/fringe_group','Role'),
 ('forge','Dominion','leadership','starforged/faction/dominion_leadership','Leadership'),
 ('isles','Society','chronicles','sundered_isles/faction/society/chronicles','Chronicles'),
 ('isles','Society','leadership','sundered_isles/faction/society/overseers','Overseers'),
 ('isles','Society','touchstones','sundered_isles/faction/society/touchstones','Touchstones'),
 ('isles','Organization','role','sundered_isles/faction/organization/type','Role'),
 ('isles','Organization','methods','sundered_isles/faction/organization/methods','Methods'),
 ('isles','Organization','secrets','sundered_isles/faction/organization/secrets','Secrets'),
 ('isles','Empire','leadership','sundered_isles/faction/empire/leadership','Leadership'),
 ('isles','Empire','tactics','sundered_isles/faction/empire/tactics','Tactics'),
 ('isles','Empire','vulnerabilities','sundered_isles/faction/empire/vulnerabilities','Vulnerabilities'),
 ('isles','The Cursed','role','sundered_isles/faction/cursed/role','Role')) expected(key,faction_type,field_key,oracle,label);
select ok(field->>'type'='text' and jsonb_array_length(field->'configuration'->'suggestions')>0,
 key||' Faction Type permits suggested and custom values') from catalog_fields
 where key in ('forge','isles') and category_key='factions' and field->>'key'='factionType';
select ok(not exists(select 1 from catalog_fields f where f.key=w.key and f.category_key='factions'
 and jsonb_array_length(f.field->'configuration'->'rules')>0 and f.field->'configuration'->>'visible'<>'false')
 and not exists(select 1 from catalog_rules r,lateral jsonb_array_elements(r.rule->'conditions') c
 where r.key=w.key and r.category_key='factions' and c->>'fieldId'=
 extensions.uuid_generate_v5(w.id,'field:factions:factionType')::text and c->>'operator'<>'equals'),
 key||' unknown faction types keep conditional type details hidden') from catalog_worlds w where key in ('forge','isles');
select is((select jsonb_agg(field->'key' order by (field->>'sort_order')::int) from catalog_fields
 where key=w.key and category_key='factions' and field->>'gm_only'='false'),
 '["factionType","influence"]'::jsonb,key||' exposes only faction Type and Influence publicly')
 from catalog_worlds w where key in ('forge','isles');
select ok((select field->>'type'='text' and field->>'gm_only'='true' and field->'binding'='null'::jsonb
 from catalog_fields where key='isles' and category_key='factions' and field->>'key'='cursed'),
 'Isles Cursed modifier is private editable text without a binding');
select ok((select field->>'gm_only'='true' and field->'configuration'->>'visible'='false'
 and field->'binding'='null'::jsonb and jsonb_array_length(field->'configuration'->'rules')=2
 from catalog_fields where key='isles' and category_key='factions' and field->>'key'='cursedAspects'),
 'Cursed Aspects is private and hidden until either independent predicate matches');
select ok(exists(select 1 from catalog_rules r where key='isles' and field->>'key'='cursedAspects'
 and rule->>'visible'='true' and rule->'binding'->>'oracleId'='oracle_rollable:sundered_isles/faction/cursed/aspects'
 and rule->'conditions'=jsonb_build_array(jsonb_build_object('source','entry','fieldId',
 extensions.uuid_generate_v5(r.world_id,'field:factions:'||expected.source_key)::text,
 'operator','equals','value',expected.value))),expected.description)
 from (values ('factionType','The Cursed','The Cursed always receives Cursed Aspects'),
 ('cursed','Yes','ordinary and custom factions receive Cursed Aspects only with Cursed Yes')) expected(source_key,value,description);
select ok((select jsonb_array_length(field->'configuration'->'rules')=1 from catalog_fields
 where key='isles' and category_key='factions' and field->>'key'=expected.field_key),
 'Organization '||field_key||' ignores the Cursed modifier and remains hidden for The Cursed')
 from (values ('methods'),('secrets')) expected(field_key);

-- Materialize every setting through the client RPC, validating real references.
insert into auth.users(id) values ('f1000000-0000-4000-8000-000000000002');
insert into public.worlds(id,name,created_by,setting_key)
 select id,'Canonical catalog test','f1000000-0000-4000-8000-000000000002',setting_key from catalog_worlds;
insert into public.world_players(world_id,user_id,role)
 select id,'f1000000-0000-4000-8000-000000000002','owner' from catalog_worlds;
grant select,insert on catalog_worlds to authenticated;
set local role authenticated;
select set_config('request.jwt.claim.sub','f1000000-0000-4000-8000-000000000002',true);
select is((select count(*) from public.world_categories where world_id=w.id),0::bigint,key||' begins with virtual categories') from catalog_worlds w;
select lives_ok(format('select public.mutate_world_configuration(%L,jsonb_build_object(''type'',''update_category'',''id'',%L,''changes'',jsonb_build_object(''name'',''Custom locations'')))',
 id,(template->'categories'->0->>'id')),key||' first edit materializes atomically') from catalog_worlds;
select is((select configuration_customized from public.worlds where id=w.id),true,key||' first edit marks customization') from catalog_worlds w;
reset role;
select is((select count(*) from public.world_categories where world_id=w.id),jsonb_array_length(template->'categories')::bigint,
 key||' materializes every category') from catalog_worlds w;
select is((select count(*) from public.world_field_definitions where world_id=w.id),
 (select count(*) from catalog_fields f where f.key=w.key),key||' materializes every field') from catalog_worlds w;
select ok(not exists(select 1 from catalog_fields f left join public.world_field_definitions d on d.id=(f.field->>'id')::uuid
 where f.key=w.key and (d.id is null or d.category_id<>(f.category->>'id')::uuid
 or d.configuration is distinct from f.field->'configuration' or d.binding is distinct from nullif(f.field->'binding','null')
 or d.key is distinct from f.field->>'key' or d.label is distinct from f.field->>'label'
 or d.type is distinct from f.field->>'type' or d.gm_only is distinct from (f.field->>'gm_only')::boolean
 or d.sort_order is distinct from (f.field->>'sort_order')::int)),key||' materialization preserves field identities and configurations') from catalog_worlds w;
select is((select name from public.world_categories where id=(w.template->'categories'->0->>'id')::uuid),
 'Custom locations',key||' applies the requested first edit') from catalog_worlds w;
-- A trusted template correction reaches inherited worlds without changing
-- a customized world's complete copy or rebasing existing identities.
set local role authenticated;
insert into catalog_worlds(key,setting_key,id) values
 ('inherited','world:starforged/forge',public.create_world('Shared defaults update',null,'world:starforged/forge'));
reset role;
update public.world_templates set configuration=jsonb_set(configuration,'{categories,0,fields,0,label}','"Place Type"'::jsonb)
 where setting_key='world:starforged/forge';
set local role authenticated;
select is((select f->>'label' from jsonb_array_elements(public.get_world_configuration(w.id)->'field_definitions') f
 where f->>'key'='locationType'),'Place Type','shared template updates reach existing inherited worlds')
 from catalog_worlds w where key='inherited';
select is((select f->>'label' from jsonb_array_elements(public.get_world_configuration(w.id)->'field_definitions') f
 where f->>'key'='locationType'),'Location Type','shared template updates preserve customized definitions')
 from catalog_worlds w where key='forge';
select is((select f->>'id' from jsonb_array_elements(public.get_world_configuration(w.id)->'field_definitions') f
 where f->>'key'='locationType'),extensions.uuid_generate_v5(w.id,'field:locations:locationType')::text,
 'shared template corrections preserve inherited field identities') from catalog_worlds w where key='inherited';
select is((select count(*) from public.world_categories c where c.world_id=w.id),0::bigint,
 'shared template corrections do not create per-world categories') from catalog_worlds w where key='inherited';
select is((select configuration_customized from public.worlds where id=w.id),false,
 'shared template corrections do not fork inherited worlds') from catalog_worlds w where key='inherited';
reset role;
-- New template categories need data changes only; category keys drive identity.
update public.world_templates set configuration=jsonb_set(configuration,'{categories}',
 configuration->'categories' || jsonb_build_array(configuration->'categories'->2 || jsonb_build_object(
 'key','organizations','id','f2000000-0000-4000-8000-000000000001','name','Organizations','sort_order',4,
 'subtitle_field_definition_id','f3000000-0000-4000-8000-000000000001',
 'fields',jsonb_build_array(jsonb_set(configuration->'categories'->2->'fields'->0,'{id}',
 '"f3000000-0000-4000-8000-000000000001"'::jsonb)))))
 where setting_key='world:starforged/forge';
select is((select c->>'id' from jsonb_array_elements(public.get_world_template(w.id,w.setting_key)->'categories') c
 where c->>'name'='Organizations'),extensions.uuid_generate_v5(w.id,'category:organizations')::text,
 'resolver supports a new category key without function changes') from catalog_worlds w where key='inherited';
select is((select c->'fields'->0->>'id' from jsonb_array_elements(public.get_world_template(w.id,w.setting_key)->'categories') c
 where c->>'name'='Organizations'),extensions.uuid_generate_v5(w.id,'field:organizations:tags')::text,
 'new category fields keep deterministic world-scoped identities') from catalog_worlds w where key='inherited';
select ok(not exists(select 1 from catalog_worlds w,
 lateral jsonb_array_elements(public.get_world_template(w.id,w.setting_key)->'categories') c where c ? 'key'),
 'template-only category keys stay out of the world configuration contract');
set local role authenticated;
select is(jsonb_array_length(public.get_world_configuration(w.id)->'categories'),5,
 'an added shared category appears in inherited world configuration') from catalog_worlds w where key='inherited';
select is(jsonb_array_length(public.get_world_configuration(w.id)->'categories'),4,
 'an added shared category does not change customized world configuration') from catalog_worlds w where key='forge';
reset role;
create temporary table shared_template_snapshot as
 select configuration from public.world_templates where setting_key='world:starforged/forge';
update public.world_templates set configuration=jsonb_set(configuration,'{categories,1,key}','"locations"'::jsonb)
 where setting_key='world:starforged/forge';
select throws_ok($$select public.get_world_template('f1000000-0000-4000-8000-000000000001','world:starforged/forge')$$,
 'P0001','Template category keys must be unique nonempty strings','duplicate template category keys fail closed');
update public.world_templates set configuration=(select jsonb_set(configuration,'{categories,1,key}','" "'::jsonb)
 from shared_template_snapshot) where setting_key='world:starforged/forge';
select throws_ok($$select public.get_world_template('f1000000-0000-4000-8000-000000000001','world:starforged/forge')$$,
 'P0001','Template category keys must be unique nonempty strings','empty template category keys fail closed');
update public.world_templates set configuration=(select configuration from shared_template_snapshot)
 where setting_key='world:starforged/forge';
-- Template edits derive persisted privacy immediately, including the Blank
-- fallback for unknown settings, while custom copies retain their own privacy.
set local role authenticated;
select set_config('request.jwt.claim.sub','f1000000-0000-4000-8000-000000000002',true);
insert into public.world_entries(id,world_id,category_id,name,author_id)
 select extensions.uuid_generate_v5(id,'privacy-entry'),id,extensions.uuid_generate_v5(id,'category:lore'),
 'Inherited privacy fixture',auth.uid() from catalog_worlds where key='inherited';
insert into public.world_entry_field_values(entry_id,field_definition_id,world_id,value)
 select extensions.uuid_generate_v5(id,'privacy-entry'),extensions.uuid_generate_v5(id,'field:lore:tags'),
 id,'["privacy"]'::jsonb from catalog_worlds where key='inherited';
insert into catalog_worlds(key,setting_key,id) values
 ('fallback','unknown',public.create_world('Unknown setting fallback',null,'unknown'));
insert into public.world_entries(id,world_id,category_id,name,author_id)
 select extensions.uuid_generate_v5(id,'privacy-entry'),id,extensions.uuid_generate_v5(id,'category:lore'),
 'Blank fallback privacy fixture',auth.uid() from catalog_worlds where key='fallback';
insert into public.world_entry_field_values(entry_id,field_definition_id,world_id,value)
 select extensions.uuid_generate_v5(id,'privacy-entry'),extensions.uuid_generate_v5(id,'field:lore:tags'),
 id,'["privacy"]'::jsonb from catalog_worlds where key='fallback';
reset role;
insert into auth.users(id) values ('f1000000-0000-4000-8000-000000000003');
insert into public.world_players(world_id,user_id,role)
 select id,'f1000000-0000-4000-8000-000000000003','viewer' from catalog_worlds where key in ('inherited','fallback');
set local role authenticated;
select set_config('request.jwt.claim.sub','f1000000-0000-4000-8000-000000000003',true);
select is((select count(*) from public.world_entry_field_values v join catalog_worlds w on w.id=v.world_id
 where w.key in ('inherited','fallback')),2::bigint,'viewer can initially read inherited public values');
reset role;
-- Set an old timestamp without the generic timestamp trigger replacing it;
-- restore normal trigger behavior before exercising the template correction.
alter table public.worlds disable trigger worlds_set_updated_at;
update public.worlds set updated_at='2000-01-01' where id in (select id from catalog_worlds where key in ('inherited','fallback','forge'));
alter table public.worlds enable trigger worlds_set_updated_at;
update public.world_templates set configuration=jsonb_set(configuration,'{categories,2,fields,0,gm_only}','true'::jsonb)
 where setting_key in ('world:starforged/forge','blank');
select ok((select bool_and(updated_at>'2000-01-01') from public.worlds w join catalog_worlds c on c.id=w.id
 where c.key in ('inherited','fallback')),'template corrections notify inherited world subscribers');
select is((select updated_at from public.worlds where id=(select id from catalog_worlds where key='forge')),
 '2000-01-01'::timestamptz,'template corrections do not invalidate customized worlds');
select ok((select bool_and(gm_only) from public.world_entry_field_values v join catalog_worlds w on w.id=v.world_id
 where w.key in ('inherited','fallback')),'shared template updates immediately derive inherited value privacy');
select is((select gm_only from public.world_field_definitions d join catalog_worlds w on w.id=d.world_id
 where w.key='forge' and d.key='tags' and d.category_id=extensions.uuid_generate_v5(w.id,'category:lore')),false,'shared privacy changes leave customized field privacy untouched');
set local role authenticated;
select is((select count(*) from public.world_entry_field_values v join catalog_worlds w on w.id=v.world_id
 where w.key in ('inherited','fallback')),0::bigint,'viewer cannot read values after shared defaults become Guide-only');
reset role;
update public.world_templates set configuration=jsonb_set(configuration,'{categories,2,fields,0,gm_only}','false'::jsonb)
 where setting_key in ('world:starforged/forge','blank');
set local role authenticated;
select is((select count(*) from public.world_entry_field_values v join catalog_worlds w on w.id=v.world_id
 where w.key in ('inherited','fallback')),2::bigint,'making inherited defaults public restores viewer access');
reset role;
-- Adding a supported setting changes existing Blank fallback worlds too.
insert into public.world_templates(setting_key,configuration)
 select 'unknown',jsonb_set(configuration,'{categories,2,fields,0,gm_only}','true'::jsonb)
 from public.world_templates where setting_key='blank';
select is((select gm_only from public.world_entry_field_values v join catalog_worlds w on w.id=v.world_id
 where w.key='fallback'),true,'adding a supported setting immediately derives inherited privacy');
set local role authenticated;
select is((select count(*) from public.world_entry_field_values v join catalog_worlds w on w.id=v.world_id
 where w.key='fallback'),0::bigint,'viewer cannot read values after a new setting makes them Guide-only');
reset role;
update public.world_templates set setting_key='renamed-setting' where setting_key='unknown';
select is((select gm_only from public.world_entry_field_values v join catalog_worlds w on w.id=v.world_id
 where w.key='fallback'),false,'renaming a template safely returns affected worlds to Blank fallback');
update public.world_templates set setting_key='unknown' where setting_key='renamed-setting';
select is((select gm_only from public.world_entry_field_values v join catalog_worlds w on w.id=v.world_id
 where w.key='fallback'),true,'renaming a template into a setting immediately derives privacy');
delete from public.world_templates where setting_key='unknown';
select is((select gm_only from public.world_entry_field_values v join catalog_worlds w on w.id=v.world_id
 where w.key='fallback'),false,'deleting a setting safely refreshes values against Blank fallback');
select throws_ok($$delete from public.world_templates where setting_key='blank'$$,
 'P0001','The Blank world template is required','the required Blank fallback cannot be deleted');
select * from finish();
rollback;
