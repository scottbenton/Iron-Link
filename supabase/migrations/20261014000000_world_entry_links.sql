-- Linked entry fields follow their targets: deleting an entry removes it from
-- every linked entry value in its world, the way a parent link is set to null.
-- Clients also learn whether anyone in a world has less than Guide access, so
-- solo, co-op and standalone worlds can hide permission controls entirely.
begin;

-- Only newly chosen targets are checked. A retained target was checked when it
-- was chosen and cannot change category, and a writer bound by row-level
-- security can only rewrite a value whose targets it can already read. So
-- reordering, removals, metadata refreshes and multi/single rewrites always
-- succeed, including link cleanup run as a member who cannot read the other
-- targets, or after another target in the same delete is already gone.
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
    -- Stored links are always canonical UUID text, as written below.
    continue when previous_items @> jsonb_build_array(target_id::text);
    if not exists (select 1 from public.world_entries
      where id = target_id and world_id = e.world_id and category_id = target_category)
      or not public.world_configuration_reference_target_readable(
        e.world_id, target_category, target_id, auth.uid(), role) then
      raise exception 'Selected entry is unavailable in the target category';
    end if;
  end loop;
  new.value := case when multiple then items else items->0 end;
  return new;
end $$;

-- Deleting a linked entry used to be refused while anything linked to it.
-- Now the links go instead: a single link is removed, a multiple link loses
-- the entry and is removed once empty. This runs as the definer because the
-- deleter may be unable to read or edit the linking entries, and it only ever
-- removes the deleted entry's id from linked entry fields aimed at its
-- category. Entries deleted earlier in the same statement are skipped since
-- their own values cascade, and whole-world deletion cascades everything.
drop trigger world_entries_world_configuration_reference_delete on public.world_entries;
drop function public.world_configuration_guard_referenced_entry_delete();

create function public.world_entry_remove_links() returns trigger
language plpgsql security definer set search_path = '' as $$
declare target jsonb := to_jsonb(old.id::text); link_fields uuid[];
begin
  perform 1 from public.worlds where id = old.world_id for update;
  if not found then return null; end if;
  select coalesce(array_agg((f->>'id')::uuid), '{}'::uuid[]) into link_fields
    from public.get_world_effective_categories(old.world_id) c,
      lateral jsonb_array_elements(c->'fields') f
    where f->>'type' = 'select'
      and (f->'configuration'->>'targetCategoryId')::uuid = old.category_id;
  if cardinality(link_fields) = 0 then return null; end if;

  delete from public.world_entry_field_values v
    using public.world_entries e
    where e.id = v.entry_id and v.world_id = old.world_id
      and v.field_definition_id = any(link_fields)
      and (v.value = target or (jsonb_typeof(v.value) = 'array'
        and v.value @> jsonb_build_array(target) and v.value - (old.id::text) = '[]'::jsonb));
  update public.world_entry_field_values v set value = v.value - (old.id::text)
    from public.world_entries e
    where e.id = v.entry_id and v.world_id = old.world_id
      and v.field_definition_id = any(link_fields)
      and jsonb_typeof(v.value) = 'array' and v.value @> jsonb_build_array(target);
  return null;
end $$;
create trigger world_entries_remove_links after delete on public.world_entries
  for each row execute function public.world_entry_remove_links();

-- Reveals only whether some member has less than Guide access, never who.
-- Members are explicit world players and the players of linked games; each is
-- judged by their best role, so a player in a guided game who also plays a
-- linked co-op game counts as a Guide. Callers outside the world get false.
create function public.world_has_restricted_members(p_world_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select public.world_role(p_world_id, auth.uid()) <> 'none' and exists (
    select 1 from (
      select wp.user_id from public.world_players wp where wp.world_id = p_world_id
      union
      select gp.user_id from public.game_players gp
        join public.games g on g.id = gp.game_id where g.world_id = p_world_id
    ) member
    where public.world_role(p_world_id, member.user_id) in ('player','viewer'));
$$;

revoke all on function public.world_entry_remove_links() from public,anon,authenticated;
revoke execute on function public.world_has_restricted_members(uuid) from public;
revoke execute on function public.world_has_restricted_members(uuid) from anon;
grant execute on function public.world_has_restricted_members(uuid) to authenticated;
grant execute on function public.world_has_restricted_members(uuid) to service_role;
commit;
