-- Three storage types: the legacy mapping, select validation, value shapes,
-- populated type changes and per-field options. Every fixture is rolled back.
begin;
create extension if not exists pgtap with schema extensions;
set search_path = public,extensions;
select no_plan();

select is(pg_get_constraintdef(oid),'CHECK ((type = ANY (ARRAY[''text''::text, ''richText''::text, ''select''::text])))',
  'field definitions store only text, rich text and select')
  from pg_constraint where conname='world_field_definitions_type_check';
select ok(not has_function_privilege('authenticated','public.world_configuration_convert_legacy_field(jsonb,jsonb)','EXECUTE')
  and not has_function_privilege('anon','public.world_configuration_convert_legacy_field(jsonb,jsonb)','EXECUTE')
  and not has_function_privilege('authenticated','public.world_configuration_assert_no_oracle_text_values()','EXECUTE')
  and not has_function_privilege('authenticated','public.world_configuration_convert_field_values()','EXECUTE'),
  'conversion helpers are not exposed to clients');
select ok(has_function_privilege('authenticated','public.get_world_field_options(uuid,uuid)','EXECUTE')
  and not has_function_privilege('anon','public.get_world_field_options(uuid,uuid)','EXECUTE'),
  'only authenticated clients can read field options');
select is((select prosecdef from pg_proc where oid='public.get_world_field_options(uuid,uuid)'::regprocedure),false,
  'field options run as the caller so value row-level security applies');

-- Legacy mapping. Field identity and every key other than type, binding and
-- configuration pass through unchanged.
create function pg_temp.legacy(p_type text, p_configuration jsonb default '{}'::jsonb,
  p_binding jsonb default null) returns jsonb language sql as $$
  select jsonb_build_object('id','f0000000-0000-4000-8000-000000000001','key','legacy','label','Legacy',
    'type',p_type,'binding',p_binding,'gm_only',false,'sort_order',3,
    'configuration','{"version":1,"suggestions":[],"helpText":"","visible":true,"rules":[]}'::jsonb || p_configuration) $$;
create function pg_temp.convert(p_field jsonb, p_siblings jsonb default '[]'::jsonb) returns jsonb language sql as $$
  select public.world_configuration_convert_legacy_field(p_field,p_siblings) $$;
create function pg_temp.binding(p_name text) returns jsonb language sql as $$
  select jsonb_build_object('packageId','classic','oracleId','oracle_rollable:classic/'||p_name,
    'resolvedOracleId','oracle_rollable:classic/'||p_name) $$;
create function pg_temp.rule_on(p_field text, p_binding jsonb default null) returns jsonb language sql as $$
  select jsonb_build_object('conditions',jsonb_build_array(jsonb_build_object('source','entry','fieldId',p_field,
    'operator','equals','value','Area')),'label','Ruled') || case when p_binding is null then '{}'::jsonb
    else jsonb_build_object('binding',p_binding) end $$;

select is(pg_temp.convert(pg_temp.legacy('text')),pg_temp.legacy('text'),'text without suggestions stays text');
select is(pg_temp.convert(pg_temp.legacy('text','{"suggestions":["A","B"]}')),
  pg_temp.legacy('select','{"suggestions":["A","B"],"multiple":false,"allowOther":true}'),
  'text with suggestions becomes an open single list select keeping its options');
select is(pg_temp.convert(pg_temp.legacy('text'),jsonb_build_array(pg_temp.legacy('oracleText',jsonb_build_object('rules',
  jsonb_build_array(jsonb_build_object('conditions',jsonb_build_array(jsonb_build_object('source','ancestor',
    'fieldId','f0000000-0000-4000-8000-000000000009','operator','isNotEmpty',
    'ancestor',jsonb_build_object('fieldId','F0000000-0000-4000-8000-000000000001','value','Sector'))))))))),
  pg_temp.legacy('select','{"multiple":false,"allowOther":true}'),
  'text used as an ancestor selector becomes an open single list select');
select is(pg_temp.convert(pg_temp.legacy('text'),jsonb_build_array(pg_temp.legacy('oracleText',jsonb_build_object('rules',
  jsonb_build_array(pg_temp.rule_on('f0000000-0000-4000-8000-000000000001')))))),pg_temp.legacy('text'),
  'text used only as an entry condition source stays text');
select is(pg_temp.convert(pg_temp.legacy('oracleText',jsonb_build_object('rules',
  jsonb_build_array(pg_temp.rule_on('f0000000-0000-4000-8000-000000000002',pg_temp.binding('rule')))),pg_temp.binding('base'))),
  pg_temp.legacy('text',jsonb_build_object('rules',
  jsonb_build_array(pg_temp.rule_on('f0000000-0000-4000-8000-000000000002',pg_temp.binding('rule')))),pg_temp.binding('base')),
  'oracle text becomes text keeping its base and rule bindings and rule references');
select is(pg_temp.convert(pg_temp.legacy('number',jsonb_build_object('rules',
  jsonb_build_array(pg_temp.rule_on('f0000000-0000-4000-8000-000000000002'))),pg_temp.binding('base'))),
  pg_temp.legacy('text',jsonb_build_object('rules',
  jsonb_build_array(pg_temp.rule_on('f0000000-0000-4000-8000-000000000002'))),pg_temp.binding('base')),
  'number becomes text keeping its binding and rules');
select is(pg_temp.convert(pg_temp.legacy('richText',jsonb_build_object('rules',
  jsonb_build_array(pg_temp.rule_on('f0000000-0000-4000-8000-000000000002',pg_temp.binding('rule')))),pg_temp.binding('base'))),
  pg_temp.legacy('richText',jsonb_build_object('rules',
  jsonb_build_array(pg_temp.rule_on('f0000000-0000-4000-8000-000000000002')))),
  'rich text loses base and rule bindings but keeps rule conditions and labels');
select is(pg_temp.convert(pg_temp.legacy('tags')),pg_temp.legacy('select','{"multiple":true,"allowOther":true}'),
  'tags become an open multi list select');
select is(pg_temp.convert(pg_temp.legacy('categorySelect','{"targetCategoryId":"f1000000-0000-4000-8000-000000000001"}')),
  pg_temp.legacy('select','{"targetCategoryId":"f1000000-0000-4000-8000-000000000001","multiple":false,"allowOther":false}'),
  'category select becomes a strict single linked entry select');
select is(pg_temp.convert(pg_temp.legacy('categoryMultiSelect','{"targetCategoryId":"f1000000-0000-4000-8000-000000000001"}')),
  pg_temp.legacy('select','{"targetCategoryId":"f1000000-0000-4000-8000-000000000001","multiple":true,"allowOther":false}'),
  'category multi-select becomes a strict multi linked entry select');
