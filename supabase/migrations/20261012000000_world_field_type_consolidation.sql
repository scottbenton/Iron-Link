-- World fields store three types: text (plain string), richText (Yjs content)
-- and select (one or many strings from a list, or entry IDs when the
-- configuration names a targetCategoryId). Rules compare picked values instead
-- of hand-typed text. Field identities, keys and rule references are retained.
begin;

-- The deterministic legacy mapping. Category siblings identify ancestor
-- selectors, which must stay single selects for their rules to remain valid.
-- Location Type and Faction Type are picked by intent. Exact duplicate options
-- collapse to their first occurrence, which loses nothing; blank options are
-- reported by the pre-flight check instead of being rewritten.
-- Retained (revoked) as the record of the conversion and for its tests.
create function public.world_configuration_convert_legacy_field(p_field jsonb, p_category_fields jsonb) returns jsonb
language plpgsql immutable set search_path = '' as $$
declare configuration jsonb := p_field->'configuration'; converted jsonb := p_field;
begin
  case p_field->>'type'
  when 'text' then
    if configuration->'suggestions' <> '[]'::jsonb or exists (
      select 1 from jsonb_array_elements(coalesce(p_category_fields,'[]'::jsonb)) s,
        lateral jsonb_array_elements(s->'configuration'->'rules') r,
        lateral jsonb_array_elements(r->'conditions') c
      where c->>'source' = 'ancestor' and (c->'ancestor'->>'fieldId')::uuid = (p_field->>'id')::uuid) then
      converted := p_field || jsonb_build_object('type','select',
        'configuration',configuration || '{"multiple":false,"allowOther":true}'::jsonb);
    end if;
  when 'oracleText','number' then
    converted := p_field || jsonb_build_object('type','text',
      'configuration',jsonb_set(configuration,'{suggestions}','[]'::jsonb));
  when 'richText' then
    converted := p_field || jsonb_build_object('binding',null,'configuration',jsonb_set(configuration,'{rules}',
      coalesce((select jsonb_agg(r.value - 'binding' order by r.position)
        from jsonb_array_elements(configuration->'rules') with ordinality r(value,position)),'[]'::jsonb)));
  when 'tags' then
    converted := p_field || jsonb_build_object('type','select',
      'configuration',configuration || '{"multiple":true,"allowOther":true}'::jsonb);
  when 'categorySelect','categoryMultiSelect' then
    converted := p_field || jsonb_build_object('type','select','configuration',configuration
      || jsonb_build_object('multiple',p_field->>'type' = 'categoryMultiSelect','allowOther',false,
        'suggestions','[]'::jsonb));
  else
    null;
  end case;
  if converted->>'key' in ('locationType','factionType') and converted->>'type' = 'text' then
    converted := converted || jsonb_build_object('type','select',
      'configuration',converted->'configuration' || '{"multiple":false,"allowOther":true}'::jsonb);
  end if;
  if converted->>'type' = 'select' then
    converted := jsonb_set(converted,'{configuration,suggestions}',coalesce((
      select jsonb_agg(o.value order by o.position) from (select e.value, min(e.position) as position
        from jsonb_array_elements(converted->'configuration'->'suggestions') with ordinality e(value,position)
        group by e.value) o),'[]'::jsonb));
  end if;
  return converted;
end $$;

-- Oracle text stored Yjs documents; SQL cannot turn them into plain strings.
-- Retained (revoked) so tests can exercise the guard against fixtures.
create function public.world_configuration_assert_no_oracle_text_values() returns void
language plpgsql stable set search_path = '' as $$
begin
  if exists (select 1 from (select distinct world_id from public.world_entry_field_values) w,
    lateral public.get_world_effective_categories(w.world_id) c,
    lateral jsonb_array_elements(c->'fields') f
    join public.world_entry_field_values v on v.field_definition_id = (f->>'id')::uuid
    where v.world_id = w.world_id and f->>'type' = 'oracleText') then
    raise exception 'Remove oracle text values before consolidating world field types';
  end if;
end $$;
select public.world_configuration_assert_no_oracle_text_values();


