-- Parent links nest entries within one world category. A parent must share the
-- entry's world and category, the category must support nesting, and an entry
-- can never sit inside itself or one of its descendants. Field conditions walk
-- these links, so they must always form a tree.
begin;

-- The composite key lets the foreign key itself require a matching world and
-- category. Deleting a parent still moves its children to the top level.
alter table public.world_entries
  add constraint world_entries_id_world_category_key unique (id, world_id, category_id);
alter table public.world_entries drop constraint world_entries_parent_entry_id_fkey;
alter table public.world_entries add constraint world_entries_parent_entry_id_fkey
  foreign key (parent_entry_id, world_id, category_id)
  references public.world_entries (id, world_id, category_id)
  on delete set null (parent_entry_id);
alter table public.world_entries add constraint world_entries_parent_not_self
  check (parent_entry_id <> id);

-- Every rejected parent raises check_violation with the hint 'invalid_parent'
-- so clients can recognise a refused move; messages name the specific case.
-- The constraints above stay as backstops with their own error codes.
-- Moves lock the world row, so two concurrent moves cannot form a cycle.
create function public.world_entry_check_parent() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.parent_entry_id is null
    or (tg_op = 'UPDATE' and new.parent_entry_id is not distinct from old.parent_entry_id) then
    return new;
  end if;
  perform 1 from public.worlds where id = new.world_id for update;
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
create trigger world_entries_check_parent before insert or update of parent_entry_id
  on public.world_entries for each row execute function public.world_entry_check_parent();

-- Covers direct category edits and configuration mutations alike. Locking the
-- world serializes this check with parent moves in the same world.
create function public.world_category_check_hierarchy() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if old.supports_hierarchy and not new.supports_hierarchy then
    perform 1 from public.worlds where id = new.world_id for update;
    if exists (select 1 from public.world_entries
      where world_id = new.world_id and category_id = new.id and parent_entry_id is not null) then
      raise exception 'Move nested entries to the top level before turning off nesting'
        using errcode = '23514', hint = 'nested_entries_exist';
    end if;
  end if;
  return new;
end $$;
create trigger world_categories_check_hierarchy before update of supports_hierarchy
  on public.world_categories for each row execute function public.world_category_check_hierarchy();

-- nestedEntryCount explains why nesting cannot be turned off.
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
    'nestedEntryCount', (select count(*) from public.world_entries
      where world_id = p_world_id and category_id = p_category_id and parent_entry_id is not null),
    'valueCounts', coalesce((select jsonb_object_agg(f->>'id', (select count(*) from public.world_entry_field_values v
      where v.world_id = p_world_id and v.field_definition_id = (f->>'id')::uuid)) from jsonb_array_elements(c->'fields') f), '{}'::jsonb),
    'multiValueCounts', coalesce((select jsonb_object_agg(f->>'id', (select count(*) from public.world_entry_field_values v
      where v.world_id = p_world_id and v.field_definition_id = (f->>'id')::uuid
        and case jsonb_typeof(v.value) when 'array' then jsonb_array_length(v.value) > 1 else false end)) from jsonb_array_elements(c->'fields') f), '{}'::jsonb));
end $$;

revoke all on function public.world_entry_check_parent(),
  public.world_category_check_hierarchy() from public,anon,authenticated;
commit;
