-- Merged saves for world Notes (#251).
--
-- World Notes save like a note's: read the stored Yjs state, merge, then write
-- only if nothing was saved in between, retrying otherwise. worlds.updated_at
-- also moves with renames and configuration changes, so the Notes keep their
-- own version, notes_updated_at, moved by any write to notes_content.
--
-- update_world_notes() still overwrites, for pages opened before this; new
-- clients save through update_world_notes_if_unchanged().
begin;

alter table public.worlds add column notes_updated_at timestamptz not null default now();

create function public.worlds_set_notes_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.notes_content is distinct from old.notes_content then
    new.notes_updated_at := now();
  end if;
  return new;
end $$;

create trigger worlds_set_notes_updated_at before update of notes_content on public.worlds
  for each row execute function public.worlds_set_notes_updated_at();

revoke all on function public.worlds_set_notes_updated_at() from public, anon, authenticated;

-- Writes the Notes only while they are still at p_expected_updated_at, and
-- returns their new version, or null when someone else saved first.
create function public.update_world_notes_if_unchanged(
    p_world_id uuid,
    p_notes_content bytea,
    p_expected_updated_at timestamptz
)
 returns timestamptz
 language plpgsql
 security definer
 set search_path to ''
as $function$
declare
    v_updated_at timestamptz;
begin
    if auth.uid() is null
       or public.world_role(p_world_id, auth.uid()) not in ('owner', 'editor', 'guide') then
        raise exception 'Only world editors and Guides can edit world notes'
          using errcode = '42501';
    end if;

    update public.worlds set notes_content = p_notes_content
      where id = p_world_id and notes_updated_at = p_expected_updated_at
      returning notes_updated_at into v_updated_at;
    return v_updated_at;
end;
$function$;

revoke execute on function public.update_world_notes_if_unchanged(uuid, bytea, timestamptz) from public;
revoke execute on function public.update_world_notes_if_unchanged(uuid, bytea, timestamptz) from anon;
grant execute on function public.update_world_notes_if_unchanged(uuid, bytea, timestamptz) to authenticated;
grant execute on function public.update_world_notes_if_unchanged(uuid, bytea, timestamptz) to service_role;

commit;
