-- Guide-only secrets (#253).
--
-- A secret can never sit inside a document a player can read: row-level
-- security works per row, and a note's row carries its whole Yjs state. So a
-- note, entry Notes or world Notes that has secrets gets a companion row here,
-- holding one Yjs document with every secret block of that surface and each
-- block's anchor into the shared document (spike #252). The shared document
-- holds nothing about secrets.
--
-- Only Guides who can read the surface itself read or write its secrets:
-- - a game note: readable by them (note_readable) and they are a Guide of its
--   game (the guide role, or any member of a solo or co-op game);
-- - an entry's Notes: readable by them (world_entry_readable) and their world
--   role is owner, editor or guide;
-- - a world's Notes: their world role is owner, editor or guide.
--
-- The rule reads the game or world from the surface each time rather than
-- from a stored copy, so a row cannot be pointed at a game where the writer is
-- a Guide while naming another game's note. Clients may only set which
-- surface a row is for when inserting it, and only change its content after.
--
-- Saves merge like any rich text (#251): read, merge, then update only while
-- updated_at is unchanged. Two Guides creating the row at once both insert
-- with on conflict do nothing, so they share one row.
--
-- Images inside secrets go in the private guide_images bucket, read through
-- signed URLs under the same rule, at <kind>/<surface id>/<file name> where
-- kind is notes, world_entries or worlds.
begin;

create table public.rich_text_secrets (
  id uuid primary key default gen_random_uuid(),
  note_id uuid unique references public.notes(id) on delete cascade,
  world_entry_id uuid unique references public.world_entries(id) on delete cascade,
  -- A world's own Notes.
  world_id uuid unique references public.worlds(id) on delete cascade,
  content_bytes bytea,
  -- Plain text of every block, for a Guide's search.
  content_text text not null default '',
  -- What the blocks mention, for Guide backlinks labelled Secret.
  mentioned_note_ids uuid[] not null default '{}',
  mentioned_entry_ids uuid[] not null default '{}',
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint rich_text_secrets_one_surface check (num_nonnulls(note_id, world_entry_id, world_id) = 1)
);

create index rich_text_secrets_mentioned_note_ids on public.rich_text_secrets
  using gin (mentioned_note_ids);
create index rich_text_secrets_mentioned_entry_ids on public.rich_text_secrets
  using gin (mentioned_entry_ids);

create trigger rich_text_secrets_set_updated_at before update on public.rich_text_secrets
  for each row execute function public.set_updated_at();

-- Whether a user may read and write the secrets of a surface. Exactly one of
-- the three ids is expected; anything else is refused.
create function public.rich_text_secrets_allowed(p_note_id uuid, p_world_entry_id uuid,
  p_world_id uuid, p_uid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select p_uid is not null and num_nonnulls(p_note_id, p_world_entry_id, p_world_id) = 1 and case
    when p_note_id is not null then exists (
      select 1 from public.notes n where n.id = p_note_id
        and public.is_game_guide(n.game_id, p_uid)
        and public.note_readable(n.id, p_uid))
    when p_world_entry_id is not null then exists (
      select 1 from public.world_entries e where e.id = p_world_entry_id
        and public.world_role(e.world_id, p_uid) in ('owner', 'editor', 'guide')
        and public.world_entry_readable(e.id, p_uid))
    else public.world_role(p_world_id, p_uid) in ('owner', 'editor', 'guide')
  end;
$$;

alter table public.rich_text_secrets enable row level security;

create policy "Guides can read secrets" on public.rich_text_secrets
  for select to authenticated using (
    public.rich_text_secrets_allowed(note_id, world_entry_id, world_id, (select auth.uid())));

create policy "Guides can add secrets" on public.rich_text_secrets
  for insert to authenticated with check (
    public.rich_text_secrets_allowed(note_id, world_entry_id, world_id, (select auth.uid())));

create policy "Guides can edit secrets" on public.rich_text_secrets
  for update to authenticated
  using (public.rich_text_secrets_allowed(note_id, world_entry_id, world_id, (select auth.uid())))
  with check (public.rich_text_secrets_allowed(note_id, world_entry_id, world_id, (select auth.uid())));

-- Rows go with their surface (on delete cascade); clients never delete them,
-- and a deleted block is marked inside the document so undo can restore it.
revoke all on public.rich_text_secrets from anon, authenticated;
grant select on public.rich_text_secrets to authenticated;
grant insert (note_id, world_entry_id, world_id, content_bytes, content_text,
  mentioned_note_ids, mentioned_entry_ids) on public.rich_text_secrets to authenticated;
grant update (content_bytes, content_text, mentioned_note_ids, mentioned_entry_ids)
  on public.rich_text_secrets to authenticated;
grant all on public.rich_text_secrets to service_role;

revoke execute on function public.rich_text_secrets_allowed(uuid, uuid, uuid, uuid) from public, anon;
grant execute on function public.rich_text_secrets_allowed(uuid, uuid, uuid, uuid) to authenticated, service_role;

-- Realtime applies the read policy per subscriber, so players never receive
-- these rows.
alter publication supabase_realtime add table public.rich_text_secrets;

-- Images inside secrets. The shared image buckets are public by URL, so a
-- secret's images get a private bucket of their own.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('guide_images', 'guide_images', false, 5242880, array['image/*'])
on conflict (id) do nothing;

-- Whether a user may read or write the object at p_name, which must be
-- <notes|world_entries|worlds>/<surface id>/<file name>.
create function public.guide_image_allowed(p_name text, p_uid uuid) returns boolean
language plpgsql stable security definer set search_path = '' as $$
declare
  v_parts text[] := string_to_array(p_name, '/');
  v_id uuid;
begin
  if array_length(v_parts, 1) <> 3 or v_parts[3] = ''
      or v_parts[2] !~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' then
    return false;
  end if;
  v_id := v_parts[2]::uuid;
  return case v_parts[1]
    when 'notes' then public.rich_text_secrets_allowed(v_id, null, null, p_uid)
    when 'world_entries' then public.rich_text_secrets_allowed(null, v_id, null, p_uid)
    when 'worlds' then public.rich_text_secrets_allowed(null, null, v_id, p_uid)
    else false
  end;
end $$;

revoke execute on function public.guide_image_allowed(text, uuid) from public, anon;
grant execute on function public.guide_image_allowed(text, uuid) to authenticated, service_role;

create policy "Guides can read guide images" on storage.objects
  for select to authenticated using (
    bucket_id = 'guide_images' and public.guide_image_allowed(objects.name, (select auth.uid())));

create policy "Guides can upload guide images" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'guide_images' and public.guide_image_allowed(objects.name, (select auth.uid())));

create policy "Guides can delete guide images" on storage.objects
  for delete to authenticated using (
    bucket_id = 'guide_images' and public.guide_image_allowed(objects.name, (select auth.uid())));

commit;