select is(pg_temp.convert(pg_temp.legacy('text') || '{"key":"locationType"}'),
  pg_temp.legacy('select','{"multiple":false,"allowOther":true}') || '{"key":"locationType"}',
  'a Location Type without suggestions becomes an open single list select');
select is(pg_temp.convert(pg_temp.legacy('oracleText',p_binding=>pg_temp.binding('faction')) || '{"key":"factionType"}'),
  pg_temp.legacy('select','{"multiple":false,"allowOther":true}',pg_temp.binding('faction')) || '{"key":"factionType"}',
  'a Faction Type becomes an open single list select keeping its binding');
select is(pg_temp.convert(pg_temp.legacy('tags') || '{"key":"locationType"}'),
  pg_temp.legacy('select','{"multiple":true,"allowOther":true}') || '{"key":"locationType"}',
  'the intent override only replaces text');
select is(pg_temp.convert(pg_temp.legacy('text','{"suggestions":["A","B","A"]}')),
  pg_temp.legacy('select','{"suggestions":["A","B"],"multiple":false,"allowOther":true}'),
  'exact duplicate options collapse to their first occurrence');
select is(pg_temp.convert(pg_temp.legacy('text','{"suggestions":["A"," "]}'))->'configuration'->'suggestions',
  '["A"," "]'::jsonb,'blank options are left for the pre-flight check to report');
select is(pg_temp.convert(pg_temp.legacy('select','{"multiple":true,"allowOther":false,"suggestions":["A"]}')),
  pg_temp.legacy('select','{"multiple":true,"allowOther":false,"suggestions":["A"]}'),'conversion leaves current types unchanged');
select lives_ok($$select public.world_configuration_validate_field(converted->'configuration',converted->>'type')
  from (values (pg_temp.convert(pg_temp.legacy('text','{"suggestions":["A"]}'))),(pg_temp.convert(pg_temp.legacy('tags'))),
    (pg_temp.convert(pg_temp.legacy('number'))),(pg_temp.convert(pg_temp.legacy('richText'))),
    (pg_temp.convert(pg_temp.legacy('categorySelect','{"targetCategoryId":"f1000000-0000-4000-8000-000000000001"}')))) c(converted)$$,
  'every converted definition passes field validation');

-- Converted shared defaults.
create temporary view template_fields as
  select t.setting_key,c.value->>'key' as category_key,f.value as field
  from public.world_templates t,lateral jsonb_array_elements(t.configuration->'categories') c,
    lateral jsonb_array_elements(c.value->'fields') f;
select is((select count(*) from template_fields where field->>'type' not in ('text','richText','select')),0::bigint,
  'no shared default uses a legacy field type');
select lives_ok($$select public.world_configuration_validate_field(field->'configuration',field->>'type') from template_fields$$,
  'every shared default passes the consolidated field validation');
select is((select count(*) from template_fields where field->'binding'<>'null'::jsonb
  and (field->>'type'='richText' or field->'configuration' ? 'targetCategoryId')),0::bigint,
  'shared defaults bind oracles only to text and list selects');
select is((select count(*) from template_fields where field->>'key' in ('locationType','factionType')
  and not (field->>'type'='select' and field->'configuration'->>'multiple'='false'
    and field->'configuration'->>'allowOther'='true' and not field->'configuration' ? 'targetCategoryId')),0::bigint,
  'Location Type and Faction Type are open single list selects in every setting');
select is((select count(*) from template_fields where field->>'key'='locationType'),5::bigint,'every setting has a Location Type');
select is((select field->'configuration'->'suggestions' from template_fields
  where setting_key='blank' and category_key='factions' and field->>'key'='factionType'),'[]'::jsonb,
  'Blank keeps Factions with an open Faction Type and no suggestions');
select is((select field->'configuration'->'suggestions' from template_fields
  where setting_key='world:elegy/santa_maria' and field->>'key'='locationType'),'[]'::jsonb,
  'Santa Maria Location Type has no suggestions');
select ok(bool_and(field->>'type'='select' and field->'configuration'->>'multiple'='false'
  and field->'configuration'->>'allowOther'='true'),key||' is an open single list select')
  from template_fields join (values ('region'),('planetClass'),('species'),('difficulty'),('cursed'),('derelictLocation')) k(key)
  on field->>'key'=k.key group by k.key;
select ok(bool_and(field->>'type'='select' and field->'configuration'->>'multiple'='true'
  and field->'configuration'->>'allowOther'='true'),'every Tags default is an open multi list select')
  from template_fields where field->>'key'='tags';
select ok(bool_and(field->>'type'='select' and field->'configuration'->>'multiple'='false'
  and field->'configuration'->>'allowOther'='false'),'every NPC Location default is a strict single linked entry')
  from template_fields where category_key='npcs' and field->>'key'='location';
select is((select count(*) from template_fields where field->>'type'='text'
  and field->'configuration'->'suggestions'<>'[]'::jsonb),0::bigint,'text defaults carry no suggestions');

insert into auth.users(id) values
  ('f9000000-0000-4000-8000-000000000001'),('f9000000-0000-4000-8000-000000000002'),
  ('f9000000-0000-4000-8000-000000000003'),('f9000000-0000-4000-8000-000000000004'),
  ('f9000000-0000-4000-8000-000000000005');
create temporary table consolidation_worlds(key text primary key,id uuid);
grant select on consolidation_worlds to authenticated;
create function pg_temp.w(p_key text) returns uuid language sql as $$
  select id from consolidation_worlds where key=p_key $$;
create function pg_temp.c(p_key text,p_category text) returns uuid language sql as $$
  select extensions.uuid_generate_v5(pg_temp.w(p_key),'category:'||p_category) $$;
create function pg_temp.f(p_key text,p_category text,p_field text) returns uuid language sql as $$
  select extensions.uuid_generate_v5(pg_temp.w(p_key),'field:'||p_category||':'||p_field) $$;
create function pg_temp.cfg(p_extra jsonb default '{}'::jsonb) returns jsonb language sql as $$
  select '{"version":1,"suggestions":[],"helpText":"","visible":true,"rules":[]}'::jsonb || p_extra $$;
create function pg_temp.field(p_id text,p_type text,p_configuration jsonb,p_extra jsonb default '{}'::jsonb) returns jsonb language sql as $$
  select jsonb_build_object('type','create_field','category_id',pg_temp.c('main','locations'),
    'field',jsonb_build_object('id',p_id,'key','k'||right(p_id,4),'label','Field '||right(p_id,4),
      'type',p_type,'configuration',p_configuration) || p_extra) $$;
