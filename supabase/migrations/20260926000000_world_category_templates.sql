-- W4: versioned field configuration, atomic template seeding, and boundaries.
-- A world row is the serialization point for configuration and value writes.
-- Existing RLS remains authoritative for direct writes, including guide edits.
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

create function public.w4_validate_binding(p_binding jsonb) returns void
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

create function public.w4_validate_configuration(p_configuration jsonb, p_type text) returns void
language plpgsql set search_path = '' as $$
declare r jsonb; c jsonb;
begin
  if p_configuration is null or jsonb_typeof(p_configuration) <> 'object'
    or not (p_configuration ?& array['version','suggestions','helpText','visible','rules'])
    or p_configuration - array['version','suggestions','helpText','visible','rules'] <> '{}'::jsonb
    or p_configuration->'version' <> '1'::jsonb
    or jsonb_typeof(p_configuration->'suggestions') <> 'array'
    or jsonb_typeof(p_configuration->'rules') <> 'array'
    or jsonb_typeof(p_configuration->'helpText') <> 'string'
    or length(p_configuration->>'helpText') > 4000
    or jsonb_typeof(p_configuration->'visible') <> 'boolean'
    or octet_length(p_configuration::text) > 262144 then
    raise exception 'Invalid field configuration';
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
    perform public.w4_validate_binding(r->'binding');
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
create function public.w4_validate_category_fields(p_category_id uuid) returns void
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

create function public.w4_guard_category() returns trigger
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
create trigger world_categories_w4_guard before insert or update or delete on public.world_categories
  for each row execute function public.w4_guard_category();

create function public.w4_guard_field() returns trigger
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
  perform public.w4_validate_binding(new.binding);
  perform public.w4_validate_configuration(new.configuration, new.type);
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
create trigger world_field_definitions_w4_guard before insert or update or delete on public.world_field_definitions
  for each row execute function public.w4_guard_field();

create function public.w4_check_field_dependencies() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  perform public.w4_validate_category_fields(new.category_id);
  return new;
end $$;
create trigger world_field_definitions_w4_dependencies after insert or update on public.world_field_definitions
  for each row execute function public.w4_check_field_dependencies();

create or replace function public.world_entry_field_value_derive_parents() returns trigger
language plpgsql security definer set search_path = '' as $$
declare e public.world_entries; d public.world_field_definitions;
begin
  select * into e from public.world_entries where id = new.entry_id;
  if not found then raise exception 'Unknown world entry'; end if;
  perform 1 from public.worlds where id = e.world_id for update;
  select * into d from public.world_field_definitions where id = new.field_definition_id;
  if not found then raise exception 'Unknown world field definition'; end if;
  if d.world_id <> e.world_id or d.category_id <> e.category_id then
    raise exception 'Entry and field definition must belong to the same category and world';
  end if;
  new.world_id := e.world_id;
  new.gm_only := d.gm_only;
  return new;
end $$;

-- Moving existing entries would invalidate their field values. Parent hierarchy
-- validation remains a W5 concern; category membership itself is immutable.
create or replace function public.world_entry_check_category_world() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  perform 1 from public.worlds where id = new.world_id for update;
  if tg_op = 'UPDATE' and (new.id <> old.id or new.world_id <> old.world_id or new.category_id <> old.category_id) then
    raise exception 'Entry identity, world and category cannot change';
  end if;
  if not exists (select 1 from public.world_categories where id = new.category_id and world_id = new.world_id) then
    raise exception 'Entry category must belong to its world';
  end if;
  return new;
end $$;

create function public.seed_world_template(p_world_id uuid, p_template jsonb) returns boolean
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
      perform public.w4_validate_configuration(f->'configuration', f->>'type');
      insert into public.world_field_definitions (id, world_id, category_id, key, label, type, binding, gm_only, sort_order)
        values ((f->>'id')::uuid, p_world_id, (c->>'id')::uuid, f->>'key', f->>'label', f->>'type',
          nullif(f->'binding','null'::jsonb), (f->>'gm_only')::boolean, (f->>'sort_order')::integer);
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

create function public.w4_invalidate_world_playsets() returns trigger
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
create trigger games_w4_invalidate_world_playsets after insert or update or delete on public.games
  for each row execute function public.w4_invalidate_world_playsets();

create function public.create_world_with_template(p_name text, p_description text default null,
  p_setting_key text default null, p_template jsonb default null)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_world_id uuid;
begin
  if length(trim(p_name)) not between 1 and 200 or p_name is null then raise exception 'Invalid world name'; end if;
  v_world_id := public.create_world(p_name, p_description, p_setting_key);
  perform public.seed_world_template(v_world_id, p_template);
  return v_world_id;
end $$;

-- Counts include private/GM values for configuration editors only. Returning
-- hidden entry counts to ordinary members would disclose private activity.
create function public.get_world_category_counts(p_category_id uuid) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare v_world_id uuid; v_result jsonb;
begin
  select world_id into v_world_id from public.world_categories where id = p_category_id;
  if auth.uid() is null or v_world_id is null
    or public.world_role(v_world_id, auth.uid()) not in ('owner','editor','guide') then
    raise exception 'Only world editors can count category content' using errcode = '42501';
  end if;
  select jsonb_build_object('entryCount', (select count(*) from public.world_entries where category_id = p_category_id),
    'valueCounts', coalesce((select jsonb_object_agg(id::text, value_count) from (
      select d.id, count(v.field_definition_id) value_count from public.world_field_definitions d
      left join public.world_entry_field_values v on v.field_definition_id = d.id
      where d.category_id = p_category_id group by d.id
    ) counts), '{}'::jsonb)) into v_result;
  return v_result;
end $$;

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
    raise exception 'Repair existing cross-category field links before applying W4';
  end if;
end $$;

revoke all on function public.w4_validate_binding(jsonb), public.w4_validate_configuration(jsonb,text),
  public.w4_validate_category_fields(uuid), public.w4_guard_category(), public.w4_guard_field(),
  public.w4_check_field_dependencies(), public.w4_invalidate_world_playsets() from public, anon, authenticated;
revoke all on function public.seed_world_template(uuid,jsonb), public.create_world_with_template(text,text,text,jsonb),
  public.get_world_category_counts(uuid), public.get_world_playsets(uuid),
  public.reorder_world_categories(uuid,uuid[]), public.reorder_world_fields(uuid,uuid[]) from public, anon;
grant execute on function public.seed_world_template(uuid,jsonb), public.create_world_with_template(text,text,text,jsonb),
  public.get_world_category_counts(uuid), public.get_world_playsets(uuid),
  public.reorder_world_categories(uuid,uuid[]), public.reorder_world_fields(uuid,uuid[]) to authenticated, service_role;
