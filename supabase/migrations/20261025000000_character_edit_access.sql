-- Character edit access: an owner chooses who else may fill in their sheet.
--
-- characters.edit_permissions is 'only_owner' (the default, for new and
-- existing characters), 'guides_and_owner' or 'all_players'. 'all_players'
-- includes Guides. In solo and co-op games every member counts as a Guide,
-- matching world_role() and the app. Viewers and people outside the game never
-- edit.
--
-- Editors may change everything on the sheet: the characters row, its assets,
-- its portrait files and its world entry bonds. Only the owner may delete the
-- character, change edit_permissions, give the character away (uid) or move it
-- to another game (game_id).
--
-- This replaces "User or guide can update character", which let any guide of a
-- guided game update any character in it. The app never used that, so under
-- 'only_owner' a Guide now has no write access to the sheet.
begin;

create type public.character_edit_permissions as enum (
  'only_owner', 'guides_and_owner', 'all_players'
);

alter table public.characters
  add column edit_permissions public.character_edit_permissions not null default 'only_owner';


-- ---------------------------------------------------------------------------
-- can_edit_character(): the one answer to "may this user edit this sheet"
--
-- Every character-sheet write policy below goes through this function, so the
-- rule lives in one place. It reads the character as committed before the
-- current statement, so a WITH CHECK that calls it sees the row as it was, not
-- as the update leaves it; the trigger further down covers the columns that
-- matter for that.
--
-- SECURITY DEFINER so policies on other tables (assets, storage.objects,
-- world_entry_bonds) can read characters and game_players without depending on
-- those tables' own policies.
-- ---------------------------------------------------------------------------

create function public.can_edit_character(p_character_id uuid, p_uid uuid)
 returns boolean
 language sql
 stable
 security definer
 set search_path to ''
as $function$
    select p_uid is not null and exists (
        select 1
        from public.characters c
        where c.id = p_character_id
          and (
              c.uid = p_uid
              or (
                  c.edit_permissions <> 'only_owner'
                  and exists (
                      select 1
                      from public.game_players gp
                      join public.games g on g.id = gp.game_id
                      where gp.game_id = c.game_id
                        and gp.user_id = p_uid
                        and (
                            c.edit_permissions = 'all_players'
                            or gp.role::text = 'guide'
                            -- Solo and co-op games have no guide row; every
                            -- member is one.
                            or g.game_type::text in ('solo', 'co-op')
                        )
                  )
              )
          )
    );
$function$;

-- Same revoke-then-grant shape as world_role(): EXECUTE goes to PUBLIC by
-- default, and anon has no character write policy that needs it.
revoke execute on function public.can_edit_character(uuid, uuid) from public;
revoke execute on function public.can_edit_character(uuid, uuid) from anon;
grant execute on function public.can_edit_character(uuid, uuid) to authenticated;
grant execute on function public.can_edit_character(uuid, uuid) to service_role;


-- ---------------------------------------------------------------------------
-- characters: editors update, owner-only columns stay with the owner
--
-- RLS cannot compare OLD and NEW, so a BEFORE UPDATE trigger guards the
-- columns only the owner may change. A non-owner may not change uid, game_id,
-- edit_permissions or id; an owner may change anything except uid, which keeps
-- the old policy's rule that an owner cannot hand a character to someone else.
--
-- The trigger acts only for requests that carry a user (auth.uid() is set), so
-- service_role and maintenance work are unaffected. Because it keys on
-- auth.uid() rather than the role, it would also refuse a client's games.id or
-- users.id change that cascades onto characters it does not own; those tables'
-- own policies already reject such key changes.
-- ---------------------------------------------------------------------------

create function public.character_guard_owner_columns()
 returns trigger
 language plpgsql
 set search_path to ''
as $function$
declare
    v_uid uuid := auth.uid();
begin
    if v_uid is null then
        return new;
    end if;

    if old.uid = v_uid then
        if new.uid is distinct from old.uid then
            raise exception 'A character cannot be given to another user'
              using errcode = '42501';
        end if;
    elsif new.uid is distinct from old.uid
       or new.game_id is distinct from old.game_id
       or new.edit_permissions is distinct from old.edit_permissions
       or new.id is distinct from old.id then
        raise exception 'Only the owner can change who owns or edits a character, or move it to another game'
          using errcode = '42501';
    end if;

    return new;
end;
$function$;

revoke all on function public.character_guard_owner_columns() from public, anon, authenticated;

create trigger characters_guard_owner_columns before update on public.characters
  for each row execute function public.character_guard_owner_columns();

drop policy "User or guide can update character" on "public"."characters";

