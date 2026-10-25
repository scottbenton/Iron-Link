-- World entries are either Guide prep or shared with everyone, who can then
-- read and edit them, so players can keep notes on the people they meet.
--
-- 1. Shared entries become editable by every player, and Guide prep by
--    Guides only. Entries readable only by their author (and Guides) are left
--    as they are: making them public would expose them.
-- 2. Only owners, editors and Guides may change who can read or edit an
--    entry. The update policy lets anyone who may edit the entry write its
--    permission columns, and a shared entry is now editable by every player.

update public.world_entries
  set edit_permissions = 'all_players'
  where read_permissions = 'all_players' and edit_permissions <> 'all_players';

update public.world_entries
  set edit_permissions = 'only_guides'
  where read_permissions = 'only_guides' and edit_permissions <> 'only_guides';

create or replace function public.world_entry_guard_permissions() returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (new.read_permissions is distinct from old.read_permissions
      or new.edit_permissions is distinct from old.edit_permissions)
    and auth.uid() is not null
    and coalesce(public.world_role(new.world_id, auth.uid()), '')
      not in ('owner', 'editor', 'guide')
  then
    raise exception 'Only Guides may change who can see a world entry.'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

revoke all on function public.world_entry_guard_permissions() from public;

create trigger world_entry_guard_permissions
  before update of read_permissions, edit_permissions on public.world_entries
  for each row execute function public.world_entry_guard_permissions();
