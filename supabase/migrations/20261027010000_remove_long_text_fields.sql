-- Long text fields are gone (#257): Notes is the only rich text on an entry.
-- No stored values are kept; built-in templates never had a Long text field,
-- so only custom fields of customized worlds are removed. Field types are now
-- text and select, and values no longer carry collaborative content.
begin;

-- The built-in templates are not edited here; refuse rather than guess.
do $$
begin
  if exists (select 1 from public.world_templates t,
      lateral jsonb_array_elements(t.configuration->'categories') c,
      lateral jsonb_array_elements(c->'fields') f
    where f->>'type' = 'richText') then
    raise exception 'A world template still has a Long text field';
  end if;
end $$;

-- Values go with their definitions (world_field_definitions_delete_values).
-- The field guard refuses if another field's rule still names one. Deferred
-- reference checks run now so the table can be altered below.
set constraints world_field_definitions_configuration_reference_after immediate;
delete from public.world_field_definitions where type = 'richText';
delete from public.world_entry_field_values where content is not null;

alter table public.world_field_definitions drop constraint world_field_definitions_type_check;
alter table public.world_field_definitions add constraint world_field_definitions_type_check
  check (type in ('text','select'));

create or replace function public.world_configuration_validate_field(p_configuration jsonb, p_type text) returns void
language plpgsql set search_path = '' as $$
declare r jsonb; c jsonb; linked boolean;
begin
  if p_configuration is null or jsonb_typeof(p_configuration) <> 'object'
    or not (p_configuration ?& array['version','suggestions','helpText','visible','rules'])
    or p_configuration - array['version','suggestions','helpText','visible','rules','targetCategoryId',
      'multiple','allowOther','fullWidth'] <> '{}'::jsonb
    or p_configuration->'version' <> '1'::jsonb
    or jsonb_typeof(p_configuration->'suggestions') <> 'array'
    or jsonb_typeof(p_configuration->'rules') <> 'array'
    or jsonb_typeof(p_configuration->'helpText') <> 'string'
    or length(p_configuration->>'helpText') > 4000
    or jsonb_typeof(p_configuration->'visible') <> 'boolean'
    or octet_length(p_configuration::text) > 262144 then
    raise exception 'Invalid field configuration';
  end if;
  if p_type is null or p_type not in ('text','select') then
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
  if p_configuration ? 'fullWidth' and (p_type <> 'text'
    or jsonb_typeof(p_configuration->'fullWidth') <> 'boolean') then
    raise exception 'Only text fields may set fullWidth';
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

-- Rich text no longer exists, so it needs no binding check.
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

-- Values are plain JSON; there is no rich text branch or content to check.
create or replace function public.world_entry_field_value_derive_parents() returns trigger
language plpgsql security definer set search_path = '' as $$
declare e public.world_entries; d jsonb; field_type text; multiple boolean; target_category uuid;
  items jsonb; previous_items jsonb := '[]'::jsonb; item jsonb; target_id uuid;
  selected_ids uuid[] := '{}'::uuid[]; role text; stored jsonb;
begin
  select * into e from public.world_entries where id = new.entry_id;
  if not found then raise exception 'Unknown world entry'; end if;
  perform 1 from public.worlds where id = e.world_id for share;
  select f into d from public.get_world_effective_categories(e.world_id) c,
    lateral jsonb_array_elements(c->'fields') f
    where (c->>'id')::uuid = e.category_id and (f->>'id')::uuid = new.field_definition_id;
  if not found then raise exception 'Entry and field definition must belong to the same category and world'; end if;
  new.world_id := e.world_id;
  new.gm_only := (d->>'gm_only')::boolean;

  field_type := d->>'type';
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
    -- Stored links are always canonical UUID text, as written below.
    continue when previous_items @> jsonb_build_array(target_id::text);
    -- Hold the target until commit: a concurrent delete of it either commits
    -- first, so it is not found here, or waits and then removes this link.
    perform 1 from public.world_entries
      where id = target_id and world_id = e.world_id and category_id = target_category
      for key share;
    if not found
      or not public.world_configuration_reference_target_readable(
        e.world_id, target_category, target_id, auth.uid(), role) then
      raise exception 'Selected entry is unavailable in the target category';
    end if;
  end loop;
  new.value := case when multiple then items else items->0 end;
  return new;
end $$;

alter table public.world_entry_field_values drop column content;

commit;