create function pg_temp.change(p_id uuid,p_changes jsonb) returns jsonb language sql as $$
  select jsonb_build_object('type','update_field','id',p_id,'changes',p_changes) $$;
create function pg_temp.mutate(p_operation jsonb) returns void language sql as $$
  select public.mutate_world_configuration(pg_temp.w('main'),p_operation) $$;
create function pg_temp.put(p_entry uuid,p_field uuid,p_value jsonb) returns void language sql as $$
  insert into public.world_entry_field_values(entry_id,field_definition_id,world_id,value)
    values (p_entry,p_field,pg_temp.w('main'),p_value)
  on conflict (entry_id,field_definition_id) do update set value=excluded.value $$;
create function pg_temp.stored(p_entry uuid,p_field uuid) returns jsonb language sql as $$
  select value from public.world_entry_field_values where entry_id=p_entry and field_definition_id=p_field $$;
create function pg_temp.with_rule(p_condition jsonb) returns jsonb language sql as $$
  select pg_temp.cfg(jsonb_build_object('rules',jsonb_build_array(jsonb_build_object('conditions',
    jsonb_build_array(p_condition),'visible',false)))) $$;

-- Owner f9..01, editor f9..02, guide f9..03, player f9..04, outsider f9..05.
select set_config('request.jwt.claim.sub','f9000000-0000-4000-8000-000000000001',true);
insert into consolidation_worlds values ('main',public.create_world('Consolidated fields')),
  ('forge',public.create_world('Inherited options',null,'world:starforged/forge'));
insert into public.world_players(world_id,user_id,role) values (pg_temp.w('main'),'f9000000-0000-4000-8000-000000000002','editor');
insert into public.games(id,name,game_type,world_id,rulesets,expansions,playset) values
  ('f9500000-0000-4000-8000-000000000001','Options game','guided',pg_temp.w('main'),'["classic"]','[]','{}'),
  ('f9500000-0000-4000-8000-000000000002','Forge game','guided',pg_temp.w('forge'),'["starforged"]','[]','{}');
insert into public.game_players(game_id,user_id,role) values
  ('f9500000-0000-4000-8000-000000000001','f9000000-0000-4000-8000-000000000003','guide'),
  ('f9500000-0000-4000-8000-000000000001','f9000000-0000-4000-8000-000000000004','player'),
  ('f9500000-0000-4000-8000-000000000002','f9000000-0000-4000-8000-000000000004','player');
select pg_temp.mutate(jsonb_build_object('type','update_category','id',pg_temp.c('main','locations'),
  'changes',jsonb_build_object('name','Places')));
select is((select type||':'||(configuration->>'multiple')||':'||(configuration->>'allowOther') from public.world_field_definitions
  where id=pg_temp.f('main','locations','locationType')),'select:false:true','first customization copies the open Location Type');

-- Configuration validation.
select throws_ok($$select pg_temp.mutate(pg_temp.field('f9100000-0000-4000-8000-000000000001','select',pg_temp.cfg()))$$,
  'P0001','Select fields require multiple and allowOther flags','select requires both flags');
select throws_ok($$select pg_temp.mutate(pg_temp.field('f9100000-0000-4000-8000-000000000001','select',
  pg_temp.cfg('{"multiple":"no","allowOther":true}')))$$,
  'P0001','Select fields require multiple and allowOther flags','select flags must be booleans');
select throws_ok($$select pg_temp.mutate(pg_temp.field('f9100000-0000-4000-8000-000000000001','text',
  pg_temp.cfg('{"multiple":false,"allowOther":true}')))$$,
  'P0001','Only select fields may set multiple or allowOther','text cannot carry select flags');
select throws_ok($$select pg_temp.mutate(pg_temp.field('f9100000-0000-4000-8000-000000000001','richText',
  pg_temp.cfg('{"allowOther":true}')))$$,
  'P0001','Only select fields may set multiple or allowOther','rich text cannot carry select flags');
select throws_ok($$select pg_temp.mutate(pg_temp.field('f9100000-0000-4000-8000-000000000001','text',
  pg_temp.cfg('{"suggestions":["Area"]}')))$$,
  'P0001','Invalid field suggestions or rule count','text has no suggestions; use an option list');
select throws_ok($$select pg_temp.mutate(pg_temp.field('f9100000-0000-4000-8000-000000000001','select',
  pg_temp.cfg('{"multiple":false,"allowOther":true,"suggestions":["Area","Area"]}')))$$,
  'P0001','Options must be unique and nonblank','duplicate options are rejected');
select throws_ok($$select pg_temp.mutate(pg_temp.field('f9100000-0000-4000-8000-000000000001','select',
  pg_temp.cfg('{"multiple":false,"allowOther":true,"suggestions":["Area","  "]}')))$$,
  'P0001','Options must be unique and nonblank','blank options are rejected');
select throws_ok($$select pg_temp.mutate(pg_temp.field('f9100000-0000-4000-8000-000000000001','tags',pg_temp.cfg()))$$,
  'P0001','Invalid field type','legacy types are rejected');
select throws_ok($$select pg_temp.mutate(pg_temp.field('f9100000-0000-4000-8000-000000000001','richText',pg_temp.cfg(),
  jsonb_build_object('binding',pg_temp.binding('base'))))$$,
  'P0001','Rich text fields cannot use oracle bindings','rich text has no base binding');
select throws_ok($$select pg_temp.mutate(pg_temp.field('f9100000-0000-4000-8000-000000000001','richText',
  pg_temp.cfg(jsonb_build_object('rules',jsonb_build_array(pg_temp.rule_on(
    pg_temp.f('main','locations','locationType')::text,pg_temp.binding('rule')))))))$$,
  'P0001','Rich text fields cannot use oracle bindings','rich text has no rule binding');
select lives_ok($$select pg_temp.mutate(pg_temp.field('f9100000-0000-4000-8000-000000000002','select',
  pg_temp.cfg('{"multiple":false,"allowOther":false,"suggestions":["Hot","Cold"]}'),
  jsonb_build_object('binding',pg_temp.binding('climate'))))$$,'a strict list select may roll from an oracle');
select lives_ok($$select pg_temp.mutate(pg_temp.field('f9100000-0000-4000-8000-000000000003','select',
  pg_temp.cfg('{"multiple":true,"allowOther":false,"suggestions":["River","Hill"]}')))$$,'a strict multi list select is valid');
select lives_ok($$select pg_temp.mutate(pg_temp.field('f9100000-0000-4000-8000-000000000004','richText',pg_temp.cfg()))$$,
  'rich text without bindings is valid');
