-- Defaults are executable release data, not per-world records. Only an explicit
-- configuration mutation materializes them. Entries and values retain UUIDs.
alter table public.worlds add column configuration_customized boolean not null default false;
update public.worlds w set configuration_customized = exists (
  select 1 from public.world_template_receipts r where r.world_id = w.id
) or exists (select 1 from public.world_categories c where c.world_id = w.id);

create function public.w4_derive_configuration_customized() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  new.configuration_customized := exists (
    select 1 from public.world_template_receipts where world_id = new.id);
  return new;
end $$;
create trigger worlds_derive_configuration_customized before insert or update on public.worlds
for each row execute function public.w4_derive_configuration_customized();
create function public.w4_publish_configuration_customized() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  update public.worlds set configuration_customized = true where id = new.world_id;
  return new;
end $$;
create trigger world_template_receipts_publish_customized after insert on public.world_template_receipts
for each row execute function public.w4_publish_configuration_customized();

-- Category and field foreign keys cannot refer to definitions in code. Their
-- replacements below enforce membership using either authoritative defaults or
-- stored definitions; world and entry ownership foreign keys remain in place.
alter table public.world_entries drop constraint world_entries_category_id_fkey;
alter table public.world_entry_field_values drop constraint world_entry_field_values_field_definition_id_fkey;

create function public.w4_effective_categories(p_world_id uuid) returns setof jsonb
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
      public.w4_static_world_template(p_world_id,w.setting_key)->'categories');
  end if;
end $$;

create or replace function public.world_entry_check_category_world() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  perform 1 from public.worlds where id = new.world_id for update;
  if tg_op = 'UPDATE' and (new.id <> old.id or new.world_id <> old.world_id or new.category_id <> old.category_id) then
    raise exception 'Entry identity, world and category cannot change';
  end if;
  if not exists (select 1 from public.w4_effective_categories(new.world_id) c where (c->>'id')::uuid = new.category_id) then
    raise exception 'Entry category must belong to its world';
  end if;
  return new;
end $$;

create or replace function public.world_entry_field_value_derive_parents() returns trigger
language plpgsql security definer set search_path = '' as $$
declare e public.world_entries; d jsonb;
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
  return new;
end $$;

-- Reinstate the removed field FK's deletion behavior. Category deletion still
-- refuses populated categories; whole-world deletion cascades through world_id.
create function public.w4_delete_field_values() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  delete from public.world_entry_field_values where field_definition_id = old.id;
  return old;
end $$;
create trigger world_field_definitions_delete_values after delete on public.world_field_definitions
for each row execute function public.w4_delete_field_values();

-- Static category IDs are world-scoped UUIDv5 values. Counts therefore accept
-- the world explicitly instead of looking up a row which may not exist yet.
drop function public.get_world_category_counts(uuid);
create function public.get_world_category_counts(p_world_id uuid, p_category_id uuid) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare c jsonb;
begin
  if auth.uid() is null or coalesce(public.world_role(p_world_id,auth.uid()),'') not in ('owner','editor','guide') then
    raise exception 'Only world editors can count category content' using errcode = '42501';
  end if;
  select value into c from public.w4_effective_categories(p_world_id) value where (value->>'id')::uuid = p_category_id;
  if not found then raise exception 'Unknown world category'; end if;
  return jsonb_build_object('entryCount', (select count(*) from public.world_entries where world_id = p_world_id and category_id = p_category_id),
    'valueCounts', coalesce((select jsonb_object_agg(f->>'id', (select count(*) from public.world_entry_field_values v
      where v.world_id = p_world_id and v.field_definition_id = (f->>'id')::uuid)) from jsonb_array_elements(c->'fields') f), '{}'::jsonb));
end $$;

-- Ordinary world setting edits cannot reinterpret existing virtual identities.
-- Once entries exist, changing setting requires explicit configuration work.
create function public.w4_guard_static_setting() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.setting_key is distinct from old.setting_key and not old.configuration_customized
    and exists (select 1 from public.world_entries where world_id = old.id) then
    raise exception 'Customize the world configuration before changing a populated world setting';
  end if;
  return new;
end $$;
create trigger worlds_guard_static_setting before update on public.worlds
for each row execute function public.w4_guard_static_setting();

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
    template := public.w4_static_world_template(p_world_id,w.setting_key);
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
        perform public.w4_validate_binding(item->'binding');
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
          perform public.w4_validate_binding(rule_binding->'binding');
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

-- All configuration mutation paths now pass through the atomic fork boundary.
revoke insert,update,delete on public.world_categories,public.world_field_definitions from authenticated,anon;
revoke all on function public.seed_world_template(uuid,jsonb),public.create_world_with_template(text,text,text,jsonb),
  public.reorder_world_categories(uuid,uuid[]),public.reorder_world_fields(uuid,uuid[]) from authenticated;
revoke all on function public.w4_derive_configuration_customized(),public.w4_publish_configuration_customized(),
  public.w4_effective_categories(uuid),public.w4_delete_field_values(),public.w4_guard_static_setting() from public,anon,authenticated;
revoke all on function public.get_world_category_counts(uuid,uuid),public.mutate_world_configuration(uuid,jsonb,jsonb) from public,anon;
grant execute on function public.get_world_category_counts(uuid,uuid),public.mutate_world_configuration(uuid,jsonb,jsonb) to authenticated,service_role;
