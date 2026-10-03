-- World configuration: validated fields, inherited database defaults and an
-- atomic first-edit fork. Existing stored configurations retain their identities
-- and values; new/empty worlds inherit the catalog installed next.
begin;
-- Shared release defaults are readable only through authorized configuration RPCs.
-- Migrations maintain these rows; clients cannot write or inspect the raw catalog.
create table public.world_templates (
  setting_key text primary key,
  configuration jsonb not null,
  constraint world_templates_configuration_shape check (
    jsonb_typeof(configuration) = 'object'
    and configuration ?& array['version','categories']
    and configuration - array['version','categories'] = '{}'::jsonb
    and configuration->'version' = '1'::jsonb
    and jsonb_typeof(configuration->'categories') = 'array'
  )
);
alter table public.world_templates enable row level security;
revoke all on public.world_templates from public, anon, authenticated;

-- Keep category and field identities scoped to the world while all untouched
-- worlds resolve the same shared setting template. Preserve UUID namespaces.
create function public.get_world_template(p_world_id uuid, p_setting_key text) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  template jsonb; category jsonb; field jsonb; rewritten text; category_key text;
begin
  select configuration into template from public.world_templates where setting_key = p_setting_key;
  if not found then
    select configuration into template from public.world_templates where setting_key = 'blank';
  end if;
  if template is null then raise exception 'Missing default world template'; end if;
  if exists (select 1 from jsonb_array_elements(template->'categories') c
    where jsonb_typeof(c->'key') is distinct from 'string' or length(trim(c->>'key')) not between 1 and 200)
    or jsonb_array_length(template->'categories') <> (
      select count(distinct c->>'key') from jsonb_array_elements(template->'categories') c) then
    raise exception 'Template category keys must be unique nonempty strings';
  end if;
  rewritten := template::text;
  for category in select value from jsonb_array_elements(template->'categories') loop
    category_key := category->>'key';
    rewritten := replace(rewritten, category->>'id', extensions.uuid_generate_v5(p_world_id,'category:' || category_key)::text);
    for field in select value from jsonb_array_elements(category->'fields') loop
      rewritten := replace(rewritten, field->>'id', extensions.uuid_generate_v5(p_world_id,'field:' || category_key || ':' || (field->>'key'))::text);
    end loop;
  end loop;
  -- Template-only keys control identity and do not enter world category rows.
  return jsonb_set(rewritten::jsonb,'{categories}',coalesce((
    select jsonb_agg(c.value - 'key' order by c.position)
    from jsonb_array_elements(rewritten::jsonb->'categories') with ordinality c(value,position)
  ),'[]'::jsonb));
end $$;
revoke all on function public.get_world_template(uuid,text) from public, anon, authenticated;

alter table public.world_field_definitions add column configuration jsonb not null
  default '{"version":1,"suggestions":[],"helpText":"","visible":true,"rules":[]}'::jsonb;