select lives_ok($$select pg_temp.mutate(pg_temp.field('f9100000-0000-4000-8000-000000000005','select',
  pg_temp.cfg(jsonb_build_object('multiple',false,'allowOther',false,'targetCategoryId',pg_temp.c('main','locations')))))$$,
  'a single linked entry select may target its own category');
select lives_ok($$select pg_temp.mutate(pg_temp.field('f9100000-0000-4000-8000-000000000006','text',pg_temp.cfg(),
  jsonb_build_object('binding',pg_temp.binding('name'))))$$,'text may roll from an oracle');

-- Condition sources and operators.
create function pg_temp.condition(p_source uuid,p_operator text,p_value text default 'Hot') returns jsonb language sql as $$
  select jsonb_build_object('source','entry','fieldId',p_source,'operator',p_operator) ||
    case when p_value is null then '{}'::jsonb else jsonb_build_object('value',p_value) end $$;
create function pg_temp.ruled(p_condition jsonb) returns void language sql as $$
  select pg_temp.mutate(pg_temp.change('f9100000-0000-4000-8000-000000000006',
    jsonb_build_object('configuration',pg_temp.with_rule(p_condition)))) $$;
select lives_ok($$select pg_temp.ruled(pg_temp.condition('f9100000-0000-4000-8000-000000000002','equals'))$$,
  'equals works on a single list select');
select lives_ok($$select pg_temp.ruled(pg_temp.condition('f9100000-0000-4000-8000-000000000002','notEquals'))$$,
  'does not equal works on a single list select');
select lives_ok($$select pg_temp.ruled(pg_temp.condition('f9100000-0000-4000-8000-000000000003','contains','River'))$$,
  'contains works on a multi list select');
select lives_ok($$select pg_temp.ruled(pg_temp.condition('f9100000-0000-4000-8000-000000000003','notContains','River'))$$,
  'does not contain works on a multi list select');
select lives_ok($$select pg_temp.ruled(pg_temp.condition(pg_temp.f('main','locations','tags'),'isNotEmpty',null))$$,
  'emptiness works on a multi list select');
select lives_ok($$select pg_temp.ruled(pg_temp.condition('f9100000-0000-4000-8000-000000000005','isEmpty',null))$$,
  'emptiness works on a linked entry select');
select lives_ok($$select pg_temp.ruled(pg_temp.condition('f9100000-0000-4000-8000-000000000005','equals',
  'F9300000-0000-4000-8000-000000000001'))$$,'equals on a linked entry select compares an entry ID');
select throws_ok($$select pg_temp.ruled(pg_temp.condition('f9100000-0000-4000-8000-000000000005','equals','Old Mill'))$$,
  'P0001','Linked entry conditions must compare an entry ID','linked entry conditions never compare typed names');
select throws_ok($$select pg_temp.ruled(pg_temp.condition('f9100000-0000-4000-8000-000000000003','equals','River'))$$,
  'P0001','Condition source has an incompatible field type','equals is unavailable on multi selects');
select throws_ok($$select pg_temp.ruled(pg_temp.condition('f9100000-0000-4000-8000-000000000002','contains'))$$,
  'P0001','Condition source has an incompatible field type','contains is unavailable on single selects');
select throws_ok($$select pg_temp.ruled(pg_temp.condition(pg_temp.f('main','npcs','pronouns'),'isEmpty',null))$$,
  'P0001','Condition references a missing or foreign-category field','sources stay within the category');
select throws_ok($$select pg_temp.ruled(pg_temp.condition('f9100000-0000-4000-8000-000000000004','isEmpty',null))$$,
  'P0001','Condition source has an incompatible field type','rich text is never a condition source');
select throws_ok($$select pg_temp.ruled(pg_temp.condition('f9100000-0000-4000-8000-000000000003','contains',null))$$,
  'P0001','Invalid field condition','contains requires a value');
create function pg_temp.ancestor(p_selector uuid,p_value text default 'Sector') returns jsonb language sql as $$
  select jsonb_build_object('source','ancestor','fieldId','f9100000-0000-4000-8000-000000000002',
    'operator','equals','value','Hot','ancestor',jsonb_build_object('fieldId',p_selector,'value',p_value)) $$;
select lives_ok($$select pg_temp.ruled(pg_temp.ancestor(pg_temp.f('main','locations','locationType')))$$,
  'an open single list select can select an ancestor');
select lives_ok($$select pg_temp.ruled(pg_temp.ancestor('f9100000-0000-4000-8000-000000000005',
  'f9300000-0000-4000-8000-000000000001'))$$,'a single linked entry select can select an ancestor by entry ID');
select throws_ok($$select pg_temp.ruled(pg_temp.ancestor('f9100000-0000-4000-8000-000000000005'))$$,
  'P0001','Linked entry conditions must compare an entry ID','linked ancestor selectors compare entry IDs');
select throws_ok($$select pg_temp.ruled(pg_temp.ancestor('f9100000-0000-4000-8000-000000000003'))$$,
  'P0001','Ancestor selector must reference a single select field in the same category','multi selects cannot select an ancestor');
select throws_ok($$select pg_temp.ruled(pg_temp.ancestor('f9100000-0000-4000-8000-000000000006'))$$,
  'P0001','Ancestor selector must reference a single select field in the same category','text cannot select an ancestor');
select lives_ok($$select pg_temp.mutate(pg_temp.change('f9100000-0000-4000-8000-000000000006',
  jsonb_build_object('configuration',pg_temp.cfg())))$$,'rules can be cleared');

-- Value shapes and strict options.
insert into public.world_entries(id,world_id,category_id,name,author_id,read_permissions) values
  ('f9300000-0000-4000-8000-000000000001',pg_temp.w('main'),pg_temp.c('main','locations'),'Mill',auth.uid(),'all_players'),
  ('f9300000-0000-4000-8000-000000000002',pg_temp.w('main'),pg_temp.c('main','locations'),'Ford',auth.uid(),'all_players'),
  ('f9300000-0000-4000-8000-000000000003',pg_temp.w('main'),pg_temp.c('main','npcs'),'Miller',auth.uid(),'all_players'),
  ('f9300000-0000-4000-8000-000000000004',pg_temp.w('main'),pg_temp.c('main','lore'),'Legend',auth.uid(),'all_players');
select lives_ok($$select pg_temp.put('f9300000-0000-4000-8000-000000000001','f9100000-0000-4000-8000-000000000002','"Hot"')$$,
  'a strict list accepts one of its options');
select throws_ok($$select pg_temp.put('f9300000-0000-4000-8000-000000000002','f9100000-0000-4000-8000-000000000002','"Warm"')$$,
  'P0001','Value must be one of the field options','a strict list rejects other values');