-- Definitions and stored values are revalidated after conversion. Report
-- legacy data that would fail, per problem with field IDs, instead of a
-- row-level trigger error. Nothing is repaired automatically.
do $$
declare report text; options_report text;
begin
  with converted as (
    select v.field_definition_id, v.value, v.content, f->>'type' as legacy_type, x.field
    from (select distinct world_id from public.world_entry_field_values) vw,
      lateral public.get_world_effective_categories(vw.world_id) c,
      lateral jsonb_array_elements(c->'fields') f,
      lateral public.world_configuration_convert_legacy_field(f, c->'fields') x(field)
      join public.world_entry_field_values v on v.field_definition_id = (x.field->>'id')::uuid
    where v.world_id = vw.world_id
  ), checked as (
    select field_definition_id, unnest(array[
      case when field->>'type' = 'richText' and coalesce(value,'null'::jsonb) <> 'null'::jsonb
        then 'rich text with a JSON value' end,
      case when field->>'type' <> 'richText' and content is not null
        then 'collaborative content outside rich text' end,
      case when field->>'type' = 'text' and coalesce(value,'null'::jsonb) <> 'null'::jsonb
        and jsonb_typeof(value) <> 'string' and not (legacy_type = 'number' and jsonb_typeof(value) = 'number')
        then 'text that is not a string' end,
      case when field->>'type' = 'select' and not (field->'configuration'->>'multiple')::boolean
        and coalesce(value,'null'::jsonb) <> 'null'::jsonb and jsonb_typeof(value) <> 'string'
        then 'single selection that is not one string' end,
      case when field->>'type' = 'select' and (field->'configuration'->>'multiple')::boolean
        and coalesce(value,'null'::jsonb) <> 'null'::jsonb and (jsonb_typeof(value) <> 'array'
          or case jsonb_typeof(value) when 'array' then jsonb_array_length(value) > 100
            or exists (select 1 from jsonb_array_elements(value) i where jsonb_typeof(i) <> 'string') else false end)
        then 'multiple selection that is not an array of up to 100 strings' end,
      case when field->>'type' = 'select' and (field->'configuration'->>'multiple')::boolean
        and jsonb_typeof(value) = 'array' and case jsonb_typeof(value) when 'array' then
          (select count(distinct i) from jsonb_array_elements(value) i) <> jsonb_array_length(value) else false end
        then 'duplicate selections' end,
      case when (field->>'type' = 'text' or field->>'type' = 'select' and not (field->'configuration' ? 'targetCategoryId'))
        and jsonb_typeof(value) in ('string','array') and exists (select 1 from jsonb_array_elements(
          case jsonb_typeof(value) when 'array' then value else jsonb_build_array(value) end) i
          where jsonb_typeof(i) = 'string' and length(i #>> '{}') > 1000)
        then 'values longer than 1000 characters' end]) as problem
    from converted
  )
  select string_agg(format('%s: %s values in fields %s', problem, total, fields), '; ' order by problem) into report
    from (select problem, count(*) as total,
      array_to_string((array_agg(distinct field_definition_id::text))[1:20], ', ') as fields
      from checked where problem is not null group by problem) problems;
  with legacy as (
    select to_jsonb(d) as field, (select jsonb_agg(to_jsonb(s)) from public.world_field_definitions s
      where s.category_id = d.category_id) as siblings from public.world_field_definitions d
    union all
    select f.value, c.value->'fields' from public.world_templates t,
      lateral jsonb_array_elements(t.configuration->'categories') c,
      lateral jsonb_array_elements(c.value->'fields') f
  )
  select format('blank options: %s fields %s', count(*),
    array_to_string((array_agg(x.field->>'id' order by x.field->>'id'))[1:20], ', ')) into options_report
    from legacy, lateral public.world_configuration_convert_legacy_field(legacy.field, legacy.siblings) x(field)
    where x.field->>'type' = 'select' and exists (select 1
      from jsonb_array_elements(x.field->'configuration'->'suggestions') o
      where jsonb_typeof(o) = 'string' and trim(o #>> '{}') = '')
    having count(*) > 0;
  if report is not null or options_report is not null then
    raise exception 'Repair world fields before consolidating field types: %',
      concat_ws('; ', options_report, report);
  end if;
end $$;

-- Number values become text strings before definitions change type.
update public.world_entry_field_values v set value = to_jsonb(v.value #>> '{}')
  from (select distinct world_id from public.world_entry_field_values) w,
    lateral public.get_world_effective_categories(w.world_id) c,
    lateral jsonb_array_elements(c->'fields') f
  where v.world_id = w.world_id and v.field_definition_id = (f->>'id')::uuid
    and f->>'type' = 'number' and jsonb_typeof(v.value) = 'number';

alter table public.world_field_definitions drop constraint world_field_definitions_type_check;

create or replace function public.world_configuration_validate_field(p_configuration jsonb, p_type text) returns void
language plpgsql set search_path = '' as $$
declare r jsonb; c jsonb; linked boolean;
begin
  if p_configuration is null or jsonb_typeof(p_configuration) <> 'object'
    or not (p_configuration ?& array['version','suggestions','helpText','visible','rules'])
    or p_configuration - array['version','suggestions','helpText','visible','rules','targetCategoryId',
      'multiple','allowOther'] <> '{}'::jsonb
    or p_configuration->'version' <> '1'::jsonb
    or jsonb_typeof(p_configuration->'suggestions') <> 'array'
    or jsonb_typeof(p_configuration->'rules') <> 'array'
    or jsonb_typeof(p_configuration->'helpText') <> 'string'
    or length(p_configuration->>'helpText') > 4000
    or jsonb_typeof(p_configuration->'visible') <> 'boolean'
    or octet_length(p_configuration::text) > 262144 then
    raise exception 'Invalid field configuration';
  end if;
  if p_type is null or p_type not in ('text','richText','select') then
    raise exception 'Invalid field type';
  end if;
  if p_type = 'select' then
    if jsonb_typeof(p_configuration->'multiple') is distinct from 'boolean'
      or jsonb_typeof(p_configuration->'allowOther') is distinct from 'boolean' then
      raise exception 'Select fields require multiple and allowOther flags';
    end if;
  elsif p_configuration ?| array['multiple','allowOther'] then
    raise exception 'Only select fields may set multiple or allowOther';
  end if;
  linked := p_configuration ? 'targetCategoryId';
  if linked then
    if p_type <> 'select' then raise exception 'Only select fields may target a category'; end if;
    if jsonb_typeof(p_configuration->'targetCategoryId') <> 'string' then
      raise exception 'Reference fields require a target category';
    end if;
    perform (p_configuration->>'targetCategoryId')::uuid;
    if (p_configuration->>'allowOther')::boolean then
      raise exception 'Linked entry fields cannot allow other values';
    end if;
  end if;
  -- Suggestions are the options of a list select; other types have none.
  if jsonb_array_length(p_configuration->'suggestions') > 100
    or jsonb_array_length(p_configuration->'rules') > 64
    or ((p_type <> 'select' or linked) and p_configuration->'suggestions' <> '[]'::jsonb)
    or exists (select 1 from jsonb_array_elements(p_configuration->'suggestions') s
      where jsonb_typeof(s) <> 'string' or length(s #>> '{}') > 1000) then
    raise exception 'Invalid field suggestions or rule count';
  end if;
  if exists (select 1 from jsonb_array_elements_text(p_configuration->'suggestions') s where trim(s) = '')
    or (select count(distinct s) from jsonb_array_elements(p_configuration->'suggestions') s)
      <> jsonb_array_length(p_configuration->'suggestions') then
    raise exception 'Options must be unique and nonblank';
  end if;
  for r in select * from jsonb_array_elements(p_configuration->'rules') loop
    if jsonb_typeof(r) <> 'object' or not (r ? 'conditions')
      or r - array['conditions','visible','label','helpText','binding'] <> '{}'::jsonb
      or jsonb_typeof(r->'conditions') <> 'array'
      or (r ? 'visible' and jsonb_typeof(r->'visible') <> 'boolean')
      or (r ? 'label' and (jsonb_typeof(r->'label') <> 'string' or length(r->>'label') not between 1 and 200))
      or (r ? 'helpText' and (jsonb_typeof(r->'helpText') <> 'string' or length(r->>'helpText') > 4000)) then
      raise exception 'Invalid field rule';
    end if;
    if jsonb_array_length(r->'conditions') not between 1 and 16 then
      raise exception 'Rules require between 1 and 16 conditions';
    end if;
    perform public.world_configuration_validate_binding(r->'binding');
    if r ? 'binding' and r->'binding' <> 'null'::jsonb then
      if p_type = 'richText' then raise exception 'Rich text fields cannot use oracle bindings'; end if;
      if linked then raise exception 'Category reference fields cannot use oracle bindings'; end if;
    end if;
    for c in select * from jsonb_array_elements(r->'conditions') loop
      if jsonb_typeof(c) <> 'object' or not (c ?& array['source','fieldId','operator'])
        or c - array['source','fieldId','operator','value','ancestor'] <> '{}'::jsonb
        or coalesce(c->>'source','') not in ('entry','ancestor')
        or coalesce(c->>'operator','') not in ('equals','notEquals','contains','notContains','isEmpty','isNotEmpty')
        or jsonb_typeof(c->'fieldId') <> 'string'
        or (c ? 'value' and (jsonb_typeof(c->'value') <> 'string' or length(c->>'value') > 1000))
        or (c->>'operator' in ('equals','notEquals','contains','notContains') and not (c ? 'value')) then
        raise exception 'Invalid field condition';
      end if;
      perform (c->>'fieldId')::uuid;
      if c->>'source' = 'ancestor' then
        if not (c ? 'ancestor') or jsonb_typeof(c->'ancestor') <> 'object'
          or not ((c->'ancestor') ?& array['fieldId','value'])
          or (c->'ancestor') - array['fieldId','value'] <> '{}'::jsonb
          or jsonb_typeof(c->'ancestor'->'fieldId') <> 'string'
          or jsonb_typeof(c->'ancestor'->'value') <> 'string'
          or length(c->'ancestor'->>'value') > 1000 then
          raise exception 'Invalid ancestor selector';
        end if;
        perform (c->'ancestor'->>'fieldId')::uuid;
      elsif c ? 'ancestor' then
        raise exception 'Entry conditions cannot select an ancestor';
      end if;
    end loop;
  end loop;
end $$;

-- Sources: equals on text and single selects, contains on multi selects,
-- emptiness on text and every select. Rich text is never a source.
create or replace function public.world_configuration_validate_category_fields(p_category_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare d record; c jsonb; source_field public.world_field_definitions; multiple boolean;
begin
  for d in select * from public.world_field_definitions where category_id = p_category_id loop
    for c in select condition.value
      from jsonb_array_elements(d.configuration->'rules') rule,
        lateral jsonb_array_elements(rule->'conditions') condition loop
      select * into source_field from public.world_field_definitions
        where id = (c->>'fieldId')::uuid and category_id = p_category_id;
      if not found then raise exception 'Condition references a missing or foreign-category field'; end if;
      multiple := source_field.type = 'select' and (source_field.configuration->>'multiple')::boolean;
      if source_field.type not in ('text','select')
        or (c->>'operator' in ('equals','notEquals') and multiple)
        or (c->>'operator' in ('contains','notContains') and not multiple) then
        raise exception 'Condition source has an incompatible field type';
      end if;
      if source_field.configuration ? 'targetCategoryId'
        and c->>'operator' in ('equals','notEquals','contains','notContains')
        and (c->>'value') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
        raise exception 'Linked entry conditions must compare an entry ID';
      end if;
      if source_field.gm_only and not d.gm_only then
        raise exception 'A public field cannot depend on a GM-only field';
      end if;
      if c->>'source' = 'ancestor' then
        select * into source_field from public.world_field_definitions
          where id = (c->'ancestor'->>'fieldId')::uuid and category_id = p_category_id;
        if not found or source_field.type <> 'select' or (source_field.configuration->>'multiple')::boolean then
          raise exception 'Ancestor selector must reference a single select field in the same category';
        end if;
        if source_field.configuration ? 'targetCategoryId'
          and (c->'ancestor'->>'value') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
          raise exception 'Linked entry conditions must compare an entry ID';
        end if;
        if source_field.gm_only and not d.gm_only then
          raise exception 'A public field cannot depend on a GM-only ancestor selector';
        end if;
      end if;
    end loop;
  end loop;
end $$;

-- Populated fields may change only where stored values keep their meaning:
-- the same type and source, single list select to text, or text to a single
-- list select (strictness applies only to new choices). Multi/single changes
-- are rewritten after the update.
create or replace function public.world_configuration_guard_field() returns trigger
language plpgsql security definer set search_path = '' as $$
declare v_world_id uuid; rule_index integer; condition_index integer; condition_data jsonb;
  old_kind text; new_kind text; old_multiple boolean; new_multiple boolean;
begin
  select world_id into v_world_id from public.world_categories
    where id = case when tg_op = 'DELETE' then old.category_id else new.category_id end;
  perform 1 from public.worlds where id = v_world_id for update;
  if tg_op = 'DELETE' then
    if v_world_id is not null and exists (
      select 1 from public.world_field_definitions d,
        lateral jsonb_array_elements(d.configuration->'rules') r,
        lateral jsonb_array_elements(r->'conditions') c
      where d.category_id = old.category_id and d.id <> old.id
        and ((c->>'fieldId')::uuid = old.id or (c->'ancestor'->>'fieldId')::uuid = old.id)
    ) then raise exception 'Remove condition references before deleting this field'; end if;
    return old;
  end if;
  if tg_op = 'UPDATE' then
    if new.id <> old.id or new.category_id <> old.category_id or new.key <> old.key then
      raise exception 'Field identity, category and key cannot change';
    end if;
    if exists (select 1 from public.world_entry_field_values where field_definition_id = old.id) then
      old_kind := case when old.type <> 'select' then old.type
        when old.configuration ? 'targetCategoryId' then 'category' else 'list' end;
      new_kind := case when new.type <> 'select' then new.type
        when new.configuration ? 'targetCategoryId' then 'category' else 'list' end;
      old_multiple := coalesce((old.configuration->>'multiple')::boolean,false);
      new_multiple := coalesce((new.configuration->>'multiple')::boolean,false);
      if not (new_kind = old_kind
        or (old_kind = 'list' and not old_multiple and new_kind = 'text')
        or (old_kind = 'text' and new_kind = 'list' and not new_multiple)) then
        raise exception 'This type change cannot preserve existing values; create a new field';
      end if;
      if old_multiple and new.type = 'select' and not new_multiple and exists (
        select 1 from public.world_entry_field_values where field_definition_id = old.id
          and case jsonb_typeof(value) when 'array' then jsonb_array_length(value) > 1 else false end) then
        raise exception 'Entries store several values; create a new field';
      end if;
    end if;
  end if;
  if length(new.key) not between 1 and 200 or length(trim(new.label)) not between 1 and 200 then
    raise exception 'Invalid field key or label';
  end if;
  perform public.world_configuration_validate_binding(new.binding);
  perform public.world_configuration_validate_field(new.configuration, new.type);
  if new.binding is not null and new.binding <> 'null'::jsonb then
    if new.type = 'richText' then raise exception 'Rich text fields cannot use oracle bindings'; end if;
    if new.configuration ? 'targetCategoryId' then
      raise exception 'Category reference fields cannot use oracle bindings';
    end if;
  end if;
  -- PostgreSQL accepts equivalent UUID spellings, while the runtime indexes
  -- entry values by canonical UUID strings. Store references in that form too.
  for rule_index in 0..jsonb_array_length(new.configuration->'rules') - 1 loop
    for condition_index in 0..jsonb_array_length(new.configuration->'rules'->rule_index->'conditions') - 1 loop
      condition_data := new.configuration->'rules'->rule_index->'conditions'->condition_index;
      new.configuration := jsonb_set(new.configuration,
        array['rules',rule_index::text,'conditions',condition_index::text,'fieldId'],
        to_jsonb((condition_data->>'fieldId')::uuid::text));
      if condition_data->>'source' = 'ancestor' then
        new.configuration := jsonb_set(new.configuration,
          array['rules',rule_index::text,'conditions',condition_index::text,'ancestor','fieldId'],
          to_jsonb((condition_data->'ancestor'->>'fieldId')::uuid::text));
      end if;
    end loop;
  end loop;
  return new;
end $$;

-- Ordered before gm_only propagation so refreshed values already match the
-- new shape. Unwrapping drops empty arrays; the guard blocks several values.
create function public.world_configuration_convert_field_values() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if old.type <> 'select' or new.type <> 'select'
    or (old.configuration->>'multiple')::boolean = (new.configuration->>'multiple')::boolean then
    return null;
  end if;
  if (new.configuration->>'multiple')::boolean then
    update public.world_entry_field_values set value = jsonb_build_array(value)
      where field_definition_id = new.id and jsonb_typeof(value) = 'string';
  else
    delete from public.world_entry_field_values where field_definition_id = new.id
      and case jsonb_typeof(value) when 'array' then jsonb_array_length(value) = 0 else false end;
    update public.world_entry_field_values set value = value->0
      where field_definition_id = new.id and jsonb_typeof(value) = 'array';
  end if;
  return null;
end $$;
create trigger world_field_definitions_convert_values after update on public.world_field_definitions
  for each row execute function public.world_configuration_convert_field_values();

-- Values match their definition's storage. Strict lists check only newly
-- chosen items, so stored values survive option edits, including through an
-- upsert by a caller who can read the stored row. Linked entries recheck
-- readability whenever an update or upsert changes or sends the selection.
create or replace function public.world_entry_field_value_derive_parents() returns trigger
language plpgsql security definer set search_path = '' as $$
declare e public.world_entries; d jsonb; field_type text; multiple boolean; target_category uuid;
  items jsonb; previous_items jsonb := '[]'::jsonb; item jsonb; target_id uuid;
  selected_ids uuid[] := '{}'::uuid[]; role text; stored jsonb;
begin
  select * into e from public.world_entries where id = new.entry_id;
  if not found then raise exception 'Unknown world entry'; end if;
  perform 1 from public.worlds where id = e.world_id for update;
  select f into d from public.get_world_effective_categories(e.world_id) c,
    lateral jsonb_array_elements(c->'fields') f
    where (c->>'id')::uuid = e.category_id and (f->>'id')::uuid = new.field_definition_id;
  if not found then raise exception 'Entry and field definition must belong to the same category and world'; end if;
  new.world_id := e.world_id;
  new.gm_only := (d->>'gm_only')::boolean;

  field_type := d->>'type';
  if field_type = 'richText' then
    if new.value is not null and new.value <> 'null'::jsonb then
      raise exception 'Rich text values must be collaborative content';
    end if;
    return new;
  end if;
  if new.content is not null then
    raise exception 'Only rich text values can contain collaborative content';
  end if;
  if new.value is null or new.value = 'null'::jsonb then return new; end if;
  if field_type not in ('text','select') then raise exception 'Unknown world field type'; end if;
  multiple := field_type = 'select' and (d->'configuration'->>'multiple')::boolean;
  target_category := (d->'configuration'->>'targetCategoryId')::uuid;
  if not multiple then
    if jsonb_typeof(new.value) <> 'string' then
      raise exception 'Field value must be one string';
    end if;
    items := jsonb_build_array(new.value);
  else
    if jsonb_typeof(new.value) <> 'array' then
      raise exception 'Multiple selection must be an array of up to 100 strings';
    end if;
    if jsonb_array_length(new.value) > 100
      or exists (select 1 from jsonb_array_elements(new.value) i where jsonb_typeof(i) <> 'string') then
      raise exception 'Multiple selection must be an array of up to 100 strings';
    end if;
    items := new.value;
  end if;
  if field_type = 'text' then
    if length(new.value #>> '{}') > 1000 then raise exception 'Text values are limited to 1000 characters'; end if;
    return new;
  end if;

  role := public.world_role(e.world_id, auth.uid());
  if tg_op = 'UPDATE' then
    if new.entry_id = old.entry_id and new.field_definition_id = old.field_definition_id then
      stored := old.value;
    end if;
  elsif target_category is null and (not new.gm_only or role in ('owner','editor','guide'))
    and public.world_configuration_reference_target_readable(e.world_id, e.category_id, e.id, auth.uid(), role) then
    -- Inserts run before conflict resolution and RLS; consult the stored row
    -- only when its value is already readable, so checks reveal nothing.
    select v.value into stored from public.world_entry_field_values v
      where v.entry_id = new.entry_id and v.field_definition_id = new.field_definition_id;
  end if;
  previous_items := case jsonb_typeof(stored) when 'array' then stored
    when 'string' then jsonb_build_array(stored) else '[]'::jsonb end;

  if target_category is null then
    if exists (select 1 from jsonb_array_elements(items) i where length(i #>> '{}') > 1000)
      or (select count(distinct i) from jsonb_array_elements(items) i) <> jsonb_array_length(items) then
      raise exception 'Selections must be unique strings of up to 1000 characters';
    end if;
    if not (d->'configuration'->>'allowOther')::boolean and exists (
      select 1 from jsonb_array_elements(items) i
      where not previous_items @> jsonb_build_array(i)
        and not d->'configuration'->'suggestions' @> jsonb_build_array(i)) then
      raise exception 'Value must be one of the field options';
    end if;
    return new;
  end if;

  for item in select value from jsonb_array_elements(items) value loop
    target_id := (item #>> '{}')::uuid;
    if target_id = any(selected_ids) then
      raise exception 'Category multi-selection cannot contain duplicate entries';
    end if;
    selected_ids := array_append(selected_ids, target_id);
  end loop;
  select coalesce(jsonb_agg(to_jsonb(id::text) order by ordinal), '[]'::jsonb)
    into items from unnest(selected_ids) with ordinality as chosen(id,ordinal);
  foreach target_id in array selected_ids loop
    -- Metadata refreshes, first customization and multi/single rewrites do
    -- not choose a new target. Retain those references even when the actor is
    -- another author or a migration with no JWT. Reads still enforce RLS.
    if not exists (select 1 from public.world_entries
      where id = target_id and world_id = e.world_id and category_id = target_category)
      or (items is distinct from previous_items and not public.world_configuration_reference_target_readable(
        e.world_id, target_category, target_id, auth.uid(), role)) then
      raise exception 'Selected entry is unavailable in the target category';
    end if;
  end loop;
  new.value := case when multiple then items else items->0 end;
  return new;
end $$;

create or replace function public.world_configuration_guard_reference_field_before() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.type = 'select' and new.configuration ? 'targetCategoryId' then
    new.configuration := jsonb_set(new.configuration, '{targetCategoryId}',
      to_jsonb((new.configuration->>'targetCategoryId')::uuid::text));
  end if;
  if tg_op = 'UPDATE'
    and (new.configuration->>'targetCategoryId') is distinct from
        (old.configuration->>'targetCategoryId')
    and exists (select 1 from public.world_entry_field_values
      where field_definition_id = old.id) then
    raise exception 'Remove field values before changing the target category';
  end if;
  return new;
end $$;

create or replace function public.world_configuration_validate_reference_field_after() returns trigger
language plpgsql security definer set search_path = '' as $$
declare d public.world_field_definitions; target_id uuid;
begin
  -- An insert followed by a delete in one transaction leaves no definition.
  select * into d from public.world_field_definitions where id = new.id;
  if not found or d.type <> 'select' or not (d.configuration ? 'targetCategoryId') then
    return null;
  end if;
  if d.binding is not null and d.binding <> 'null'::jsonb
    or exists (select 1 from jsonb_array_elements(d.configuration->'rules') r
      where r ? 'binding' and r->'binding' <> 'null'::jsonb) then
    raise exception 'Category reference fields cannot use oracle bindings';
  end if;
  target_id := (d.configuration->>'targetCategoryId')::uuid;
  if not exists (select 1 from public.get_world_effective_categories(d.world_id) c
    where (c->>'id')::uuid = target_id) then
    raise exception 'Target category must belong to the same world';
  end if;
  return null;
end $$;

create or replace function public.world_configuration_guard_referenced_category_delete() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  -- Whole-world deletion cascades categories and their fields together.
  if exists (select 1 from public.worlds where id = old.world_id)
    and exists (
      select 1 from public.world_field_definitions d
      where d.world_id = old.world_id and d.category_id <> old.id
        and d.type = 'select' and (d.configuration->>'targetCategoryId')::uuid = old.id
    ) then
    raise exception 'Remove fields targeting this category before deleting it';
  end if;
  return old;
end $$;

create or replace function public.world_configuration_guard_referenced_entry_delete() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  perform 1 from public.worlds where id = old.world_id for update;
  if not found then return old; end if;
  if exists (
    with fields as (
      select (f->>'id')::uuid id from public.get_world_effective_categories(old.world_id) c,
        lateral jsonb_array_elements(c->'fields') f
      where f->>'type' = 'select'
        and (f->'configuration'->>'targetCategoryId')::uuid = old.category_id
    )
    select 1 from public.world_entry_field_values v join fields on fields.id = v.field_definition_id
      where v.world_id = old.world_id and v.entry_id <> old.id
        and (v.value = to_jsonb(old.id::text)
          or (jsonb_typeof(v.value) = 'array'
            and v.value @> jsonb_build_array(old.id::text)))
  ) then
    raise exception 'Remove category-field references before deleting this entry';
  end if;
  return old;
end $$;

-- Readability follows the stored shape, so values hide fail-closed even while
-- a multi/single change rewrites them in the same transaction.
create or replace function public.world_configuration_reference_value_readable(
  p_world_id uuid, p_field_definition_id uuid, p_value jsonb
) returns boolean
language plpgsql stable security definer set search_path = '' as $$
declare d jsonb; target_id uuid; item jsonb;
  role text := public.world_role(p_world_id, auth.uid());
begin
  if auth.uid() is null then return false; end if;
  select f into d from public.get_world_effective_categories(p_world_id) c,
    lateral jsonb_array_elements(c->'fields') f
    where (f->>'id')::uuid = p_field_definition_id;
  if not found then return false; end if;
  if d->>'type' <> 'select' or not (d->'configuration' ? 'targetCategoryId')
    or p_value is null or p_value = 'null'::jsonb then return true; end if;
  if jsonb_typeof(p_value) not in ('string','array') then return false; end if;
  for item in select value from jsonb_array_elements(
    case jsonb_typeof(p_value) when 'array' then p_value else jsonb_build_array(p_value) end) value loop
    if jsonb_typeof(item) <> 'string' then return false; end if;
    begin
      target_id := (item #>> '{}')::uuid;
    exception when invalid_text_representation then return false;
    end;
    if not public.world_configuration_reference_target_readable(
      p_world_id, (d->'configuration'->>'targetCategoryId')::uuid, target_id, auth.uid(), role
    ) then return false; end if;
  end loop;
  return true;
end $$;

-- multiValueCounts explains why a field cannot stop allowing several values.
create or replace function public.get_world_category_counts(p_world_id uuid, p_category_id uuid) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare c jsonb;
begin
  if auth.uid() is null or coalesce(public.world_role(p_world_id,auth.uid()),'') not in ('owner','editor','guide') then
    raise exception 'Only world editors can count category content' using errcode = '42501';
  end if;
  select value into c from public.get_world_effective_categories(p_world_id) value where (value->>'id')::uuid = p_category_id;
  if not found then raise exception 'Unknown world category'; end if;
  return jsonb_build_object('entryCount', (select count(*) from public.world_entries where world_id = p_world_id and category_id = p_category_id),
    'valueCounts', coalesce((select jsonb_object_agg(f->>'id', (select count(*) from public.world_entry_field_values v
      where v.world_id = p_world_id and v.field_definition_id = (f->>'id')::uuid)) from jsonb_array_elements(c->'fields') f), '{}'::jsonb),
    'multiValueCounts', coalesce((select jsonb_object_agg(f->>'id', (select count(*) from public.world_entry_field_values v
      where v.world_id = p_world_id and v.field_definition_id = (f->>'id')::uuid
        and case jsonb_typeof(v.value) when 'array' then jsonb_array_length(v.value) > 1 else false end)) from jsonb_array_elements(c->'fields') f), '{}'::jsonb));
end $$;

-- Convert customized definitions in one statement so dependency validation
-- sees each category after conversion. The guard's type-change check only
-- knows the new types; every row is revalidated through it below. Deferred
-- reference checks run per statement so later table changes are permitted.
set constraints world_field_definitions_configuration_reference_after immediate;
alter table public.world_field_definitions disable trigger world_field_definitions_configuration_guard;
update public.world_field_definitions d set type = x.converted->>'type',
    binding = nullif(x.converted->'binding','null'::jsonb), configuration = x.converted->'configuration'
  from (select f.id, public.world_configuration_convert_legacy_field(to_jsonb(f), (
      select jsonb_agg(to_jsonb(s)) from public.world_field_definitions s where s.category_id = f.category_id
    )) converted from public.world_field_definitions f) x
  where x.id = d.id and to_jsonb(d) is distinct from x.converted;
alter table public.world_field_definitions enable trigger world_field_definitions_configuration_guard;
update public.world_field_definitions set configuration = configuration;

-- Shared defaults use the same mapping. The template trigger revalidates
-- inherited values against the converted definitions.
update public.world_templates t set configuration = jsonb_set(t.configuration,'{categories}',coalesce((
  select jsonb_agg(jsonb_set(c.value,'{fields}',coalesce((
    select jsonb_agg(public.world_configuration_convert_legacy_field(f.value,c.value->'fields') order by f.position)
    from jsonb_array_elements(c.value->'fields') with ordinality f(value,position)
  ),'[]'::jsonb)) order by c.position)
  from jsonb_array_elements(t.configuration->'categories') with ordinality c(value,position)
),'[]'::jsonb));

-- Revalidate every stored value against its converted definition.
update public.world_entry_field_values set gm_only = gm_only;

alter table public.world_field_definitions add constraint world_field_definitions_type_check
  check (type in ('text','richText','select'));

-- Options for text and list selects: configured suggestions in order, then
-- other values stored in the field. Runs as the caller, so value RLS hides
-- Guide-only fields and unreadable entries. It never writes configuration.
create function public.get_world_field_options(p_world_id uuid, p_field_id uuid) returns text[]
language plpgsql stable security invoker set search_path = '' as $$
declare f jsonb;
begin
  -- Authorizes membership and resolves inherited definitions.
  select value into f from jsonb_array_elements(public.get_world_configuration(p_world_id)->'field_definitions') value
    where (value->>'id')::uuid = p_field_id;
  if not found then raise exception 'Unknown world field definition'; end if;
  if f->>'type' not in ('text','select') or f->'configuration' ? 'targetCategoryId' then
    raise exception 'Only text and option list fields have options';
  end if;
  if (f->>'gm_only')::boolean
    and public.world_role(p_world_id, auth.uid()) not in ('owner','editor','guide') then
    return '{}'::text[];
  end if;
  return array(
    select o.value from (
      select s.value, min(s.position) as position
        from jsonb_array_elements_text(f->'configuration'->'suggestions') with ordinality s(value,position)
        group by s.value
      union all
      select distinct item.value, null::bigint
        from public.world_entry_field_values v,
          lateral jsonb_array_elements_text(case jsonb_typeof(v.value) when 'array' then v.value
            when 'string' then jsonb_build_array(v.value) else '[]'::jsonb end) item(value)
        where v.world_id = p_world_id and v.field_definition_id = p_field_id
          and length(trim(item.value)) > 0
          and not f->'configuration'->'suggestions' @> jsonb_build_array(item.value)
    ) o order by o.position nulls last, o.value);
end $$;

revoke all on function public.world_configuration_assert_no_oracle_text_values(),
  public.world_configuration_convert_legacy_field(jsonb,jsonb),
  public.world_configuration_convert_field_values() from public,anon,authenticated;
revoke all on function public.get_world_field_options(uuid,uuid) from public,anon;
grant execute on function public.get_world_field_options(uuid,uuid) to authenticated,service_role;
commit;