-- A durable receipt distinguishes legacy empty worlds from a user's deliberate
-- deletion of every category. Clients cannot clear receipts to reapply defaults.
create table public.world_template_receipts (
  world_id uuid primary key references public.worlds(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.world_template_receipts enable row level security;
revoke all on public.world_template_receipts from public, anon, authenticated;
insert into public.world_template_receipts (world_id)
  select distinct world_id from public.world_categories;

-- Defaults are shared template rows, not per-world configuration records.
-- Only an explicit configuration mutation materializes them. Values retain UUIDs.
alter table public.worlds add column configuration_customized boolean not null default false;
update public.worlds w set configuration_customized = exists (
  select 1 from public.world_template_receipts r where r.world_id = w.id
) or exists (select 1 from public.world_categories c where c.world_id = w.id);

create function public.world_configuration_validate_binding(p_binding jsonb) returns void
language plpgsql set search_path = '' as $$
begin
  if p_binding is null or p_binding = 'null'::jsonb then return; end if;
  if jsonb_typeof(p_binding) <> 'object'
    or not (p_binding ?& array['packageId','oracleId','resolvedOracleId'])
    or p_binding - array['packageId','oracleId','resolvedOracleId','exact'] <> '{}'::jsonb
    or exists (select 1 from jsonb_each(p_binding) v where v.key <> 'exact'
      and (jsonb_typeof(v.value) <> 'string' or length(v.value #>> '{}') not between 1 and 1024))
    or (p_binding ? 'exact' and jsonb_typeof(p_binding->'exact') <> 'boolean') then
    raise exception 'Invalid oracle binding';
  end if;
end $$;

create or replace function public.world_configuration_validate_field(p_configuration jsonb, p_type text) returns void
language plpgsql set search_path = '' as $$
declare r jsonb; c jsonb;
begin
  if p_configuration is null or jsonb_typeof(p_configuration) <> 'object'
    or not (p_configuration ?& array['version','suggestions','helpText','visible','rules'])
    or p_configuration - array['version','suggestions','helpText','visible','rules','targetCategoryId'] <> '{}'::jsonb
    or p_configuration->'version' <> '1'::jsonb
    or jsonb_typeof(p_configuration->'suggestions') <> 'array'
    or jsonb_typeof(p_configuration->'rules') <> 'array'
    or jsonb_typeof(p_configuration->'helpText') <> 'string'
    or length(p_configuration->>'helpText') > 4000
    or jsonb_typeof(p_configuration->'visible') <> 'boolean'
    or octet_length(p_configuration::text) > 262144 then
    raise exception 'Invalid field configuration';
  end if;
  if p_type in ('categorySelect','categoryMultiSelect') then
    if not (p_configuration ? 'targetCategoryId')
      or jsonb_typeof(p_configuration->'targetCategoryId') <> 'string' then
      raise exception 'Reference fields require a target category';
    end if;
    perform (p_configuration->>'targetCategoryId')::uuid;
  elsif p_configuration ? 'targetCategoryId' then
    raise exception 'Only reference fields may target a category';
  end if;
  if jsonb_array_length(p_configuration->'suggestions') > 100
    or jsonb_array_length(p_configuration->'rules') > 64
    or (p_type <> 'text' and p_configuration->'suggestions' <> '[]'::jsonb)
    or exists (select 1 from jsonb_array_elements(p_configuration->'suggestions') s
      where jsonb_typeof(s) <> 'string' or length(s #>> '{}') > 1000) then
    raise exception 'Invalid field suggestions or rule count';
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
    for c in select * from jsonb_array_elements(r->'conditions') loop
      if jsonb_typeof(c) <> 'object' or not (c ?& array['source','fieldId','operator'])
        or c - array['source','fieldId','operator','value','ancestor'] <> '{}'::jsonb
        or coalesce(c->>'source','') not in ('entry','ancestor')
        or coalesce(c->>'operator','') not in ('equals','notEquals','isEmpty','isNotEmpty')
        or jsonb_typeof(c->'fieldId') <> 'string'
        or (c ? 'value' and (jsonb_typeof(c->'value') <> 'string' or length(c->>'value') > 1000))
        or (c->>'operator' in ('equals','notEquals') and not (c ? 'value')) then
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

-- Validate the complete category after edits, so edits to a source's type or
-- GM visibility also validate every dependent field, not just the edited row.
create function public.world_configuration_validate_category_fields(p_category_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare d record; c jsonb; source_field public.world_field_definitions;
begin
  for d in select * from public.world_field_definitions where category_id = p_category_id loop
    for c in select condition.value
      from jsonb_array_elements(d.configuration->'rules') rule,
        lateral jsonb_array_elements(rule->'conditions') condition loop
      select * into source_field from public.world_field_definitions
        where id = (c->>'fieldId')::uuid and category_id = p_category_id;
      if not found then raise exception 'Condition references a missing or foreign-category field'; end if;
      if source_field.type not in ('text','tags','number')
        or (c->>'operator' in ('equals','notEquals') and source_field.type <> 'text') then
        raise exception 'Condition source has an incompatible field type';
      end if;
      if source_field.gm_only and not d.gm_only then
        raise exception 'A public field cannot depend on a GM-only field';
      end if;
      if c->>'source' = 'ancestor' then
        select * into source_field from public.world_field_definitions
          where id = (c->'ancestor'->>'fieldId')::uuid and category_id = p_category_id;
        if not found or source_field.type <> 'text' then
          raise exception 'Ancestor selector must reference a text field in the same category';
        end if;
        if source_field.gm_only and not d.gm_only then
          raise exception 'A public field cannot depend on a GM-only ancestor selector';
        end if;
      end if;
    end loop;
  end loop;
end $$;

create function public.world_configuration_guard_category() returns trigger
language plpgsql security definer set search_path = '' as $$
declare v_world_id uuid;
begin
  v_world_id := case when tg_op = 'DELETE' then old.world_id else new.world_id end;
  perform 1 from public.worlds where id = v_world_id for update;
  if tg_op = 'DELETE' then
    -- Whole-world deletion has its own storage cleanup workflow.
    if found and exists (select 1 from public.world_entries where category_id = old.id) then
      raise exception 'Delete category entries and their stored files before deleting the category';
    end if;
    return old;
  end if;
  if tg_op = 'UPDATE' and (new.id <> old.id or new.world_id <> old.world_id) then
    raise exception 'Category identity and world cannot change';
  end if;
  if length(trim(new.name)) not between 1 and 200 then raise exception 'Invalid category name'; end if;
  insert into public.world_template_receipts (world_id) values (new.world_id) on conflict do nothing;
  if new.subtitle_field_definition_id is not null and not exists (
    select 1 from public.world_field_definitions
    where id = new.subtitle_field_definition_id and category_id = new.id and world_id = new.world_id
  ) then raise exception 'Subtitle field must belong to this category'; end if;
  return new;
end $$;
create trigger world_categories_configuration_guard before insert or update or delete on public.world_categories
  for each row execute function public.world_configuration_guard_category();

create function public.world_configuration_guard_field() returns trigger
language plpgsql security definer set search_path = '' as $$
declare v_world_id uuid; rule_index integer; condition_index integer; condition_data jsonb;
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
    if new.type <> old.type and not (new.type in ('richText','oracleText') and old.type in ('richText','oracleText'))
      and exists (select 1 from public.world_entry_field_values where field_definition_id = old.id) then
      raise exception 'This type change cannot preserve existing values; create a new field';
    end if;
  end if;
  if length(new.key) not between 1 and 200 or length(trim(new.label)) not between 1 and 200 then
    raise exception 'Invalid field key or label';
  end if;
  perform public.world_configuration_validate_binding(new.binding);
  perform public.world_configuration_validate_field(new.configuration, new.type);
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
create trigger world_field_definitions_configuration_guard before insert or update or delete on public.world_field_definitions
  for each row execute function public.world_configuration_guard_field();

create function public.world_configuration_check_field_dependencies() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  perform public.world_configuration_validate_category_fields(new.category_id);
  return new;
end $$;
create trigger world_field_definitions_configuration_dependencies after insert or update on public.world_field_definitions
  for each row execute function public.world_configuration_check_field_dependencies();

create or replace function public.world_entry_field_value_derive_parents() returns trigger
language plpgsql security definer set search_path = '' as $$
declare e public.world_entries; d jsonb;
  target_id uuid; selected_ids uuid[] := '{}'::uuid[]; item jsonb; role text;
  reference_changed boolean := true;
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

  if d->>'type' not in ('categorySelect','categoryMultiSelect') then return new; end if;
  if new.content is not null then
    raise exception 'Category reference values cannot contain rich text';
  end if;
  if new.value is null or new.value = 'null'::jsonb then return new; end if;
  if d->>'type' = 'categorySelect' then
    if jsonb_typeof(new.value) <> 'string' then
      raise exception 'Category selection must be one entry ID';
    end if;
    selected_ids := array[(new.value #>> '{}')::uuid];
  else
    if jsonb_typeof(new.value) <> 'array'
      or jsonb_array_length(new.value) > 100 then
      raise exception 'Category multi-selection must be an array of up to 100 entry IDs';
    end if;
    for item in select value from jsonb_array_elements(new.value) value loop
      if jsonb_typeof(item) <> 'string' then
        raise exception 'Category multi-selection must contain entry IDs';
      end if;
      target_id := (item #>> '{}')::uuid;
      if target_id = any(selected_ids) then
        raise exception 'Category multi-selection cannot contain duplicate entries';
      end if;
      selected_ids := array_append(selected_ids, target_id);
    end loop;
  end if;

  role := public.world_role(e.world_id, auth.uid());
  if tg_op = 'UPDATE' then
    reference_changed := new.entry_id is distinct from old.entry_id
      or new.field_definition_id is distinct from old.field_definition_id
      or new.value is distinct from old.value;
  end if;
  foreach target_id in array selected_ids loop
    -- Metadata refreshes during first customization and catalog releases do
    -- not choose a new target. Retain those references even when the actor is
    -- another author or a migration with no JWT. Reads still enforce RLS.
    if not exists (select 1 from public.world_entries
      where id = target_id and world_id = e.world_id
        and category_id = (d->'configuration'->>'targetCategoryId')::uuid)
      or (reference_changed and not public.world_configuration_reference_target_readable(
        e.world_id, (d->'configuration'->>'targetCategoryId')::uuid,
        target_id, auth.uid(), role
      )) then
      raise exception 'Selected entry is unavailable in the target category';
    end if;
  end loop;
  if d->>'type' = 'categorySelect' then
    new.value := to_jsonb(selected_ids[1]::text);
  else
    select coalesce(jsonb_agg(to_jsonb(id::text) order by ordinal), '[]'::jsonb)
      into new.value from unnest(selected_ids) with ordinality as chosen(id,ordinal);
  end if;
  return new;
end $$;

-- Moving existing entries would invalidate their field values. Parent hierarchy
-- validation remains an entry-editing concern; category membership itself is immutable.
create or replace function public.world_entry_check_category_world() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  perform 1 from public.worlds where id = new.world_id for update;
  if tg_op = 'UPDATE' and (new.id <> old.id or new.world_id <> old.world_id or new.category_id <> old.category_id) then
    raise exception 'Entry identity, world and category cannot change';
  end if;
  if not exists (select 1 from public.get_world_effective_categories(new.world_id) c where (c->>'id')::uuid = new.category_id) then
    raise exception 'Entry category must belong to its world';
  end if;
  return new;
end $$;

create or replace function public.seed_world_template(p_world_id uuid, p_template jsonb) returns boolean
language plpgsql security definer set search_path = '' as $$
declare c jsonb; f jsonb; total_fields integer := 0;
begin
  if auth.uid() is null or public.world_role(p_world_id, auth.uid()) not in ('owner','editor','guide') then
    raise exception 'Only world editors can seed a template' using errcode = '42501';
  end if;
  perform 1 from public.worlds where id = p_world_id for update;
  if not found then raise exception 'Unknown world'; end if;
  if exists (select 1 from public.world_template_receipts where world_id = p_world_id)
    or exists (select 1 from public.world_categories where world_id = p_world_id) then return false; end if;
  if p_template is null or jsonb_typeof(p_template) <> 'object'
    or not (p_template ?& array['version','categories'])
    or p_template - array['version','categories'] <> '{}'::jsonb
    or p_template->'version' <> '1'::jsonb
    or jsonb_typeof(p_template->'categories') <> 'array'
    or octet_length(p_template::text) > 1048576 then raise exception 'Invalid world template'; end if;
  if jsonb_array_length(p_template->'categories') not between 1 and 30 then
    raise exception 'Templates require between 1 and 30 categories';
  end if;
  for c in select * from jsonb_array_elements(p_template->'categories') loop
    if jsonb_typeof(c) <> 'object'
      or not (c ?& array['id','name','icon','sort_order','supports_hierarchy','supports_map','supports_bonds','subtitle_field_definition_id','fields'])
      or c - array['id','name','icon','sort_order','supports_hierarchy','supports_map','supports_bonds','subtitle_field_definition_id','fields'] <> '{}'::jsonb
      or jsonb_typeof(c->'id') <> 'string' or jsonb_typeof(c->'name') <> 'string'
      or jsonb_typeof(c->'sort_order') <> 'number'
      or jsonb_typeof(c->'supports_hierarchy') <> 'boolean'
      or jsonb_typeof(c->'supports_map') <> 'boolean'
      or jsonb_typeof(c->'supports_bonds') <> 'boolean'
      or jsonb_typeof(c->'subtitle_field_definition_id') not in ('string','null')
      or jsonb_typeof(c->'fields') <> 'array'
      or jsonb_typeof(c->'icon') not in ('object','null') then raise exception 'Invalid template category'; end if;
    if jsonb_array_length(c->'fields') > 100 then raise exception 'Too many category fields'; end if;
    total_fields := total_fields + jsonb_array_length(c->'fields');
    if total_fields > 500 then raise exception 'Too many template fields'; end if;
    insert into public.world_categories (id, world_id, name, icon, sort_order, supports_hierarchy, supports_map, supports_bonds)
      values ((c->>'id')::uuid, p_world_id, c->>'name', nullif(c->'icon','null'::jsonb),
        (c->>'sort_order')::integer, (c->>'supports_hierarchy')::boolean,
        (c->>'supports_map')::boolean, (c->>'supports_bonds')::boolean);
    -- Install identities before conditions, allowing forward references without
    -- deferring validation on ordinary edits or trusting a client bypass flag.
    for f in select * from jsonb_array_elements(c->'fields') loop
      if jsonb_typeof(f) <> 'object'
        or not (f ?& array['id','key','label','type','binding','configuration','gm_only','sort_order'])
        or f - array['id','key','label','type','binding','configuration','gm_only','sort_order'] <> '{}'::jsonb
        or jsonb_typeof(f->'id') <> 'string' or jsonb_typeof(f->'key') <> 'string'
        or jsonb_typeof(f->'label') <> 'string' or jsonb_typeof(f->'type') <> 'string'
        or jsonb_typeof(f->'gm_only') <> 'boolean' or jsonb_typeof(f->'sort_order') <> 'number' then
        raise exception 'Invalid template field';
      end if;
      perform public.world_configuration_validate_field(f->'configuration', f->>'type');
      insert into public.world_field_definitions (id, world_id, category_id, key, label, type, binding, gm_only, sort_order, configuration)
        values ((f->>'id')::uuid, p_world_id, (c->>'id')::uuid, f->>'key', f->>'label', f->>'type',
          nullif(f->'binding','null'::jsonb), (f->>'gm_only')::boolean, (f->>'sort_order')::integer,
          jsonb_set(f->'configuration','{rules}','[]'::jsonb));
    end loop;
    for f in select * from jsonb_array_elements(c->'fields') loop
      update public.world_field_definitions set configuration = f->'configuration' where id = (f->>'id')::uuid;
    end loop;
    update public.world_categories set subtitle_field_definition_id = (c->>'subtitle_field_definition_id')::uuid
      where id = (c->>'id')::uuid;
  end loop;
  return true;
end $$;

-- World members need the union even when they do not belong to every linked
-- game. Expose only rules configuration; never game names, IDs or other data.
create function public.get_world_playsets(p_world_id uuid) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  if auth.uid() is null or public.world_role(p_world_id, auth.uid()) = 'none' then
    raise exception 'Only world members can read linked playsets' using errcode = '42501';
  end if;
  return (select coalesce(jsonb_agg(jsonb_build_object('rulesets', rulesets,
    'expansions', expansions, 'playset', playset) order by id), '[]'::jsonb)
    from public.games where world_id = p_world_id);
end $$;

create function public.world_configuration_invalidate_world_playsets() returns trigger
language plpgsql security definer set search_path = '' as $$
declare old_world uuid; new_world uuid;
begin
  if tg_op <> 'INSERT' then old_world := old.world_id; end if;
  if tg_op <> 'DELETE' then new_world := new.world_id; end if;
  if tg_op = 'UPDATE' and new.world_id is not distinct from old.world_id
    and new.rulesets is not distinct from old.rulesets
    and new.expansions is not distinct from old.expansions
    and new.playset is not distinct from old.playset then return new; end if;
  -- Stable ordering avoids opposite-direction link changes deadlocking.
  perform 1 from public.worlds where id in (old_world, new_world) order by id for update;
  update public.worlds set updated_at = now() where id in (old_world, new_world);
  return null;
end $$;
create trigger games_configuration_invalidate_world_playsets after insert or update or delete on public.games
  for each row execute function public.world_configuration_invalidate_world_playsets();

-- Reorders validate an exact permutation while holding the same world lock as
-- ordinary inserts/deletes, then publish the entire order in one transaction.
create function public.reorder_world_categories(p_world_id uuid, p_ids uuid[]) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null or public.world_role(p_world_id,auth.uid()) not in ('owner','editor','guide') then
    raise exception 'Only world editors can reorder categories' using errcode = '42501';
  end if;
  perform 1 from public.worlds where id=p_world_id for update;
  if p_ids is null or cardinality(p_ids) <> (select count(distinct id) from unnest(p_ids) id)
    or cardinality(p_ids) <> (select count(*) from public.world_categories where world_id=p_world_id)
    or exists (select 1 from unnest(p_ids) candidate(id) where not exists (
      select 1 from public.world_categories c where c.id=candidate.id and c.world_id=p_world_id)) then
    raise exception 'Reorder must include every category exactly once';
  end if;
  update public.world_categories c set sort_order=ordered.position-1
    from unnest(p_ids) with ordinality ordered(id,position) where c.id=ordered.id;
end $$;

create function public.reorder_world_fields(p_category_id uuid, p_ids uuid[]) returns void
language plpgsql security definer set search_path = '' as $$
declare v_world_id uuid;
begin
  select world_id into v_world_id from public.world_categories where id=p_category_id;
  if auth.uid() is null or v_world_id is null or public.world_role(v_world_id,auth.uid()) not in ('owner','editor','guide') then
    raise exception 'Only world editors can reorder fields' using errcode = '42501';
  end if;
  perform 1 from public.worlds where id=v_world_id for update;
  if p_ids is null or cardinality(p_ids) <> (select count(distinct id) from unnest(p_ids) id)
    or cardinality(p_ids) <> (select count(*) from public.world_field_definitions where category_id=p_category_id)
    or exists (select 1 from unnest(p_ids) candidate(id) where not exists (
      select 1 from public.world_field_definitions d where d.id=candidate.id and d.category_id=p_category_id)) then
    raise exception 'Reorder must include every field exactly once';
  end if;
  update public.world_field_definitions d set sort_order=ordered.position-1
    from unnest(p_ids) with ordinality ordered(id,position) where d.id=ordered.id;
end $$;

-- Fail closed on pre-existing cross-category links; do not silently remove data.
do $$ begin
  if exists (select 1 from public.world_entry_field_values v
    join public.world_entries e on e.id = v.entry_id
    join public.world_field_definitions d on d.id = v.field_definition_id
    where e.category_id <> d.category_id or e.world_id <> d.world_id)
    or exists (select 1 from public.world_categories c join public.world_field_definitions d
      on d.id = c.subtitle_field_definition_id where c.id <> d.category_id or c.world_id <> d.world_id) then
    raise exception 'Repair existing cross-category field links before applying world configuration migration';
  end if;
end $$;

create function public.world_configuration_derive_configuration_customized() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  new.configuration_customized := exists (
    select 1 from public.world_template_receipts where world_id = new.id);
  return new;
end $$;
create trigger worlds_derive_configuration_customized before insert or update on public.worlds
for each row execute function public.world_configuration_derive_configuration_customized();
create function public.world_configuration_publish_configuration_customized() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  update public.worlds set configuration_customized = true where id = new.world_id;
  return new;
end $$;
create trigger world_template_receipts_publish_customized after insert on public.world_template_receipts
for each row execute function public.world_configuration_publish_configuration_customized();

-- Inherited definitions have no per-world rows. Validate membership against
-- the database catalog or stored custom definitions while retaining world and
-- entry ownership foreign keys.
alter table public.world_entries drop constraint world_entries_category_id_fkey;
alter table public.world_entry_field_values drop constraint world_entry_field_values_field_definition_id_fkey;

create function public.get_world_effective_categories(p_world_id uuid) returns setof jsonb
language plpgsql stable security definer set search_path = '' as $$
declare w public.worlds;
begin
  select * into w from public.worlds where id = p_world_id;
  if not found then return; end if;
  if w.configuration_customized then
    return query select to_jsonb(c) || jsonb_build_object('fields', coalesce((
      select jsonb_agg(to_jsonb(d) order by d.sort_order,d.id)
      from public.world_field_definitions d where d.category_id = c.id), '[]'::jsonb))
      from public.world_categories c where c.world_id = p_world_id;
  else
    return query select value from jsonb_array_elements(
      public.get_world_template(p_world_id,w.setting_key)->'categories');
  end if;
end $$;

-- Reinstate the removed field FK's deletion behavior. Category deletion still
-- refuses populated categories; whole-world deletion cascades through world_id.
create function public.world_configuration_delete_field_values() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  delete from public.world_entry_field_values where field_definition_id = old.id;
  return old;
end $$;
create trigger world_field_definitions_delete_values after delete on public.world_field_definitions
for each row execute function public.world_configuration_delete_field_values();

-- Inherited category IDs are world-scoped UUIDv5 values. Counts therefore accept
-- the world explicitly instead of looking up a row which may not exist yet.
create function public.get_world_category_counts(p_world_id uuid, p_category_id uuid) returns jsonb
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
      where v.world_id = p_world_id and v.field_definition_id = (f->>'id')::uuid)) from jsonb_array_elements(c->'fields') f), '{}'::jsonb));
end $$;

-- Ordinary world setting edits cannot reinterpret existing virtual identities.
-- Once entries exist, changing setting requires explicit configuration work.
create function public.world_configuration_guard_inherited_setting() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.setting_key is distinct from old.setting_key and not old.configuration_customized
    and exists (select 1 from public.world_entries where world_id = old.id) then
    raise exception 'Customize the world configuration before changing a populated world setting';
  end if;
  return new;
end $$;
create trigger worlds_guard_inherited_setting before update on public.worlds
for each row execute function public.world_configuration_guard_inherited_setting();

create function public.mutate_world_configuration(p_world_id uuid, p_operation jsonb,
  p_default_bindings jsonb default null) returns void
language plpgsql security definer set search_path = '' as $$
declare w public.worlds; role text; action text; data jsonb; item jsonb; rule_binding jsonb;
  template jsonb; category jsonb; definition jsonb; category_index integer; field_index integer;
  target_category integer; target_field integer; rule_index integer; target_id uuid; category_id uuid;
begin
  role := public.world_role(p_world_id, auth.uid());
  if auth.uid() is null or coalesce(role,'') not in ('owner','editor','guide') then
    raise exception 'Only world editors can change configuration' using errcode = '42501';
  end if;
  if p_operation is null or jsonb_typeof(p_operation) <> 'object' or jsonb_typeof(p_operation->'type') is distinct from 'string' then
    raise exception 'Invalid configuration operation';
  end if;
  action := p_operation->>'type';
  if action not in ('create_category','update_category','delete_category','reorder_categories',
    'create_field','update_field','delete_field','reorder_fields') then raise exception 'Invalid configuration operation'; end if;
  if action in ('delete_category','delete_field') and role not in ('owner','editor') then
    raise exception 'Only world owners and editors can delete configuration' using errcode = '42501';
  end if;
  select * into w from public.worlds where id = p_world_id for update;
  if not found then raise exception 'Unknown world'; end if;
  if not w.configuration_customized then
    template := public.get_world_template(p_world_id,w.setting_key);
    -- Only bindings may come from the client snapshot. Category identities,
    -- types, GM visibility, conditions and all other defaults stay authoritative.
    if p_default_bindings is not null then
      if jsonb_typeof(p_default_bindings) <> 'array' or octet_length(p_default_bindings::text) > 1048576 then
        raise exception 'Invalid default binding snapshot';
      end if;
      for item in select value from jsonb_array_elements(p_default_bindings) loop
        if jsonb_typeof(item) <> 'object' or not (item ?& array['id','binding','rule_bindings'])
          or item - array['id','binding','rule_bindings'] <> '{}'::jsonb
          or jsonb_typeof(item->'rule_bindings') <> 'array' then raise exception 'Invalid default binding snapshot'; end if;
        target_category := null; target_field := null;
        for category_index in 0..jsonb_array_length(template->'categories')-1 loop
          category := template->'categories'->category_index;
          for field_index in 0..jsonb_array_length(category->'fields')-1 loop
            if (category->'fields'->field_index->>'id')::uuid = (item->>'id')::uuid then
              target_category := category_index; target_field := field_index;
            end if;
          end loop;
        end loop;
        if target_field is null then raise exception 'Binding snapshot references an unknown default field'; end if;
        perform public.world_configuration_validate_binding(item->'binding');
        template := jsonb_set(template,array['categories',target_category::text,'fields',target_field::text,'binding'],item->'binding');
        for rule_binding in select value from jsonb_array_elements(item->'rule_bindings') loop
          if jsonb_typeof(rule_binding) <> 'object' or not (rule_binding ?& array['index','binding','conditions'])
            or rule_binding - array['index','binding','conditions'] <> '{}'::jsonb or jsonb_typeof(rule_binding->'index') <> 'number' then
            raise exception 'Invalid default rule binding';
          end if;
          rule_index := (rule_binding->>'index')::integer;
          definition := template->'categories'->target_category->'fields'->target_field;
          if rule_index < 0 or rule_index >= jsonb_array_length(definition->'configuration'->'rules')
            or not ((definition->'configuration'->'rules'->rule_index) ? 'binding') then
            raise exception 'Binding snapshot references an unknown default rule binding';
          end if;
          if rule_binding->'conditions' is distinct from definition->'configuration'->'rules'->rule_index->'conditions' then
            raise exception 'World defaults changed; reload before editing configuration';
          end if;
          perform public.world_configuration_validate_binding(rule_binding->'binding');
          template := jsonb_set(template,array['categories',target_category::text,'fields',target_field::text,
            'configuration','rules',rule_index::text,'binding'],rule_binding->'binding');
        end loop;
      end loop;
    end if;
    perform public.seed_world_template(p_world_id,template);
    -- Re-derive existing value security against the exact copied definitions.
    update public.world_entry_field_values set gm_only = gm_only where world_id = p_world_id;
  end if;

  if action = 'create_category' then
    if p_operation - array['type','category'] <> '{}'::jsonb then raise exception 'Invalid category operation'; end if;
    data := p_operation->'category';
    if jsonb_typeof(data) <> 'object' or data is null or not (data ?& array['id','name'])
      or data - array['id','name','icon','sort_order','supports_hierarchy','supports_map','supports_bonds','subtitle_field_definition_id'] <> '{}'::jsonb then
      raise exception 'Invalid category changes';
    end if;
    insert into public.world_categories (id,world_id,name,icon,sort_order,supports_hierarchy,supports_map,supports_bonds,subtitle_field_definition_id)
      values ((data->>'id')::uuid,p_world_id,data->>'name',nullif(data->'icon','null'::jsonb),
        coalesce((data->>'sort_order')::integer,0),coalesce((data->>'supports_hierarchy')::boolean,false),
        coalesce((data->>'supports_map')::boolean,false),coalesce((data->>'supports_bonds')::boolean,false),
        (data->>'subtitle_field_definition_id')::uuid);
  elsif action in ('update_category','delete_category') then
    target_id := (p_operation->>'id')::uuid;
    if not exists (select 1 from public.world_categories where id=target_id and world_id=p_world_id) then raise exception 'Unknown world category'; end if;
    if action = 'delete_category' then
      if p_operation - array['type','id'] <> '{}'::jsonb then raise exception 'Invalid category operation'; end if;
      delete from public.world_categories where id=target_id;
    else
      if p_operation - array['type','id','changes'] <> '{}'::jsonb then raise exception 'Invalid category operation'; end if;
      data := p_operation->'changes';
      if data is null or jsonb_typeof(data) <> 'object' or data - array['name','icon','sort_order','supports_hierarchy','supports_map','supports_bonds','subtitle_field_definition_id'] <> '{}'::jsonb then
        raise exception 'Invalid category changes';
      end if;
      update public.world_categories set
        name=case when data ? 'name' then data->>'name' else name end,
        icon=case when data ? 'icon' then nullif(data->'icon','null'::jsonb) else icon end,
        sort_order=case when data ? 'sort_order' then (data->>'sort_order')::integer else sort_order end,
        supports_hierarchy=case when data ? 'supports_hierarchy' then (data->>'supports_hierarchy')::boolean else supports_hierarchy end,
        supports_map=case when data ? 'supports_map' then (data->>'supports_map')::boolean else supports_map end,
        supports_bonds=case when data ? 'supports_bonds' then (data->>'supports_bonds')::boolean else supports_bonds end,
        subtitle_field_definition_id=case when data ? 'subtitle_field_definition_id' then (data->>'subtitle_field_definition_id')::uuid else subtitle_field_definition_id end
      where id=target_id;
    end if;
  elsif action = 'reorder_categories' then
    if p_operation - array['type','ids'] <> '{}'::jsonb or jsonb_typeof(p_operation->'ids') <> 'array' then raise exception 'Invalid reorder operation'; end if;
    perform public.reorder_world_categories(p_world_id,array(select jsonb_array_elements_text(p_operation->'ids')::uuid));
  elsif action = 'create_field' then
    if p_operation - array['type','category_id','field'] <> '{}'::jsonb then raise exception 'Invalid field operation'; end if;
    category_id := (p_operation->>'category_id')::uuid;
    if not exists (select 1 from public.world_categories c where c.id=category_id and c.world_id=p_world_id) then raise exception 'Unknown world category'; end if;
    data := p_operation->'field';
    if data is null or jsonb_typeof(data) <> 'object' or not (data ?& array['id','key','label','type'])
      or data - array['id','key','label','type','binding','configuration','gm_only','sort_order'] <> '{}'::jsonb then raise exception 'Invalid field changes'; end if;
    insert into public.world_field_definitions (id,world_id,category_id,key,label,type,binding,configuration,gm_only,sort_order)
      values ((data->>'id')::uuid,p_world_id,category_id,data->>'key',data->>'label',data->>'type',nullif(data->'binding','null'::jsonb),
        coalesce(data->'configuration','{"version":1,"suggestions":[],"helpText":"","visible":true,"rules":[]}'::jsonb),
        coalesce((data->>'gm_only')::boolean,false),coalesce((data->>'sort_order')::integer,0));
  elsif action in ('update_field','delete_field') then
    target_id := (p_operation->>'id')::uuid;
    if not exists (select 1 from public.world_field_definitions where id=target_id and world_id=p_world_id) then raise exception 'Unknown world field definition'; end if;
    if action = 'delete_field' then
      if p_operation - array['type','id'] <> '{}'::jsonb then raise exception 'Invalid field operation'; end if;
      delete from public.world_field_definitions where id=target_id;
    else
      if p_operation - array['type','id','changes'] <> '{}'::jsonb then raise exception 'Invalid field operation'; end if;
      data := p_operation->'changes';
      if data is null or jsonb_typeof(data) <> 'object' or data - array['label','type','binding','configuration','gm_only','sort_order'] <> '{}'::jsonb then raise exception 'Invalid field changes'; end if;
      update public.world_field_definitions set
        label=case when data ? 'label' then data->>'label' else label end,
        type=case when data ? 'type' then data->>'type' else type end,
        binding=case when data ? 'binding' then nullif(data->'binding','null'::jsonb) else binding end,
        configuration=case when data ? 'configuration' then data->'configuration' else configuration end,
        gm_only=case when data ? 'gm_only' then (data->>'gm_only')::boolean else gm_only end,
        sort_order=case when data ? 'sort_order' then (data->>'sort_order')::integer else sort_order end
      where id=target_id;
    end if;
  elsif action = 'reorder_fields' then
    if p_operation - array['type','category_id','ids'] <> '{}'::jsonb or jsonb_typeof(p_operation->'ids') <> 'array' then raise exception 'Invalid reorder operation'; end if;
    category_id := (p_operation->>'category_id')::uuid;
    if not exists (select 1 from public.world_categories c where c.id=category_id and c.world_id=p_world_id) then raise exception 'Unknown world category'; end if;
    perform public.reorder_world_fields(category_id,array(select jsonb_array_elements_text(p_operation->'ids')::uuid));
  end if;
end $$;

-- World configuration is read from the database for both inherited and
-- customized worlds. This projection deliberately excludes entries and values.
create function public.get_world_configuration(p_world_id uuid) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare w public.worlds; categories jsonb; fields jsonb;
begin
  if auth.uid() is null
    or coalesce(public.world_role(p_world_id, auth.uid()), 'none') = 'none' then
    raise exception 'World configuration is unavailable' using errcode = '42501';
  end if;
  select * into w from public.worlds where id = p_world_id;
  if not found then
    raise exception 'World configuration is unavailable' using errcode = '42501';
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', c->'id', 'world_id', to_jsonb(p_world_id), 'name', c->'name',
    'icon', c->'icon', 'sort_order', c->'sort_order',
    'supports_hierarchy', c->'supports_hierarchy',
    'supports_map', c->'supports_map', 'supports_bonds', c->'supports_bonds',
    'subtitle_field_definition_id', c->'subtitle_field_definition_id'
  ) order by (c->>'sort_order')::integer, (c->>'id')::uuid), '[]'::jsonb)
    into categories
    from public.get_world_effective_categories(p_world_id) c;
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', f->'id', 'world_id', to_jsonb(p_world_id),
    'category_id', c->'id', 'key', f->'key', 'label', f->'label',
    'type', f->'type', 'binding', f->'binding',
    'configuration', f->'configuration', 'gm_only', f->'gm_only',
    'sort_order', f->'sort_order'
  ) order by (c->>'sort_order')::integer, (c->>'id')::uuid,
    (f->>'sort_order')::integer, (f->>'id')::uuid), '[]'::jsonb)
    into fields
    from public.get_world_effective_categories(p_world_id) c,
      lateral jsonb_array_elements(c->'fields') f;
  return jsonb_build_object(
    'configuration_customized', w.configuration_customized,
    'categories', categories, 'field_definitions', fields
  );