select throws_ok($$select pg_temp.put('f9300000-0000-4000-8000-000000000002','f9100000-0000-4000-8000-000000000002','["Hot"]')$$,
  'P0001','Field value must be one string','a single select stores one string');
select lives_ok($$select pg_temp.put('f9300000-0000-4000-8000-000000000001','f9100000-0000-4000-8000-000000000003','["River","Hill"]')$$,
  'a strict multi list accepts several options');
select throws_ok($$select pg_temp.put('f9300000-0000-4000-8000-000000000002','f9100000-0000-4000-8000-000000000003','["River","Cave"]')$$,
  'P0001','Value must be one of the field options','a strict multi list rejects other values');
select throws_ok($$select pg_temp.put('f9300000-0000-4000-8000-000000000002','f9100000-0000-4000-8000-000000000003','["River","River"]')$$,
  'P0001','Selections must be unique strings of up to 1000 characters','multi list values are unique');
select throws_ok($$select pg_temp.put('f9300000-0000-4000-8000-000000000002','f9100000-0000-4000-8000-000000000003','"River"')$$,
  'P0001','Multiple selection must be an array of up to 100 strings','a multi select stores an array');
select throws_ok($$select pg_temp.put('f9300000-0000-4000-8000-000000000002','f9100000-0000-4000-8000-000000000003','[1]')$$,
  'P0001','Multiple selection must be an array of up to 100 strings','a multi select stores strings');
select lives_ok($$select pg_temp.put('f9300000-0000-4000-8000-000000000001',pg_temp.f('main','locations','locationType'),'"Old Mill"')$$,
  'an open list accepts other values');
select lives_ok($$select pg_temp.put('f9300000-0000-4000-8000-000000000001','f9100000-0000-4000-8000-000000000006','"Miller''s rest"')$$,
  'text stores one string');
select throws_ok($$select pg_temp.put('f9300000-0000-4000-8000-000000000002','f9100000-0000-4000-8000-000000000006','3')$$,
  'P0001','Field value must be one string','text never stores numbers');
select throws_ok($$select pg_temp.put('f9300000-0000-4000-8000-000000000002','f9100000-0000-4000-8000-000000000006',to_jsonb(repeat('x',1001)))$$,
  'P0001','Text values are limited to 1000 characters','text is limited to 1000 characters');
select lives_ok($$select pg_temp.put('f9300000-0000-4000-8000-000000000002','f9100000-0000-4000-8000-000000000006',to_jsonb(repeat('x',1000)))$$,
  'text may use 1000 characters');
delete from public.world_entry_field_values where entry_id='f9300000-0000-4000-8000-000000000002'
  and field_definition_id='f9100000-0000-4000-8000-000000000006';
select throws_ok($$insert into public.world_entry_field_values(entry_id,field_definition_id,world_id,content)
  values ('f9300000-0000-4000-8000-000000000002','f9100000-0000-4000-8000-000000000006',pg_temp.w('main'),'\x01')$$,
  'P0001','Only rich text values can contain collaborative content','text never stores collaborative content');
select throws_ok($$select pg_temp.put('f9300000-0000-4000-8000-000000000002','f9100000-0000-4000-8000-000000000004','"Prose"')$$,
  'P0001','Rich text values must be collaborative content','rich text never stores a JSON value');
select lives_ok($$insert into public.world_entry_field_values(entry_id,field_definition_id,world_id,content)
  values ('f9300000-0000-4000-8000-000000000001','f9100000-0000-4000-8000-000000000004',pg_temp.w('main'),'\x0102')$$,
  'rich text stores collaborative content');
select lives_ok($$select pg_temp.mutate(pg_temp.change('f9100000-0000-4000-8000-000000000002',
  jsonb_build_object('configuration',pg_temp.cfg('{"multiple":false,"allowOther":false,"suggestions":["Cold"]}'))))$$,
  'options can be removed while values use them');
select is(pg_temp.stored('f9300000-0000-4000-8000-000000000001','f9100000-0000-4000-8000-000000000002'),'"Hot"'::jsonb,
  'stored values are not rechecked when options change');
select lives_ok($$update public.world_entry_field_values set gm_only=gm_only where world_id=pg_temp.w('main')$$,
  'metadata refreshes keep values outside the current options');
select lives_ok($$select pg_temp.put('f9300000-0000-4000-8000-000000000001','f9100000-0000-4000-8000-000000000002','"Hot"')$$,
  'rewriting a retained value is not a new choice');
select throws_ok($$select pg_temp.put('f9300000-0000-4000-8000-000000000002','f9100000-0000-4000-8000-000000000002','"Hot"')$$,
  'P0001','Value must be one of the field options','another entry cannot choose a removed option');
select lives_ok($$select pg_temp.mutate(pg_temp.change('f9100000-0000-4000-8000-000000000003',
  jsonb_build_object('configuration',pg_temp.cfg('{"multiple":true,"allowOther":false,"suggestions":["River","Cave"]}'))))$$,
  'multi list options can change while values use them');
select lives_ok($$select pg_temp.put('f9300000-0000-4000-8000-000000000001','f9100000-0000-4000-8000-000000000003','["Hill","River","Cave"]')$$,
  'a multi value keeps a removed option while adding a current one');
select throws_ok($$select pg_temp.put('f9300000-0000-4000-8000-000000000001','f9100000-0000-4000-8000-000000000003','["Hill","Lake"]')$$,
  'P0001','Value must be one of the field options','a multi value cannot add a value outside the options');

-- Linked entries are always strict.
select lives_ok($$select pg_temp.put('f9300000-0000-4000-8000-000000000003',pg_temp.f('main','npcs','location'),
  '"F9300000-0000-4000-8000-000000000001"')$$,'a linked entry select accepts an entry in its category');
select is(pg_temp.stored('f9300000-0000-4000-8000-000000000003',pg_temp.f('main','npcs','location')),
  '"f9300000-0000-4000-8000-000000000001"'::jsonb,'linked entries are stored as canonical IDs');
select throws_ok($$select pg_temp.put('f9300000-0000-4000-8000-000000000003',pg_temp.f('main','npcs','location'),
  '"f9300000-0000-4000-8000-000000000004"')$$,
  'P0001','Selected entry is unavailable in the target category','a linked entry select rejects entries in other categories');
select throws_ok($$select pg_temp.put('f9300000-0000-4000-8000-000000000003',pg_temp.f('main','npcs','location'),'"Old Mill"')$$,
  '22P02',null,'a linked entry select never stores free text');
select throws_ok($$select pg_temp.put('f9300000-0000-4000-8000-000000000003',pg_temp.f('main','npcs','location'),
  '["f9300000-0000-4000-8000-000000000001"]')$$,
  'P0001','Field value must be one string','a single linked entry stores one ID');

