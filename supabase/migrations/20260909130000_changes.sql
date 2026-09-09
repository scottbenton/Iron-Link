-- =============================================================================
-- Bring the characters and note_images storage config into version control
--
-- Until now the only migrations that touched storage were the worlds ones, so
-- these two buckets and every policy governing them existed purely as manual
-- dashboard state. Consequences: `supabase db reset` produced a database where
-- portrait and note-image uploads silently failed until someone recreated them
-- by hand, a fresh environment could not be stood up from this repo at all, and
-- a policy edited in the dashboard left no trace in review.
--
-- The definitions below are transcribed from the live project.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Buckets
--
-- `on conflict do nothing` so this documents the existing buckets rather than
-- rewriting settings that may since have been tuned in the dashboard.
-- Both are public because StorageRepository.getImageUrl() serves every bucket
-- through getPublicUrl().
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
    ('characters',  'characters',  true, 5242880, array['image/*']),
    ('note_images', 'note_images', true, null,    null)
on conflict (id) do nothing;


-- ---------------------------------------------------------------------------
-- 2. Drop whatever is already there for these buckets
--
-- The live policies were created through the dashboard, so their names are not
-- knowable from this repo. Match them by what they act on instead, then create
-- the canonical set below. This is what makes the migration idempotent and lets
-- the deployed project converge on the versioned definitions.
-- ---------------------------------------------------------------------------

do $migration$
declare
    v_policy record;
begin
    for v_policy in
        select policyname
        from pg_policies
        where schemaname = 'storage'
          and tablename = 'objects'
          and (coalesce(qual, '') || coalesce(with_check, ''))
              like any (array[
                  $p$%'characters'::text%$p$,
                  $p$%'note_images'::text%$p$
              ])
    loop
        execute format('drop policy %I on storage.objects', v_policy.policyname);
    end loop;
end
$migration$;


-- ---------------------------------------------------------------------------
-- 3. characters: a user may write under the folder of a character they own
--
-- Path convention is <characterId>/<filename>.
--
-- `objects.name` must stay qualified: public.characters has its own `name`
-- column, so a bare `name` inside the EXISTS would silently resolve to the
-- character's name instead of the storage object's path.
--
-- No SELECT policy, matching the live project: the bucket is public, so reads
-- go through the public URL rather than RLS.
-- ---------------------------------------------------------------------------

create policy "Character owners can upload character images"
on storage.objects
as permissive
for insert
to authenticated
with check (
    bucket_id = 'characters'::text
    and exists (
        select 1 from public.characters
        where characters.uid = auth.uid()
          and (storage.foldername(objects.name))[1] = characters.id::text
    )
);

-- USING doubles as WITH CHECK when the latter is omitted, matching the live
-- policy, which defines only USING.
create policy "Character owners can update character images"
on storage.objects
as permissive
for update
to authenticated
using (
    bucket_id = 'characters'::text
    and exists (
        select 1 from public.characters
        where characters.uid = auth.uid()
          and (storage.foldername(objects.name))[1] = characters.id::text
    )
);

create policy "Character owners can delete character images"
on storage.objects
as permissive
for delete
to authenticated
using (
    bucket_id = 'characters'::text
    and exists (
        select 1 from public.characters
        where characters.uid = auth.uid()
          and (storage.foldername(objects.name))[1] = characters.id::text
    )
);


-- ---------------------------------------------------------------------------
-- 4. note_images: any player of the note's game may write under its folder
--
-- Path convention is <noteId>/<filename>. Note that this is membership-based
-- and deliberately does not consult the note's own read/edit permissions.
-- ---------------------------------------------------------------------------

create policy "Game players can upload note images"
on storage.objects
as permissive
for insert
to authenticated
with check (
    bucket_id = 'note_images'::text
    and exists (
        select 1 from public.game_players
        join public.notes on game_players.game_id = notes.game_id
        where game_players.user_id = auth.uid()
          and (storage.foldername(objects.name))[1] = notes.id::text
    )
);

create policy "Game players can update note images"
on storage.objects
as permissive
for update
to authenticated
using (
    bucket_id = 'note_images'::text
    and exists (
        select 1 from public.game_players
        join public.notes on game_players.game_id = notes.game_id
        where game_players.user_id = auth.uid()
          and (storage.foldername(objects.name))[1] = notes.id::text
    )
);

create policy "Game players can delete note images"
on storage.objects
as permissive
for delete
to authenticated
using (
    bucket_id = 'note_images'::text
    and exists (
        select 1 from public.game_players
        join public.notes on game_players.game_id = notes.game_id
        where game_players.user_id = auth.uid()
          and (storage.foldername(objects.name))[1] = notes.id::text
    )
);