end $$;

alter table public.world_field_definitions
  drop constraint world_field_definitions_type_check;
alter table public.world_field_definitions
  add constraint world_field_definitions_type_check
    check (type in ('text','richText','oracleText','tags','number',
      'categorySelect','categoryMultiSelect'));

-- A target cannot change beneath existing values. First-fork seeding may
-- insert a referencing field before its target category, so existence checks
-- run through a deferred constraint trigger after the full fork.
create function public.world_configuration_guard_reference_field_before() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.type in ('categorySelect','categoryMultiSelect') then
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
create trigger world_field_definitions_configuration_reference_before
  before insert or update on public.world_field_definitions
  for each row execute function public.world_configuration_guard_reference_field_before();

create function public.world_configuration_validate_reference_field_after() returns trigger
language plpgsql security definer set search_path = '' as $$
declare d public.world_field_definitions; target_id uuid;
begin
  -- An insert followed by a delete in one transaction leaves no definition.
  select * into d from public.world_field_definitions where id = new.id;
  if not found or d.type not in ('categorySelect','categoryMultiSelect') then
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
create constraint trigger world_field_definitions_configuration_reference_after
  after insert or update on public.world_field_definitions
  deferrable initially deferred
  for each row execute function public.world_configuration_validate_reference_field_after();