-- Populated type changes.
select is(public.get_world_category_counts(pg_temp.w('main'),pg_temp.c('main','locations'))->'multiValueCounts'
  ->>'f9100000-0000-4000-8000-000000000003','1','counts report entries storing several values');
select is(public.get_world_category_counts(pg_temp.w('main'),pg_temp.c('main','locations'))->'multiValueCounts'
  ->>pg_temp.f('main','locations','locationType')::text,'0','single values are not counted as several');
select throws_ok($$select pg_temp.mutate(pg_temp.change('f9100000-0000-4000-8000-000000000003',
  jsonb_build_object('configuration',pg_temp.cfg('{"multiple":false,"allowOther":false,"suggestions":["River","Cave"]}'))))$$,
  'P0001','Entries store several values; create a new field','multi to single is blocked while an entry stores several values');
select throws_ok($$select pg_temp.mutate(pg_temp.change('f9100000-0000-4000-8000-000000000003',
  jsonb_build_object('type','text','configuration',pg_temp.cfg())))$$,
  'P0001','This type change cannot preserve existing values; create a new field','multi list to text is blocked');
select lives_ok($$select pg_temp.mutate(pg_temp.change(pg_temp.f('main','locations','locationType'),
  jsonb_build_object('configuration',pg_temp.cfg('{"multiple":true,"allowOther":true}'))))$$,
  'single to multi list is allowed with values');
select is(pg_temp.stored('f9300000-0000-4000-8000-000000000001',pg_temp.f('main','locations','locationType')),
  '["Old Mill"]'::jsonb,'single to multi wraps stored values');
select lives_ok($$select pg_temp.put('f9300000-0000-4000-8000-000000000002',pg_temp.f('main','locations','locationType'),'[]')$$,
  'a multi value may be empty');
select lives_ok($$select pg_temp.mutate(pg_temp.change(pg_temp.f('main','locations','locationType'),
  jsonb_build_object('configuration',pg_temp.cfg('{"multiple":false,"allowOther":true}'))))$$,
  'multi to single is allowed when every entry stores at most one value');
select is(pg_temp.stored('f9300000-0000-4000-8000-000000000001',pg_temp.f('main','locations','locationType')),
  '"Old Mill"'::jsonb,'multi to single unwraps stored values');
select is((select count(*) from public.world_entry_field_values where entry_id='f9300000-0000-4000-8000-000000000002'
  and field_definition_id=pg_temp.f('main','locations','locationType')),0::bigint,'multi to single removes empty values');
select throws_ok($$select pg_temp.mutate(pg_temp.change(pg_temp.f('main','locations','locationType'),
  jsonb_build_object('configuration',pg_temp.cfg(jsonb_build_object('multiple',false,'allowOther',false,
    'targetCategoryId',pg_temp.c('main','locations'))))))$$,
  'P0001','This type change cannot preserve existing values; create a new field','list to linked entry is blocked');
select throws_ok($$select pg_temp.mutate(pg_temp.change(pg_temp.f('main','npcs','location'),
  jsonb_build_object('configuration',pg_temp.cfg('{"multiple":false,"allowOther":true}'))))$$,
  'P0001','This type change cannot preserve existing values; create a new field','linked entry to list is blocked');
select throws_ok($$select pg_temp.mutate(pg_temp.change('f9100000-0000-4000-8000-000000000006',
  jsonb_build_object('type','richText')))$$,
  'P0001','This type change cannot preserve existing values; create a new field','text to rich text is blocked');
select throws_ok($$select pg_temp.mutate(pg_temp.change('f9100000-0000-4000-8000-000000000004',
  jsonb_build_object('type','text')))$$,
  'P0001','This type change cannot preserve existing values; create a new field','rich text to text is blocked');
select lives_ok($$select pg_temp.mutate(pg_temp.change('f9100000-0000-4000-8000-000000000002',
  jsonb_build_object('type','text','configuration',pg_temp.cfg())))$$,'single list to text is allowed');
select is(pg_temp.stored('f9300000-0000-4000-8000-000000000001','f9100000-0000-4000-8000-000000000002'),'"Hot"'::jsonb,
  'single list to text keeps the stored string');
select throws_ok($$select pg_temp.mutate(pg_temp.change('f9100000-0000-4000-8000-000000000002',
  jsonb_build_object('type','select','configuration',pg_temp.cfg('{"multiple":true,"allowOther":true}'))))$$,
  'P0001','This type change cannot preserve existing values; create a new field','text to a multi list is blocked');
select lives_ok($$select pg_temp.mutate(pg_temp.change('f9100000-0000-4000-8000-000000000002',
  jsonb_build_object('type','select','configuration',pg_temp.cfg('{"multiple":false,"allowOther":false,"suggestions":["Cold"]}'))))$$,
  'text to a strict single list is allowed');
select is(pg_temp.stored('f9300000-0000-4000-8000-000000000001','f9100000-0000-4000-8000-000000000002'),'"Hot"'::jsonb,
  'text to a strict list keeps stored values outside the options');
select lives_ok($$select pg_temp.mutate(pg_temp.change('f9100000-0000-4000-8000-000000000002',
  jsonb_build_object('gm_only',true)))$$,'converted values still refresh when Guide-only visibility changes');
select lives_ok($$select pg_temp.mutate(pg_temp.change('f9100000-0000-4000-8000-000000000002',
  jsonb_build_object('gm_only',false)))$$,'converted values refresh when visibility is restored');
select lives_ok($$select pg_temp.mutate(pg_temp.change('f9100000-0000-4000-8000-000000000002',
  jsonb_build_object('type','text','configuration',pg_temp.cfg())))$$,'a strict single list may return to text');
select lives_ok($$select pg_temp.mutate(pg_temp.change('f9100000-0000-4000-8000-000000000002',
  jsonb_build_object('type','select','configuration',pg_temp.cfg('{"multiple":false,"allowOther":true,"suggestions":["Cold"]}'))))$$,
  'text to an open single list is allowed');
select lives_ok($$select pg_temp.mutate(pg_temp.change('f9100000-0000-4000-8000-000000000002',
  jsonb_build_object('configuration',pg_temp.cfg('{"multiple":false,"allowOther":false,"suggestions":["Cold"]}'))))$$,
  'an open list may become strict while values exist');
select lives_ok($$select pg_temp.mutate(pg_temp.change(pg_temp.f('main','locations','tags'),
  jsonb_build_object('type','select','configuration',pg_temp.cfg('{"multiple":false,"allowOther":true}'))))$$,
  'an empty multi field can change freely');

