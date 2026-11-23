-- Entry subtitle per type (#412). A category's subtitle field can be
-- replaced for entries whose subtitle field holds a given value: a Forge
-- Location whose Location Type is Sector shows its Region instead.
--
-- subtitle_overrides is a list of { value, field_definition_id }. The client
-- applies an override only while the category's subtitle field is a
-- single-choice option list, matches the value trimmed and case-insensitive,
-- and falls back to the subtitle field when the override field shows
-- nothing. Templates may carry the same key on a category; it is optional
-- there, so older template rows stay valid.
begin;

alter table public.world_categories
  add column subtitle_overrides jsonb not null default '[]'::jsonb,
  add constraint world_categories_subtitle_overrides_shape check (
    jsonb_typeof(subtitle_overrides) = 'array'
    and jsonb_array_length(subtitle_overrides) <= 100
  );

-- Validate overrides only when they change: deleting a field nulls the
-- subtitle pointer through its foreign key before the cleanup trigger below
-- removes the override, and that update must not trip on the stale entry.
create or replace function public.world_configuration_guard_category() returns trigger
language plpgsql security definer set search_path = '' as $$
declare v_world_id uuid; item jsonb; seen text[] := '{}'::text[]; normalized jsonb := '[]'::jsonb;
  item_value text;
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
  -- Overrides replace the subtitle field, so they go with it.
  if new.subtitle_field_definition_id is null then
    new.subtitle_overrides := '[]'::jsonb;
  elsif tg_op = 'INSERT' or new.subtitle_overrides is distinct from old.subtitle_overrides then
    if jsonb_typeof(new.subtitle_overrides) <> 'array' then raise exception 'Invalid subtitle override'; end if;
    for item in select value from jsonb_array_elements(new.subtitle_overrides) loop
      if jsonb_typeof(item) <> 'object'
        or not (item ?& array['value','field_definition_id'])
        or item - array['value','field_definition_id'] <> '{}'::jsonb
        or jsonb_typeof(item->'value') <> 'string'
        or jsonb_typeof(item->'field_definition_id') <> 'string' then
        raise exception 'Invalid subtitle override';
      end if;
      item_value := trim(item->>'value');
      if length(item_value) not between 1 and 200 then raise exception 'Invalid subtitle override'; end if;
      if lower(item_value) = any(seen) then raise exception 'Subtitle overrides must have distinct values'; end if;
      seen := array_append(seen, lower(item_value));
      if not exists (select 1 from public.world_field_definitions
        where id = (item->>'field_definition_id')::uuid and category_id = new.id and world_id = new.world_id) then
        raise exception 'Subtitle override field must belong to this category';
      end if;
      -- Entry values are indexed by canonical UUID strings; store that form.
      normalized := normalized || jsonb_build_array(jsonb_build_object(
        'value', item_value,
        'field_definition_id', (item->>'field_definition_id')::uuid::text));
    end loop;
    new.subtitle_overrides := normalized;
  end if;
  return new;
end $$;

create function public.world_configuration_remove_subtitle_overrides() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  update public.world_categories set subtitle_overrides = coalesce((
      select jsonb_agg(o.value order by o.position)
      from jsonb_array_elements(subtitle_overrides) with ordinality o(value,position)
      where o.value->>'field_definition_id' <> old.id::text), '[]'::jsonb)
    where id = old.category_id
      and exists (select 1 from jsonb_array_elements(subtitle_overrides) o
        where o.value->>'field_definition_id' = old.id::text);
  return old;
end $$;
create trigger world_field_definitions_remove_subtitle_overrides after delete on public.world_field_definitions
for each row execute function public.world_configuration_remove_subtitle_overrides();
revoke all on function public.world_configuration_remove_subtitle_overrides() from public, anon, authenticated;

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
      or c - array['id','name','icon','sort_order','supports_hierarchy','supports_map','supports_bonds','subtitle_field_definition_id','subtitle_overrides','fields'] <> '{}'::jsonb
      or jsonb_typeof(c->'id') <> 'string' or jsonb_typeof(c->'name') <> 'string'
      or jsonb_typeof(c->'sort_order') <> 'number'
      or jsonb_typeof(c->'supports_hierarchy') <> 'boolean'
      or jsonb_typeof(c->'supports_map') <> 'boolean'
      or jsonb_typeof(c->'supports_bonds') <> 'boolean'
      or jsonb_typeof(c->'subtitle_field_definition_id') not in ('string','null')
      or (c ? 'subtitle_overrides' and jsonb_typeof(c->'subtitle_overrides') <> 'array')
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
    update public.world_categories set
        subtitle_field_definition_id = (c->>'subtitle_field_definition_id')::uuid,
        subtitle_overrides = coalesce(c->'subtitle_overrides','[]'::jsonb)
      where id = (c->>'id')::uuid;
  end loop;
  return true;
end $$;
revoke all on function public.seed_world_template(uuid,jsonb) from public, anon, authenticated;

create or replace function public.mutate_world_configuration(p_world_id uuid, p_operation jsonb,
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
      or data - array['id','name','icon','sort_order','supports_hierarchy','supports_map','supports_bonds','subtitle_field_definition_id','subtitle_overrides'] <> '{}'::jsonb then
      raise exception 'Invalid category changes';
    end if;
    insert into public.world_categories (id,world_id,name,icon,sort_order,supports_hierarchy,supports_map,supports_bonds,subtitle_field_definition_id,subtitle_overrides)
      values ((data->>'id')::uuid,p_world_id,data->>'name',nullif(data->'icon','null'::jsonb),
        coalesce((data->>'sort_order')::integer,0),coalesce((data->>'supports_hierarchy')::boolean,false),
        coalesce((data->>'supports_map')::boolean,false),coalesce((data->>'supports_bonds')::boolean,false),
        (data->>'subtitle_field_definition_id')::uuid,
        coalesce(nullif(data->'subtitle_overrides','null'::jsonb),'[]'::jsonb));
  elsif action in ('update_category','delete_category') then
    target_id := (p_operation->>'id')::uuid;
    if not exists (select 1 from public.world_categories where id=target_id and world_id=p_world_id) then raise exception 'Unknown world category'; end if;
    if action = 'delete_category' then
      if p_operation - array['type','id'] <> '{}'::jsonb then raise exception 'Invalid category operation'; end if;
      delete from public.world_categories where id=target_id;
    else
      if p_operation - array['type','id','changes'] <> '{}'::jsonb then raise exception 'Invalid category operation'; end if;
      data := p_operation->'changes';
      if data is null or jsonb_typeof(data) <> 'object' or data - array['name','icon','sort_order','supports_hierarchy','supports_map','supports_bonds','subtitle_field_definition_id','subtitle_overrides'] <> '{}'::jsonb then
        raise exception 'Invalid category changes';
      end if;
      update public.world_categories set
        name=case when data ? 'name' then data->>'name' else name end,
        icon=case when data ? 'icon' then nullif(data->'icon','null'::jsonb) else icon end,
        sort_order=case when data ? 'sort_order' then (data->>'sort_order')::integer else sort_order end,
        supports_hierarchy=case when data ? 'supports_hierarchy' then (data->>'supports_hierarchy')::boolean else supports_hierarchy end,
        supports_map=case when data ? 'supports_map' then (data->>'supports_map')::boolean else supports_map end,
        supports_bonds=case when data ? 'supports_bonds' then (data->>'supports_bonds')::boolean else supports_bonds end,
        subtitle_field_definition_id=case when data ? 'subtitle_field_definition_id' then (data->>'subtitle_field_definition_id')::uuid else subtitle_field_definition_id end,
        subtitle_overrides=case when data ? 'subtitle_overrides' then coalesce(nullif(data->'subtitle_overrides','null'::jsonb),'[]'::jsonb) else subtitle_overrides end
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

create or replace function public.get_world_configuration(p_world_id uuid) returns jsonb
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
    'subtitle_field_definition_id', c->'subtitle_field_definition_id',
    'subtitle_overrides', coalesce(c->'subtitle_overrides', '[]'::jsonb)
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

-- Forge Locations: a Sector shows its Region, a Star its Description and a
-- Settlement its Location. Template ids are rewritten per world by
-- get_world_template, so the overrides name the template's own field ids.
do $$
declare missing text;
begin
  select string_agg(k, ', ') into missing
    from unnest(array['locationType','region','description','settlementLocation']) k
    where not exists (select 1 from public.world_templates t,
      jsonb_array_elements(t.configuration->'categories') c,
      jsonb_array_elements(c->'fields') d
      where t.setting_key = 'world:starforged/forge' and c->>'key' = 'locations' and d->>'key' = k);
  if missing is not null then raise exception 'Forge Locations fields are missing: %', missing; end if;
  if not exists (select 1 from public.world_templates t,
      jsonb_array_elements(t.configuration->'categories') c,
      jsonb_array_elements(c->'fields') d
      where t.setting_key = 'world:starforged/forge' and c->>'key' = 'locations'
        and d->>'key' = 'locationType' and c->>'subtitle_field_definition_id' = d->>'id') then
    raise exception 'Forge Locations subtitle is no longer Location Type';
  end if;
end $$;

update public.world_templates t set configuration = jsonb_set(t.configuration,'{categories}',(
  select jsonb_agg(case when c.value->>'key' = 'locations' then c.value || jsonb_build_object(
      'subtitle_overrides', (
        select jsonb_agg(jsonb_build_object('value', o.value, 'field_definition_id', d->>'id') order by o.position)
        from (values ('Sector','region',1),('Star','description',2),('Settlement','settlementLocation',3)) o(value,key,position)
        join jsonb_array_elements(c.value->'fields') d on d->>'key' = o.key))
    else c.value end order by c.position)
  from jsonb_array_elements(t.configuration->'categories') with ordinality c(value,position)))
where t.setting_key = 'world:starforged/forge';

commit;
