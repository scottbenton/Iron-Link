-- Note and folder permissions in the database (#282).
--
-- The notes policies only checked game membership, and the folder read and
-- delete policies compared game_players.game_id to itself, so any member of
-- any game could read or delete every folder. The app filtered by the
-- permission columns, but the API did not. These policies apply the same
-- rules as the app (getPermissions in notes.store.ts):
--
-- - read: public to everyone; all players to members; Guides only to Guides
--   (solo and co-op members count); only author to the author; guides and
--   author to both. Everyone but public readers must be a member.
-- - edit (content, title, moving): all players to members; only author to the
--   author; guides and author to both; Guides only to Guides.
-- - manage (delete, change permissions or author): the author, or a Guide
--   when editing is Guides only.
--
-- Reordering a note also needs only edit rights on its folder, as the folder
-- view lets folder editors drag notes.
begin;

create function public.note_permission_is_member(p_game_id uuid, p_uid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.game_players gp
    where gp.game_id = p_game_id and gp.user_id = p_uid);
$$;

create function public.note_permission_allows_read(p_game_id uuid, p_author_id uuid,
  p_read public.note_read_permissions, p_uid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select case p_read
    when 'public' then true
    when 'all_players' then public.note_permission_is_member(p_game_id, p_uid)
    when 'guides_and_author' then
      (p_author_id = p_uid and public.note_permission_is_member(p_game_id, p_uid))
      or public.is_game_guide(p_game_id, p_uid)
    when 'only_guides' then public.is_game_guide(p_game_id, p_uid)
    when 'only_author' then p_author_id = p_uid and public.note_permission_is_member(p_game_id, p_uid)
    else false
  end;
$$;

create function public.note_permission_allows_edit(p_game_id uuid, p_author_id uuid,
  p_edit public.note_edit_permissions, p_uid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select public.note_permission_is_member(p_game_id, p_uid) and case p_edit
    when 'all_players' then true
    when 'guides_and_author' then p_author_id = p_uid or public.is_game_guide(p_game_id, p_uid)
    when 'only_guides' then public.is_game_guide(p_game_id, p_uid)
    when 'only_author' then p_author_id = p_uid
    else false
  end;
$$;

create function public.note_permission_allows_manage(p_game_id uuid, p_author_id uuid,
  p_edit public.note_edit_permissions, p_uid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select public.note_permission_is_member(p_game_id, p_uid) and (
    p_author_id = p_uid
    or (p_edit = 'only_guides' and public.is_game_guide(p_game_id, p_uid)));
$$;

create function public.note_folder_editable(p_folder_id uuid, p_uid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.note_folders f where f.id = p_folder_id
    and public.note_permission_allows_edit(f.game_id, f.author_id, f.edit_permissions, p_uid));
$$;

-- Whether a folder exists in a game. Policies call this rather than select
-- note_folders themselves, which would recurse through its own policies.
create function public.note_folder_in_game(p_folder_id uuid, p_game_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.note_folders f
    where f.id = p_folder_id and f.game_id = p_game_id);
$$;

-- The room key rule (#250) now shares the read rule above.
create or replace function public.note_readable(p_note_id uuid, p_uid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.notes n where n.id = p_note_id
    and public.note_permission_allows_read(n.game_id, n.author_id, n.read_permissions, p_uid));
$$;

revoke execute on function public.note_permission_is_member(uuid, uuid) from public, anon;
revoke execute on function public.note_permission_allows_read(uuid, uuid, public.note_read_permissions, uuid) from public, anon;
revoke execute on function public.note_permission_allows_edit(uuid, uuid, public.note_edit_permissions, uuid) from public, anon;
revoke execute on function public.note_permission_allows_manage(uuid, uuid, public.note_edit_permissions, uuid) from public, anon;
revoke execute on function public.note_folder_editable(uuid, uuid) from public, anon;
revoke execute on function public.note_folder_in_game(uuid, uuid) from public, anon;
grant execute on function public.note_permission_is_member(uuid, uuid) to authenticated, service_role;
grant execute on function public.note_permission_allows_read(uuid, uuid, public.note_read_permissions, uuid) to authenticated, service_role;
grant execute on function public.note_permission_allows_edit(uuid, uuid, public.note_edit_permissions, uuid) to authenticated, service_role;
grant execute on function public.note_permission_allows_manage(uuid, uuid, public.note_edit_permissions, uuid) to authenticated, service_role;
grant execute on function public.note_folder_editable(uuid, uuid) to authenticated, service_role;
grant execute on function public.note_folder_in_game(uuid, uuid) to authenticated, service_role;

-- Notes.
drop policy "Users can read notes if they are game players" on public.notes;
drop policy "Users can insert notes if they are game players" on public.notes;
drop policy "Users can update notes if they are game players" on public.notes;
drop policy "Users can delete notes if they are game players" on public.notes;

create policy "Notes are readable per read_permissions" on public.notes
  for select to authenticated using (
    public.note_permission_allows_read(game_id, author_id, read_permissions, (select auth.uid())));

-- A new note is the creator's own, in a folder of the same game they can edit.
create policy "Folder editors can create notes" on public.notes
  for insert to authenticated with check (
    author_id = (select auth.uid())
    and public.note_folder_in_game(parent_folder_id, game_id)
    and public.note_folder_editable(parent_folder_id, (select auth.uid())));

-- Which columns each editor may change is checked by notes_guard_update.
create policy "Notes are writable per edit_permissions" on public.notes
  for update to authenticated
  using (
    public.note_permission_allows_edit(game_id, author_id, edit_permissions, (select auth.uid()))
    or public.note_folder_editable(parent_folder_id, (select auth.uid())))
  with check (public.note_folder_in_game(parent_folder_id, game_id));

create policy "Note authors can delete notes" on public.notes
  for delete to authenticated using (
    public.note_permission_allows_manage(game_id, author_id, edit_permissions, (select auth.uid())));

create function public.notes_guard_update() returns trigger
language plpgsql set search_path = '' as $$
declare v_uid uuid := auth.uid();
begin
  -- Only client requests are checked; triggers and admin work run as others.
  if current_user not in ('authenticated', 'anon') then return new; end if;
  if new.game_id is distinct from old.game_id then
    raise exception using errcode = '42501', message = 'A note cannot move to another game';
  end if;
  if (new.read_permissions, new.edit_permissions, new.author_id)
      is distinct from (old.read_permissions, old.edit_permissions, old.author_id)
    and not public.note_permission_allows_manage(old.game_id, old.author_id, old.edit_permissions, v_uid) then
    raise exception using errcode = '42501', message = 'Only the author can change who can see or edit this note';
  end if;
  if (new.title, new.note_content_bytes, new.note_content_text, new.parent_folder_id)
      is distinct from (old.title, old.note_content_bytes, old.note_content_text, old.parent_folder_id)
    and not public.note_permission_allows_edit(old.game_id, old.author_id, old.edit_permissions, v_uid) then
    raise exception using errcode = '42501', message = 'You cannot edit this note';
  end if;
  return new;
end $$;

create trigger notes_guard_update before update on public.notes
  for each row execute function public.notes_guard_update();

-- Folders.
drop policy "Users can read note folders if they are game players" on public.note_folders;
drop policy "Users can create note folders if they are game players" on public.note_folders;
drop policy "Users can update note folders if they are game players" on public.note_folders;
drop policy "Users can delete note folders if they are game players" on public.note_folders;

create policy "Note folders are readable per read_permissions" on public.note_folders
  for select to authenticated using (
    public.note_permission_allows_read(game_id, author_id, read_permissions, (select auth.uid())));

-- A new folder is the creator's own, at the top of the game (each player's
-- root folder) or in a folder of the same game they can edit.
create policy "Members can create note folders" on public.note_folders
  for insert to authenticated with check (
    author_id = (select auth.uid())
    and public.note_permission_is_member(game_id, (select auth.uid()))
    and (parent_folder_id is null or (
      public.note_folder_in_game(parent_folder_id, game_id)
      and public.note_folder_editable(parent_folder_id, (select auth.uid())))));

create policy "Note folders are writable per edit_permissions" on public.note_folders
  for update to authenticated
  using (public.note_permission_allows_edit(game_id, author_id, edit_permissions, (select auth.uid())))
  with check (parent_folder_id is null
    or public.note_folder_in_game(parent_folder_id, game_id));

create policy "Note folder authors can delete folders" on public.note_folders
  for delete to authenticated using (
    public.note_permission_allows_manage(game_id, author_id, edit_permissions, (select auth.uid())));

create function public.note_folders_guard_update() returns trigger
language plpgsql set search_path = '' as $$
begin
  if current_user not in ('authenticated', 'anon') then return new; end if;
  if new.game_id is distinct from old.game_id then
    raise exception using errcode = '42501', message = 'A folder cannot move to another game';
  end if;
  if (new.read_permissions, new.edit_permissions, new.author_id, new.is_root_player_folder)
      is distinct from (old.read_permissions, old.edit_permissions, old.author_id, old.is_root_player_folder)
    and not public.note_permission_allows_manage(old.game_id, old.author_id, old.edit_permissions, auth.uid()) then
    raise exception using errcode = '42501', message = 'Only the author can change who can see or edit this folder';
  end if;
  return new;
end $$;

create trigger note_folders_guard_update before update on public.note_folders
  for each row execute function public.note_folders_guard_update();

revoke all on function public.notes_guard_update() from public, anon, authenticated;
revoke all on function public.note_folders_guard_update() from public, anon, authenticated;

commit;