-- Wrapping a linked value keeps a private target chosen by its author.
select set_config('request.jwt.claim.sub','f9000000-0000-4000-8000-000000000002',true);
insert into public.world_entries(id,world_id,category_id,name,author_id,read_permissions) values
  ('f9300000-0000-4000-8000-000000000005',pg_temp.w('main'),pg_temp.c('main','locations'),'Hideout',auth.uid(),'only_author');
select lives_ok($$select pg_temp.put('f9300000-0000-4000-8000-000000000003',pg_temp.f('main','npcs','location'),
  '"f9300000-0000-4000-8000-000000000005"')$$,'an author links their private location');
select set_config('request.jwt.claim.sub','f9000000-0000-4000-8000-000000000001',true);
select lives_ok($$select pg_temp.mutate(pg_temp.change(pg_temp.f('main','npcs','location'),
  jsonb_build_object('configuration',pg_temp.cfg(jsonb_build_object('multiple',true,'allowOther',false,
    'targetCategoryId',pg_temp.c('main','locations'))))))$$,
  'another editor can allow several linked entries without reading the private target');
select is(pg_temp.stored('f9300000-0000-4000-8000-000000000003',pg_temp.f('main','npcs','location')),
  '["f9300000-0000-4000-8000-000000000005"]'::jsonb,'linked values wrap without losing private targets');
select throws_ok($$select pg_temp.put('f9300000-0000-4000-8000-000000000003',pg_temp.f('main','npcs','location'),
  '["f9300000-0000-4000-8000-000000000005","f9300000-0000-4000-8000-000000000001"]')$$,
  'P0001','Selected entry is unavailable in the target category','changing a selection rechecks every target for the actor');
select lives_ok($$select pg_temp.mutate(pg_temp.change(pg_temp.f('main','npcs','location'),
  jsonb_build_object('configuration',pg_temp.cfg(jsonb_build_object('multiple',false,'allowOther',false,
    'targetCategoryId',pg_temp.c('main','locations'))))))$$,'linked values unwrap again');
select is(pg_temp.stored('f9300000-0000-4000-8000-000000000003',pg_temp.f('main','npcs','location')),
  '"f9300000-0000-4000-8000-000000000005"'::jsonb,'linked values unwrap without losing private targets');

-- Upserts keep retained options only for callers who can read the stored row,
-- so a strict-list error never reveals a hidden value.
select pg_temp.mutate(pg_temp.field('f9100000-0000-4000-8000-000000000008','select',
  pg_temp.cfg('{"multiple":false,"allowOther":false,"suggestions":["A","B"]}')));
select pg_temp.mutate(pg_temp.field('f9100000-0000-4000-8000-000000000009','select',
  pg_temp.cfg('{"multiple":false,"allowOther":false,"suggestions":["A","B"]}'),'{"gm_only":true}'));
insert into public.world_entries(id,world_id,category_id,name,author_id,read_permissions) values
  ('f9300000-0000-4000-8000-000000000006',pg_temp.w('main'),pg_temp.c('main','locations'),'Base',auth.uid(),'only_guides');
select pg_temp.put(entry_id::uuid,field_id::uuid,'"A"') from (values
  ('f9300000-0000-4000-8000-000000000001','f9100000-0000-4000-8000-000000000008'),
  ('f9300000-0000-4000-8000-000000000006','f9100000-0000-4000-8000-000000000008'),
  ('f9300000-0000-4000-8000-000000000001','f9100000-0000-4000-8000-000000000009')) v(entry_id,field_id);
select pg_temp.mutate(pg_temp.change(id::uuid,jsonb_build_object('configuration',
  pg_temp.cfg('{"multiple":false,"allowOther":false,"suggestions":["B"]}'))))
  from (values ('f9100000-0000-4000-8000-000000000008'),('f9100000-0000-4000-8000-000000000009')) v(id);
set local role authenticated;
select lives_ok($$select pg_temp.put('f9300000-0000-4000-8000-000000000001','f9100000-0000-4000-8000-000000000008','"A"')$$,
  'an owner upsert keeps a retained option');
select lives_ok($$select pg_temp.put('f9300000-0000-4000-8000-000000000006','f9100000-0000-4000-8000-000000000008','"A"')$$,
  'an owner upsert keeps a retained option on a Guide-only entry');
select set_config('request.jwt.claim.sub','f9000000-0000-4000-8000-000000000004',true);
select lives_ok($$select pg_temp.put('f9300000-0000-4000-8000-000000000001','f9100000-0000-4000-8000-000000000008','"A"')$$,
  'a player upsert keeps a retained option on a readable entry');
select throws_ok($$select pg_temp.put('f9300000-0000-4000-8000-000000000006','f9100000-0000-4000-8000-000000000008','"A"')$$,
  'P0001','Value must be one of the field options','an upsert cannot probe values on unreadable entries');
select throws_ok($$select pg_temp.put('f9300000-0000-4000-8000-000000000001','f9100000-0000-4000-8000-000000000009','"A"')$$,
  'P0001','Value must be one of the field options','an upsert cannot probe Guide-only values');
reset role;
select set_config('request.jwt.claim.sub','f9000000-0000-4000-8000-000000000001',true);
delete from public.world_entry_field_values where field_definition_id in
  ('f9100000-0000-4000-8000-000000000008','f9100000-0000-4000-8000-000000000009');

-- Options: suggestions first, then other stored values readable by the caller.
select pg_temp.mutate(pg_temp.change(pg_temp.f('main','locations','locationType'),
  jsonb_build_object('configuration',pg_temp.cfg('{"multiple":false,"allowOther":true,"suggestions":["Village","Ruin"]}'))));
select pg_temp.mutate(pg_temp.field('f9100000-0000-4000-8000-000000000007','select',
  pg_temp.cfg('{"multiple":true,"allowOther":true,"suggestions":["Secret"]}'),'{"gm_only":true}'));
insert into public.world_entries(id,world_id,category_id,name,author_id,read_permissions) values
  ('f9300000-0000-4000-8000-000000000007',pg_temp.w('main'),pg_temp.c('main','locations'),'Camp','f9000000-0000-4000-8000-000000000004','only_author'),
  ('f9300000-0000-4000-8000-000000000008',pg_temp.w('main'),pg_temp.c('main','locations'),'Ford','f9000000-0000-4000-8000-000000000004','public');
