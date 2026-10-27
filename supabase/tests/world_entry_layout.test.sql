-- Full width Text fields: only Text fields may set the option, and no shared
-- template field sets it. Every fixture is rolled back.
begin;
create extension if not exists pgtap with schema extensions;
set search_path = public,extensions;
select no_plan();

create function pg_temp.cfg(p_extra jsonb default '{}'::jsonb) returns jsonb language sql as $$
  select '{"version":1,"suggestions":[],"helpText":"","visible":true,"rules":[]}'::jsonb || p_extra $$;
create function pg_temp.template_field(p_setting text,p_category text,p_field text) returns jsonb language sql as $$
  select d from public.world_templates t,
    jsonb_array_elements(t.configuration->'categories') c,
    jsonb_array_elements(c->'fields') d
  where t.setting_key = p_setting and c->>'key' = p_category and d->>'key' = p_field $$;

select lives_ok($$select public.world_configuration_validate_field(pg_temp.cfg('{"fullWidth":true}'),'text')$$,
  'a Text field can take the full row');
select lives_ok($$select public.world_configuration_validate_field(pg_temp.cfg('{"fullWidth":false}'),'text')$$,
  'a Text field can turn full width off');
select throws_ok($$select public.world_configuration_validate_field(pg_temp.cfg('{"fullWidth":"yes"}'),'text')$$,
  'Only text fields may set fullWidth', 'full width is a boolean');
select throws_ok($$select public.world_configuration_validate_field(
    pg_temp.cfg('{"fullWidth":true,"multiple":false,"allowOther":true}'),'select')$$,
  'Only text fields may set fullWidth', 'option lists always size themselves');
select throws_ok($$select public.world_configuration_validate_field(pg_temp.cfg('{}'),'richText')$$,
  'Invalid field type', 'Long text is no longer a field type');

select ok(not (pg_temp.template_field('world:classic/ironlands','npcs','goal')->'configuration' ? 'fullWidth'),
  'an Ironlands NPC Goal shares its row');
select ok(not (pg_temp.template_field('world:starforged/forge','factions','rumors')->'configuration' ? 'fullWidth'),
  'a long oracle result shares its row');
select is((select count(*) from public.world_templates t,
    jsonb_array_elements(t.configuration->'categories') c,
    jsonb_array_elements(c->'fields') d
  where d->'configuration' ? 'fullWidth'),0::bigint,
  'no template field takes the full row');
select is((select count(*) from public.world_templates t,
    jsonb_array_elements(t.configuration->'categories') c,
    jsonb_array_elements(c->'fields') d
  where d->'configuration' ? 'fullWidth' and d->>'type' <> 'text'),0::bigint,
  'only Text template fields set full width');
select lives_ok($$select public.world_configuration_validate_field(d->'configuration',d->>'type')
  from public.world_templates t,
    jsonb_array_elements(t.configuration->'categories') c,
    jsonb_array_elements(c->'fields') d$$,
  'every template field is still valid');

select * from finish();
rollback;
