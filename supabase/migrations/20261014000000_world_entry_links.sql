-- Linked entry fields follow their targets: deleting an entry removes it from
-- every linked entry value in its world, the way a parent link is set to null.
-- Clients also learn whether anyone in a world has less than Guide access, so
-- solo, co-op and standalone worlds can hide permission controls entirely.
-- Content writes now share the world lock instead of holding it exclusively,
-- and a value can only be updated or deleted by someone who can read it.
begin;

-- Configuration changes lock the world row FOR UPDATE. Content writes lock it
-- FOR SHARE: that still waits for, and holds off, configuration changes, but
-- never another content write. An UPDATE or DELETE locks its row before any
-- row trigger runs, so a trigger holding the world exclusively would wait for
-- the world while holding a row that the world's holder may need next: a
-- deadlock. The few checks that must exclude other content writes lock less:
-- link validation key-share locks each newly chosen target, as a foreign key
-- does, and parent moves serialize on a per-world advisory lock.
create or replace function public.world_entry_check_category_world() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  perform 1 from public.worlds where id = new.world_id for share;
  if tg_op = 'UPDATE' and (new.id <> old.id or new.world_id <> old.world_id or new.category_id <> old.category_id) then
    raise exception 'Entry identity, world and category cannot change';
  end if;
  if not exists (select 1 from public.get_world_effective_categories(new.world_id) c where (c->>'id')::uuid = new.category_id) then
    raise exception 'Entry category must belong to its world';
  end if;
  return new;
end $$;

-- Two concurrent moves could still form a cycle, so moves within a world take
-- turns on an advisory lock. Each waiter then checks ancestors afresh.
create or replace function public.world_entry_check_parent() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.parent_entry_id is null
    or (tg_op = 'UPDATE' and new.parent_entry_id is not distinct from old.parent_entry_id) then
    return new;
  end if;
  perform 1 from public.worlds where id = new.world_id for share;
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('world_entry_parents:' || new.world_id::text, 0));
  if new.parent_entry_id = new.id then
    raise exception 'An entry cannot be its own parent'
      using errcode = '23514', hint = 'invalid_parent';
  end if;
  if not exists (select 1 from public.world_entries where id = new.parent_entry_id
    and world_id = new.world_id and category_id = new.category_id) then
    raise exception 'Parent entry must be in the same world and category'
      using errcode = '23514', hint = 'invalid_parent';
  end if;
  if not coalesce((select (c->>'supports_hierarchy')::boolean
    from public.get_world_effective_categories(new.world_id) c
    where (c->>'id')::uuid = new.category_id), false) then
    raise exception 'This category does not support nested entries'
      using errcode = '23514', hint = 'invalid_parent';
  end if;
  -- union (not union all) drops rows already seen, so existing bad data
  -- containing a loop still terminates.
  if exists (
    with recursive ancestors(id) as (
      select new.parent_entry_id
      union
      select e.parent_entry_id from public.world_entries e
        join ancestors a on e.id = a.id where e.parent_entry_id is not null
    ) select 1 from ancestors where id = new.id) then
    raise exception 'An entry cannot be placed inside one of its descendants'
      using errcode = '23514', hint = 'invalid_parent';
  end if;
  return new;
end $$;

-- Only newly chosen targets are checked. A retained target was checked when it
-- was chosen and cannot change category, and row-level security only lets a
-- writer update a value it can read, so every retained target is readable. So
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
  perform 1 from public.worlds where id = e.world_id for share;
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

-- Deleting a linked entry used to be refused while anything linked to it.
-- Now the links go instead: a single link is removed, a multiple link loses
-- the entry and is removed once empty. This runs as the definer because the
-- deleter may be unable to read or edit the linking entries, and it only ever
-- removes the deleted entry's id from linked entry fields aimed at its
-- category. Entries deleted earlier in the same statement are skipped since
-- their own values cascade, and whole-world deletion cascades everything.
-- The shared world lock keeps the linked fields fixed while they are read.
-- Concurrent link writes cannot slip past: a newly chosen target is
-- key-share locked, so this delete waits for that write and then sees it;
-- a retained link lives in a row this cleanup locks, and a writer waiting on
-- that row rechecks the target as newly chosen once this delete commits.
drop trigger world_entries_world_configuration_reference_delete on public.world_entries;
drop function public.world_configuration_guard_referenced_entry_delete();

create function public.world_entry_remove_links() returns trigger
language plpgsql security definer set search_path = '' as $$
declare target jsonb := to_jsonb(old.id::text); link_fields uuid[];
begin
  perform 1 from public.worlds where id = old.world_id for share;
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

-- Value writes lock their entry FOR NO KEY UPDATE instead of FOR UPDATE. Any
-- row lock applies the entry's update policy, and this one still excludes
-- edits and deletion of the entry, but not the key-share lock that link
-- validation takes when another value links to it, so two entries can be
-- linked to each other at once without deadlocking.
alter policy "World entry field values follow their entry for inserts"
  on public.world_entry_field_values
  with check (
    exists (select 1 from public.world_entries we
      where we.id = world_entry_field_values.entry_id for no key update)
    and (not world_entry_field_values.gm_only
      or public.world_role(world_entry_field_values.world_id, (select auth.uid()))
        in ('owner','editor','guide')));
alter policy "World entry field values follow their entry for updates"
  on public.world_entry_field_values
  using (
    exists (select 1 from public.world_entries we
      where we.id = world_entry_field_values.entry_id for no key update)
    and (not world_entry_field_values.gm_only
      or public.world_role(world_entry_field_values.world_id, (select auth.uid()))
        in ('owner','editor','guide')))
  with check (
    exists (select 1 from public.world_entries we
      where we.id = world_entry_field_values.entry_id for no key update)
    and (not world_entry_field_values.gm_only
      or public.world_role(world_entry_field_values.world_id, (select auth.uid()))
        in ('owner','editor','guide')));
alter policy "World entry field values follow their entry for deletes"
  on public.world_entry_field_values
  using (
    exists (select 1 from public.world_entries we
      where we.id = world_entry_field_values.entry_id for no key update)
    and (not world_entry_field_values.gm_only
      or public.world_role(world_entry_field_values.world_id, (select auth.uid()))
        in ('owner','editor','guide')));

-- An UPDATE or DELETE that reads no columns skips read policies, so a writer
-- could otherwise change or remove a value it cannot see, and learn from the
-- outcome which hidden entries it links. Writers must be able to read the
-- value first; hidden values are simply not matched. For updates the same
-- condition also checks the new row, which value validation already ensures.
create policy "Category references require readable targets for updates"
  on public.world_entry_field_values as restrictive for update to authenticated
  using (public.world_configuration_reference_value_readable(world_id,field_definition_id,value));
create policy "Category references require readable targets for deletes"
  on public.world_entry_field_values as restrictive for delete to authenticated
  using (public.world_configuration_reference_value_readable(world_id,field_definition_id,value));

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