select pg_temp.put('f9300000-0000-4000-8000-000000000002',pg_temp.f('main','locations','locationType'),'"Village"');
select pg_temp.put('f9300000-0000-4000-8000-000000000006',pg_temp.f('main','locations','locationType'),'"Hidden Base"');
select pg_temp.put('f9300000-0000-4000-8000-000000000007',pg_temp.f('main','locations','locationType'),'"Player Camp"');
select pg_temp.put('f9300000-0000-4000-8000-000000000008',pg_temp.f('main','locations','locationType'),'""');
select pg_temp.put('f9300000-0000-4000-8000-000000000001','f9100000-0000-4000-8000-000000000007','["Smugglers","Cult"]');
select pg_temp.put('f9300000-0000-4000-8000-000000000002','f9100000-0000-4000-8000-000000000007','["Cult","Secret"]');
select pg_temp.put('f9300000-0000-4000-8000-000000000002','f9100000-0000-4000-8000-000000000006','"Toll bridge"');
create temporary table configuration_before as select id,type,configuration from public.world_field_definitions
  where world_id=pg_temp.w('main');
grant select on configuration_before to authenticated;

set local role authenticated;
select set_config('request.jwt.claim.sub','f9000000-0000-4000-8000-000000000001',true);
select is(public.get_world_field_options(pg_temp.w('main'),pg_temp.f('main','locations','locationType')),
  array['Village','Ruin','Hidden Base','Old Mill'],
  'owners see suggestions in order, then readable stored values sorted without duplicates or blanks');
select is(public.get_world_field_options(pg_temp.w('main'),'f9100000-0000-4000-8000-000000000007'),
  array['Secret','Cult','Smugglers'],'multi values are flattened into Guide-only options for owners');
select is(public.get_world_field_options(pg_temp.w('main'),'f9100000-0000-4000-8000-000000000006'),
  array['Miller''s rest','Toll bridge'],'text fields offer their stored values');
select throws_ok($$select public.get_world_field_options(pg_temp.w('main'),pg_temp.f('main','npcs','location'))$$,
  'P0001','Only text and option list fields have options','linked entry selects have no option list');
select throws_ok($$select public.get_world_field_options(pg_temp.w('main'),'f9100000-0000-4000-8000-000000000004')$$,
  'P0001','Only text and option list fields have options','rich text has no option list');
select throws_ok($$select public.get_world_field_options(pg_temp.w('main'),'f9100000-0000-4000-8000-000000000099')$$,
  'P0001','Unknown world field definition','unknown fields are rejected');
select throws_ok($$select public.get_world_field_options(pg_temp.w('main'),pg_temp.f('forge','locations','locationType'))$$,
  'P0001','Unknown world field definition','fields from another world are rejected');
select set_config('request.jwt.claim.sub','f9000000-0000-4000-8000-000000000003',true);
select is(public.get_world_field_options(pg_temp.w('main'),pg_temp.f('main','locations','locationType')),
  array['Village','Ruin','Hidden Base','Old Mill'],'Guides see Guide-only entries but not author-only entries');
select is(public.get_world_field_options(pg_temp.w('main'),'f9100000-0000-4000-8000-000000000007'),
  array['Secret','Cult','Smugglers'],'Guides see Guide-only field options');
select set_config('request.jwt.claim.sub','f9000000-0000-4000-8000-000000000004',true);
select is(public.get_world_field_options(pg_temp.w('main'),pg_temp.f('main','locations','locationType')),
  array['Village','Ruin','Old Mill','Player Camp'],'players see their own private entries but not Guide-only entries');
select is(public.get_world_field_options(pg_temp.w('main'),'f9100000-0000-4000-8000-000000000007'),
  '{}'::text[],'players receive no options for Guide-only fields');
select is(public.get_world_field_options(pg_temp.w('forge'),pg_temp.f('forge','locations','locationType')),
  array['Sector','Planet','Planetside Settlement','Non-Planetary Settlement','Star','Derelict','Vault'],
  'inherited defaults offer their suggestions without customization');
select is((select configuration_customized from public.worlds where id=pg_temp.w('forge')),false,
  'reading options never forks inherited defaults');
select set_config('request.jwt.claim.sub','f9000000-0000-4000-8000-000000000005',true);
select throws_ok($$select public.get_world_field_options(pg_temp.w('main'),pg_temp.f('main','locations','locationType'))$$,
  '42501','World configuration is unavailable','non-members cannot read options');
reset role;
select is((select count(*) from public.world_field_definitions d join configuration_before b using (id)
  where d.type is distinct from b.type or d.configuration is distinct from b.configuration),0::bigint,
  'reading options writes nothing to configuration');

-- The oracle text guard covers stored definitions and inherited defaults.
select lives_ok($$select public.world_configuration_assert_no_oracle_text_values()$$,'current values pass the oracle text guard');
set constraints all immediate;
alter table public.world_field_definitions drop constraint world_field_definitions_type_check;
set local session_replication_role = replica;
update public.world_field_definitions set type='oracleText',configuration=configuration-array['multiple','allowOther']
  where id='f9100000-0000-4000-8000-000000000002';
set local session_replication_role = origin;
select throws_ok($$select public.world_configuration_assert_no_oracle_text_values()$$,
  'P0001','Remove oracle text values before consolidating world field types','stored oracle text values fail the guard');
delete from public.world_entry_field_values where field_definition_id='f9100000-0000-4000-8000-000000000002';
select lives_ok($$select public.world_configuration_assert_no_oracle_text_values()$$,'oracle text definitions without values pass');
select set_config('request.jwt.claim.sub','f9000000-0000-4000-8000-000000000001',true);
insert into public.world_entries(id,world_id,category_id,name,author_id) values
  ('f9300000-0000-4000-8000-000000000009',pg_temp.w('forge'),pg_temp.c('forge','locations'),'Star',auth.uid());
insert into public.world_entry_field_values(entry_id,field_definition_id,world_id,value) values
  ('f9300000-0000-4000-8000-000000000009',pg_temp.f('forge','locations','starDescription'),pg_temp.w('forge'),'"Bright"');
set local session_replication_role = replica;
update public.world_templates t set configuration=jsonb_set(t.configuration,'{categories}',(
  select jsonb_agg(jsonb_set(c.value,'{fields}',(select jsonb_agg(case when f.value->>'key'='starDescription'
    then jsonb_set(f.value,'{type}','"oracleText"') else f.value end order by f.position)
    from jsonb_array_elements(c.value->'fields') with ordinality f(value,position))) order by c.position)
  from jsonb_array_elements(t.configuration->'categories') with ordinality c(value,position)))
  where setting_key='world:starforged/forge';
set local session_replication_role = origin;
select throws_ok($$select public.world_configuration_assert_no_oracle_text_values()$$,
  'P0001','Remove oracle text values before consolidating world field types','inherited oracle text values fail the guard');

select * from finish();
rollback;