create function public.world_configuration_guard_referenced_category_delete() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  -- Whole-world deletion cascades categories and their fields together.
  if exists (select 1 from public.worlds where id = old.world_id)
    and exists (
      select 1 from public.world_field_definitions d
      where d.world_id = old.world_id and d.category_id <> old.id
        and d.type in ('categorySelect','categoryMultiSelect')
        and (d.configuration->>'targetCategoryId')::uuid = old.id
    ) then
    raise exception 'Remove fields targeting this category before deleting it';
  end if;
  return old;
end $$;
create trigger world_categories_configuration_reference_delete
  before delete on public.world_categories
  for each row execute function public.world_configuration_guard_referenced_category_delete();

-- A referenced target must be unlinked before deletion. Values belonging to
-- the same deleted entry cascade, and whole-world deletion still cascades all
-- content. This avoids silently dangling references in surviving entries.
create function public.world_configuration_guard_referenced_entry_delete() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  perform 1 from public.worlds where id = old.world_id for update;
  if not found then return old; end if;
  if exists (
    with fields as (
      select (f->>'id')::uuid id from public.get_world_effective_categories(old.world_id) c,
        lateral jsonb_array_elements(c->'fields') f
      where f->>'type' in ('categorySelect','categoryMultiSelect')
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
create trigger world_entries_world_configuration_reference_delete
  before delete on public.world_entries
  for each row execute function public.world_configuration_guard_referenced_entry_delete();

-- A writer may read a target that another reader of the source entry cannot.
-- Recheck references for each reader so a public field never reveals the UUID
-- of an author-only or Guide-only target. Invalid/stale references fail closed.
create function public.world_configuration_reference_target_readable(
  p_world_id uuid, p_category_id uuid, p_entry_id uuid, p_uid uuid, p_role text
) returns boolean
language plpgsql stable security definer set search_path = '' as $$
declare target public.world_entries;
begin
  select * into target from public.world_entries
    where id = p_entry_id and world_id = p_world_id and category_id = p_category_id;
  if not found then return false; end if;
  return case target.read_permissions
    when 'public' then true
    when 'all_players' then coalesce(p_role,'none') <> 'none'
    when 'guides_and_author' then target.author_id = p_uid
      or p_role in ('owner','editor','guide')
    when 'only_guides' then p_role in ('owner','editor','guide')
    when 'only_author' then target.author_id = p_uid
    else false
  end;
end $$;

create function public.world_configuration_reference_value_readable(
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
  if d->>'type' not in ('categorySelect','categoryMultiSelect')
    or p_value is null or p_value = 'null'::jsonb then return true; end if;
  if d->>'type' = 'categorySelect' then
    if jsonb_typeof(p_value) <> 'string' then return false; end if;
    begin
      target_id := (p_value #>> '{}')::uuid;
    exception when invalid_text_representation then return false;
    end;
    if not public.world_configuration_reference_target_readable(
      p_world_id, (d->'configuration'->>'targetCategoryId')::uuid, target_id, auth.uid(), role
    ) then return false; end if;
  else
    if jsonb_typeof(p_value) <> 'array' then return false; end if;
    for item in select value from jsonb_array_elements(p_value) value loop
      if jsonb_typeof(item) <> 'string' then return false; end if;
      begin
        target_id := (item #>> '{}')::uuid;
      exception when invalid_text_representation then return false;
      end;
      if not public.world_configuration_reference_target_readable(
        p_world_id, (d->'configuration'->>'targetCategoryId')::uuid, target_id, auth.uid(), role
      ) then return false; end if;
    end loop;
  end if;
  return true;
end $$;

create policy "Category references require readable targets"
  on public.world_entry_field_values as restrictive for select to authenticated
  using (public.world_configuration_reference_value_readable(world_id,field_definition_id,value));

-- Default privacy changes must update persisted value metadata in the same
-- transaction. Lock affected worlds in order, matching configuration mutations,
-- and leave independently customized configurations untouched.
create function public.world_template_refresh_inherited_values() returns trigger
language plpgsql security definer set search_path = '' as $$
declare changed_keys text[] := '{}'::text[];
begin
  if not exists (select 1 from public.world_templates where setting_key = 'blank') then
    raise exception 'The Blank world template is required';
  end if;
  if tg_op = 'UPDATE' and old is not distinct from new then return null; end if;
  if tg_op <> 'INSERT' then changed_keys := array_append(changed_keys,old.setting_key); end if;
  if tg_op <> 'DELETE' then changed_keys := array_append(changed_keys,new.setting_key); end if;
  perform 1 from public.worlds w where not w.configuration_customized
    and (w.setting_key = any(changed_keys) or ('blank' = any(changed_keys) and not exists (
      select 1 from public.world_templates t where t.setting_key = w.setting_key)))
    order by w.id for update;
  update public.world_entry_field_values v set gm_only = v.gm_only
    from public.worlds w where w.id = v.world_id and not w.configuration_customized
    and (w.setting_key = any(changed_keys) or ('blank' = any(changed_keys) and not exists (
      select 1 from public.world_templates t where t.setting_key = w.setting_key)));
  update public.worlds w set updated_at = now() where not w.configuration_customized
    and (w.setting_key = any(changed_keys) or ('blank' = any(changed_keys) and not exists (
      select 1 from public.world_templates t where t.setting_key = w.setting_key)));
  return null;
end $$;
create trigger world_templates_refresh_inherited_values
  after insert or update or delete on public.world_templates
  for each row execute function public.world_template_refresh_inherited_values();
revoke all on function public.world_template_refresh_inherited_values() from public,anon,authenticated;

-- Only these RPCs and the authenticated RLS predicate are public interfaces.
revoke all on function public.world_configuration_validate_binding(jsonb),
  public.world_configuration_validate_field(jsonb,text),
  public.world_configuration_validate_category_fields(uuid),
  public.world_configuration_guard_category(),
  public.world_configuration_guard_field(),
  public.world_configuration_check_field_dependencies(),
  public.world_entry_field_value_derive_parents(),
  public.world_entry_check_category_world(),
  public.seed_world_template(uuid,jsonb),
  public.get_world_playsets(uuid),
  public.world_configuration_invalidate_world_playsets(),
  public.reorder_world_categories(uuid,uuid[]),
  public.reorder_world_fields(uuid,uuid[]),
  public.world_configuration_derive_configuration_customized(),
  public.world_configuration_publish_configuration_customized(),
  public.get_world_effective_categories(uuid),
  public.world_configuration_delete_field_values(),
  public.get_world_category_counts(uuid,uuid),
  public.world_configuration_guard_inherited_setting(),
  public.mutate_world_configuration(uuid,jsonb,jsonb),
  public.get_world_configuration(uuid),
  public.world_configuration_guard_reference_field_before(),
  public.world_configuration_validate_reference_field_after(),
  public.world_configuration_guard_referenced_category_delete(),
  public.world_configuration_guard_referenced_entry_delete(),
  public.world_configuration_reference_target_readable(uuid,uuid,uuid,uuid,text),
  public.world_configuration_reference_value_readable(uuid,uuid,jsonb) from public,anon,authenticated;
grant execute on function public.get_world_playsets(uuid),
  public.get_world_category_counts(uuid,uuid),public.mutate_world_configuration(uuid,jsonb,jsonb),
  public.get_world_configuration(uuid),public.world_configuration_reference_value_readable(uuid,uuid,jsonb)
  to authenticated,service_role;
revoke insert,update,delete on public.world_categories,public.world_field_definitions from authenticated,anon;
commit;