-- USING picks the rows the caller may edit. WITH CHECK keeps the owner's new
-- uid tied to the caller; for everyone else the trigger has already pinned
-- uid and id, so the lookup in can_edit_character() finds the same character.
create policy "Character editors can update characters"
on "public"."characters"
as permissive
for update
to authenticated
using (
    public.can_edit_character(characters.id, ( select auth.uid() ))
)
with check (
    characters.uid = ( select auth.uid() )
    or public.can_edit_character(characters.id, ( select auth.uid() ))
);


-- ---------------------------------------------------------------------------
-- assets: character assets follow the sheet
--
-- The game asset policies are unchanged.
-- ---------------------------------------------------------------------------

drop policy "Allow character asset deletion" on "public"."assets";
drop policy "Allow character asset insertion" on "public"."assets";
drop policy "Allow character asset modification" on "public"."assets";

create policy "Character editors can delete character assets"
on "public"."assets"
as permissive
for delete
to authenticated
using (
    assets.character_id is not null
    and public.can_edit_character(assets.character_id, ( select auth.uid() ))
);

create policy "Character editors can insert character assets"
on "public"."assets"
as permissive
for insert
to authenticated
with check (
    assets.character_id is not null
    and public.can_edit_character(assets.character_id, ( select auth.uid() ))
);

create policy "Character editors can update character assets"
on "public"."assets"
as permissive
for update
to authenticated
using (
    assets.character_id is not null
    and public.can_edit_character(assets.character_id, ( select auth.uid() ))
)
with check (
    assets.character_id is not null
    and public.can_edit_character(assets.character_id, ( select auth.uid() ))
);

-- The shape checks were created permissive, and permissive policies are ORed:
-- any signed-in user could insert or update any asset with a valid shape, on
-- any character or game, whatever the policies above said. Restrictive makes
-- them a requirement on top of those policies, which is what their names
-- promise. The expressions are unchanged.
drop policy "Prevent invalid asset insertion" on "public"."assets";
drop policy "Prevent invalid asset modification" on "public"."assets";

create policy "Prevent invalid asset insertion"
on "public"."assets"
as restrictive
for insert
to authenticated
with check (
    (assets.game_id is not null and assets.character_id is null)
    or (assets.game_id is null and assets.character_id is not null)
);

create policy "Prevent invalid asset modification"
on "public"."assets"
as restrictive
for update
to authenticated
using (
    (assets.game_id is not null and assets.character_id is null)
    or (assets.game_id is null and assets.character_id is not null)
)
with check (
    (assets.game_id is not null and assets.character_id is null)
    or (assets.game_id is null and assets.character_id is not null)
);


-- ---------------------------------------------------------------------------
-- storage.objects: character portraits follow the sheet
--
-- Path convention is <characterId>/<filename>. `objects.name` stays qualified
-- because public.characters has its own `name` column. No SELECT policy: the
-- bucket is public and reads go through the public URL.
-- ---------------------------------------------------------------------------

drop policy "Character owners can upload character images" on storage.objects;
drop policy "Character owners can update character images" on storage.objects;
drop policy "Character owners can delete character images" on storage.objects;

create policy "Character editors can upload character images"
on storage.objects
as permissive
for insert
to authenticated
with check (
    bucket_id = 'characters'::text
    and exists (
        select 1 from public.characters
        where characters.id::text = (storage.foldername(objects.name))[1]
          and public.can_edit_character(characters.id, ( select auth.uid() ))
    )
);

-- USING doubles as WITH CHECK, as in the policy this replaces.
create policy "Character editors can update character images"
on storage.objects
as permissive
for update
to authenticated
using (
    bucket_id = 'characters'::text
    and exists (
        select 1 from public.characters
        where characters.id::text = (storage.foldername(objects.name))[1]
          and public.can_edit_character(characters.id, ( select auth.uid() ))
    )
);

create policy "Character editors can delete character images"
on storage.objects
as permissive
for delete
to authenticated
using (
    bucket_id = 'characters'::text
    and exists (
        select 1 from public.characters
        where characters.id::text = (storage.foldername(objects.name))[1]
          and public.can_edit_character(characters.id, ( select auth.uid() ))
    )
);


-- ---------------------------------------------------------------------------
-- world_entry_bonds: a character's bonds follow the sheet
-- ---------------------------------------------------------------------------

drop policy "Character owners can insert world_entry_bonds" on "public"."world_entry_bonds";
drop policy "Character owners can delete world_entry_bonds" on "public"."world_entry_bonds";

create policy "Character editors can insert world_entry_bonds"
on "public"."world_entry_bonds"
as permissive
for insert
to authenticated
with check (
    public.can_edit_character(world_entry_bonds.character_id, ( select auth.uid() ))
);

create policy "Character editors can delete world_entry_bonds"
on "public"."world_entry_bonds"
as permissive
for delete
to authenticated
using (
    public.can_edit_character(world_entry_bonds.character_id, ( select auth.uid() ))
);

commit;
