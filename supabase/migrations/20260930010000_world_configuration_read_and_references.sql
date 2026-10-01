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
    from public.w4_effective_categories(p_world_id) c;
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', f->'id', 'world_id', to_jsonb(p_world_id),
    'category_id', c->'id', 'key', f->'key', 'label', f->'label',
    'type', f->'type', 'binding', f->'binding',
    'configuration', f->'configuration', 'gm_only', f->'gm_only',
    'sort_order', f->'sort_order'
  ) order by (c->>'sort_order')::integer, (c->>'id')::uuid,
    (f->>'sort_order')::integer, (f->>'id')::uuid), '[]'::jsonb)
    into fields
    from public.w4_effective_categories(p_world_id) c,
      lateral jsonb_array_elements(c->'fields') f;
  return jsonb_build_object(
    'configuration_customized', w.configuration_customized,
    'categories', categories, 'field_definitions', fields
  );
end $$;
revoke all on function public.get_world_configuration(uuid) from public, anon;
grant execute on function public.get_world_configuration(uuid) to authenticated;

alter table public.world_field_definitions
  drop constraint world_field_definitions_type_check;
alter table public.world_field_definitions
  add constraint world_field_definitions_type_check
    check (type in ('text','richText','oracleText','tags','number',
      'categorySelect','categoryMultiSelect'));

-- Preserve the existing field-configuration contract while adding a target
-- category only for reference fields. UUID spelling is canonicalized below.
create or replace function public.w4_validate_configuration(p_configuration jsonb, p_type text) returns void
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

-- A target cannot change beneath existing values. First-fork seeding may
-- insert a referencing field before its target category, so existence checks
-- run through a deferred constraint trigger after the full fork.
create function public.w4_guard_reference_field_before() returns trigger
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
create trigger world_field_definitions_w4_reference_before
  before insert or update on public.world_field_definitions
  for each row execute function public.w4_guard_reference_field_before();

create function public.w4_validate_reference_field_after() returns trigger
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
  if not exists (select 1 from public.w4_effective_categories(d.world_id) c
    where (c->>'id')::uuid = target_id) then
    raise exception 'Target category must belong to the same world';
  end if;
  return null;
end $$;
create constraint trigger world_field_definitions_w4_reference_after
  after insert or update on public.world_field_definitions
  deferrable initially deferred
  for each row execute function public.w4_validate_reference_field_after();

create function public.w4_guard_referenced_category_delete() returns trigger
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
create trigger world_categories_w4_reference_delete
  before delete on public.world_categories
  for each row execute function public.w4_guard_referenced_category_delete();

-- Values remain in the existing JSONB column. The world row lock serializes
-- reference writes against target deletion, while the target check mirrors the
-- entry SELECT policy because this SECURITY DEFINER trigger bypasses RLS.
create or replace function public.world_entry_field_value_derive_parents() returns trigger
language plpgsql security definer set search_path = '' as $$
declare e public.world_entries; d jsonb;
  target_id uuid; selected_ids uuid[] := '{}'::uuid[]; item jsonb; role text;
  reference_changed boolean := true;
begin
  select * into e from public.world_entries where id = new.entry_id;
  if not found then raise exception 'Unknown world entry'; end if;
  perform 1 from public.worlds where id = e.world_id for update;
  select f into d from public.w4_effective_categories(e.world_id) c,
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
      or (reference_changed and not public.w4_reference_target_readable(
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

-- A referenced target must be unlinked before deletion. Values belonging to
-- the same deleted entry cascade, and whole-world deletion still cascades all
-- content. This avoids silently dangling references in surviving entries.
create function public.w4_guard_referenced_entry_delete() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  perform 1 from public.worlds where id = old.world_id for update;
  if not found then return old; end if;
  if exists (
    with fields as (
      select (f->>'id')::uuid id from public.w4_effective_categories(old.world_id) c,
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
create trigger world_entries_w4_reference_delete
  before delete on public.world_entries
  for each row execute function public.w4_guard_referenced_entry_delete();

-- A writer may read a target that another reader of the source entry cannot.
-- Recheck references for each reader so a public field never reveals the UUID
-- of an author-only or Guide-only target. Invalid/stale references fail closed.
create function public.w4_reference_target_readable(
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
revoke all on function public.w4_reference_target_readable(uuid,uuid,uuid,uuid,text)
  from public,anon,authenticated;
create function public.w4_reference_value_readable(
  p_world_id uuid, p_field_definition_id uuid, p_value jsonb
) returns boolean
language plpgsql stable security definer set search_path = '' as $$
declare d jsonb; target_id uuid; item jsonb;
  role text := public.world_role(p_world_id, auth.uid());
begin
  if auth.uid() is null then return false; end if;
  select f into d from public.w4_effective_categories(p_world_id) c,
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
    if not public.w4_reference_target_readable(
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
      if not public.w4_reference_target_readable(
        p_world_id, (d->'configuration'->>'targetCategoryId')::uuid, target_id, auth.uid(), role
      ) then return false; end if;
    end loop;
  end if;
  return true;
end $$;
revoke all on function public.w4_reference_value_readable(uuid,uuid,jsonb) from public,anon;
grant execute on function public.w4_reference_value_readable(uuid,uuid,jsonb) to authenticated;
create policy "Category references require readable targets"
  on public.world_entry_field_values as restrictive for select to authenticated
  using (public.w4_reference_value_readable(world_id,field_definition_id,value));

revoke all on function public.w4_guard_reference_field_before(),
  public.w4_validate_reference_field_after(),
  public.w4_guard_referenced_category_delete(),
  public.w4_guard_referenced_entry_delete() from public, anon, authenticated;


-- Reference definitions require their target on the first insert. Install all
-- non-rule configuration immediately, then add rules after field identities
-- exist so forward condition references retain their original behavior.
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
      perform public.w4_validate_configuration(f->'configuration', f->>'type');
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
