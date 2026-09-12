-- ---------------------------------------------------------------------------
-- 1. games.world_id becomes RPC-only for client roles
--
-- public.world_role() derives world access from linked games: any member of a
-- game whose games.world_id points at a world gets 'guide' (when they are the
-- game's guide, or when the game is solo/co-op -- those types have no guide row
-- and every member counts as one) or 'player'. So *writing* games.world_id
-- grants world access to every member of that game.
--
-- Today nothing guards that column. The games UPDATE policy ("Allow updates for
-- users who are players in the game") lets any player of a game write any
-- column, and the INSERT policy ("Enable insert for authenticated users only")
-- is `with check (true)` with no column restrictions. Any authenticated user
-- could therefore insert a game carrying an arbitrary world_id, add themselves
-- as a player, and read that world -- including world_entry_gm_data and
-- 'only_guides' entries. Column privileges close that door while leaving the
-- write paths for every other column untouched.
--
-- Why privileges and not a policy or a trigger:
--   * RLS WITH CHECK cannot see OLD, so no policy can express "world_id is
--     unchanged" on UPDATE.
--   * A BEFORE UPDATE trigger would also fire on the games_world_id_fkey
--     ON DELETE SET NULL path when a world is deleted, and would have to carve
--     out an exception for it.
--   * Column privileges are checked against the *calling* role, so the FK
--     cascade (which runs as the system) and SECURITY DEFINER functions (which
--     run as the function owner) are both unaffected.
--
-- IMPORTANT -- why this is a table-level revoke plus a column-level re-grant,
-- rather than `revoke insert (world_id) ... `: in PostgreSQL the effective
-- privilege on a column is the UNION of the column-level and the table-level
-- privilege. The 2024-12-18 baseline granted table-level INSERT and UPDATE on
-- public.games to both anon and authenticated, so revoking only the column
-- privilege would have been a silent no-op and the hole would have stayed open.
-- The table-level grant has to go first; the remaining columns are then granted
-- back individually.
--
-- MAINTENANCE: authenticated now holds column-level INSERT/UPDATE on games.
-- A future `alter table public.games add column ...` will NOT be writable by
-- clients until it is added to the grants below. That failure mode is safe
-- (deny by default) but it is silent until someone tries to write the column.
--
-- PARTIAL FIX: this only closes the world_id escalation. The underlying games
-- policies still let any *player* of a game rewrite every other column on it
-- (name, game_type, rulesets, playset, ...). That is a separate defect and is
-- tracked separately.
-- ---------------------------------------------------------------------------

-- anon has no INSERT/UPDATE policy on games at all, so it loses nothing here
-- and gets no column-level grants back.
revoke insert, update on table "public"."games" from "anon";
revoke insert, update on table "public"."games" from "authenticated";

-- Every current column of public.games except world_id.
grant insert (
    "id",
    "name",
    "game_type",
    "condition_meter_values",
    "special_track_values",
    "rulesets",
    "expansions",
    "color_scheme",
    "created_at",
    "playset"
) on table "public"."games" to "authenticated";

grant update (
    "id",
    "name",
    "game_type",
    "condition_meter_values",
    "special_track_values",
    "rulesets",
    "expansions",
    "color_scheme",
    "created_at",
    "playset"
) on table "public"."games" to "authenticated";

-- service_role keeps its untouched table-level grants from the baseline.


-- ---------------------------------------------------------------------------
-- 2. link_game_to_world()
--
-- The only supported way for a client to set games.world_id. SECURITY DEFINER
-- so it can write the column the calling role no longer holds, modelled on
-- public.create_world().
--
-- Two independent authorisation checks, because linking sits across two
-- objects:
--
--   Game side -- the caller must be a guide of the game. This is checked
--   directly against game_players + games rather than through world_role(),
--   for two reasons: world_role() answers a different question (access to a
--   *world*), and the game being linked usually has no world yet, so
--   world_role() has nothing to derive from. The rule mirrors the canonical
--   expression inside world_role(): an explicit 'guide' game_players row, OR
--   membership in a solo/co-op game (those game types store no guide row and
--   the app treats every member as a guide -- see GamePermission in
--   src/stores/game.store.ts).
--
--   World side -- the caller must hold 'owner' or 'editor' on the target
--   world. Every other world power acts *within* the world's existing
--   audience; linking is the one operation that *adds* an audience, so it
--   requires explicit world rights and must never be satisfied by rights the
--   caller derived from a game. That is exactly what makes this check safe:
--   world_role() only ever returns 'owner'/'editor' from an explicit
--   world_players row, never from game derivation, so a game-derived guide
--   cannot use one link to bootstrap another.
--
-- The world-existence check is deliberately last. world_role() already returns
-- 'none' for an unknown world id, so the owner/editor check above rejects a
-- bogus id first; running the existence probe afterwards keeps it from telling
-- a non-member whether a given world id exists.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.link_game_to_world(
    p_game_id uuid,
    p_world_id uuid
)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
    v_uid uuid := auth.uid();
    v_is_game_guide boolean;
    v_world_role text;
begin
    if v_uid is null then
        raise exception 'Must be authenticated to link a game to a world';
    end if;

    -- Game side: guide of the game, mirroring world_role()'s solo/co-op rule.
    select exists (
        select 1
        from public.game_players gp
        join public.games g on g.id = gp.game_id
        where gp.game_id = p_game_id
          and gp.user_id = v_uid
          and (
              gp.role::text = 'guide'
              or g.game_type::text in ('solo', 'co-op')
          )
    ) into v_is_game_guide;

    if not v_is_game_guide then
        raise exception 'Must be a guide of the game to link it to a world';
    end if;

    -- World side: explicit owner/editor only -- never a game-derived role.
    v_world_role := public.world_role(p_world_id, v_uid);

    if v_world_role not in ('owner', 'editor') then
        raise exception 'Must be an owner or editor of the world to link a game to it';
    end if;

    if not exists (select 1 from public.worlds w where w.id = p_world_id) then
        raise exception 'World not found';
    end if;

    update public.games
       set world_id = p_world_id
     where id = p_game_id;

    -- SEAM: a later task computes which of the world's oracle bindings resolve
    -- differently once this game is attached, and returns them here so the UI
    -- can preview the change before/after linking. No bindings exist yet, so
    -- this is always the empty list today -- the shape is what is being fixed,
    -- not the content.
    return jsonb_build_object('divergences', '[]'::jsonb);
end;
$function$;


-- ---------------------------------------------------------------------------
-- 3. unlink_game_from_world()
--
-- The mirror of the above, and deliberately cheaper to authorise: unlinking
-- *removes* an audience from the world rather than adding one, so it needs no
-- rights on the world -- only the same game-side guide check. Requiring world
-- owner/editor here would strand a game whose guide has no world rights.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.unlink_game_from_world(
    p_game_id uuid
)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
    v_uid uuid := auth.uid();
    v_is_game_guide boolean;
begin
    if v_uid is null then
        raise exception 'Must be authenticated to unlink a game from a world';
    end if;

    select exists (
        select 1
        from public.game_players gp
        join public.games g on g.id = gp.game_id
        where gp.game_id = p_game_id
          and gp.user_id = v_uid
          and (
              gp.role::text = 'guide'
              or g.game_type::text in ('solo', 'co-op')
          )
    ) into v_is_game_guide;

    if not v_is_game_guide then
        raise exception 'Must be a guide of the game to unlink it from a world';
    end if;

    update public.games
       set world_id = null
     where id = p_game_id;
end;
$function$;


-- ---------------------------------------------------------------------------
-- 4. Grants for both functions
--
-- EXECUTE is granted to PUBLIC by default, which would leave these SECURITY
-- DEFINER functions reachable by anon. Same revoke-then-grant shape as
-- create_world() and world_role().
-- ---------------------------------------------------------------------------

revoke execute on function public.link_game_to_world(uuid, uuid) from public;
revoke execute on function public.link_game_to_world(uuid, uuid) from anon;
grant execute on function public.link_game_to_world(uuid, uuid) to authenticated;
grant execute on function public.link_game_to_world(uuid, uuid) to service_role;

revoke execute on function public.unlink_game_from_world(uuid) from public;
revoke execute on function public.unlink_game_from_world(uuid) from anon;
grant execute on function public.unlink_game_from_world(uuid) to authenticated;
grant execute on function public.unlink_game_from_world(uuid) to service_role;


-- ---------------------------------------------------------------------------
-- 5. Guides may add and edit world schema (categories + field definitions)
--
-- world_categories and world_field_definitions gated insert/update/delete on
-- world_role() in ('owner','editor'). In a co-op game every member derives
-- 'guide' and there is no hierarchy by construction, so it is arbitrary that
-- only whoever happened to click "create world" can add a category -- the rest
-- of the table hits a wall on the most ordinary shared-worldbuilding action.
--
-- Widening insert/update is not a new class of privilege: a derived guide can
-- already create, edit and delete world *entries* and read/write GM-only data.
-- Adding a category or a field definition is additive and reversible.
--
-- DELETE stays at ('owner','editor'). Deleting a category or a field
-- definition cascades into every entry's values across the whole world, and a
-- world may be linked to several games -- so a guide derived from one game
-- could destroy content belonging to another game's players. Destructive,
-- cross-audience, irreversible: that stays with explicit world rights.
--
-- The policies are renamed as well as rewritten; a policy called "owners and
-- editors" that in fact admits guides is a documentation bug waiting to
-- mislead the next reader.
-- ---------------------------------------------------------------------------

-- ---- world_categories -----------------------------------------------------

drop policy "World owners and editors can insert world_categories" on "public"."world_categories";

create policy "World guides and above can insert world_categories"
on "public"."world_categories"
as permissive
for insert
to authenticated
with check (
    public.world_role(world_categories.world_id, ( select auth.uid() )) in ('owner', 'editor', 'guide')
);

drop policy "World owners and editors can update world_categories" on "public"."world_categories";

create policy "World guides and above can update world_categories"
on "public"."world_categories"
as permissive
for update
to authenticated
using (
    public.world_role(world_categories.world_id, ( select auth.uid() )) in ('owner', 'editor', 'guide')
)
with check (
    public.world_role(world_categories.world_id, ( select auth.uid() )) in ('owner', 'editor', 'guide')
);

-- "World owners and editors can delete world_categories" is intentionally
-- left as-is (owner/editor only).

-- ---- world_field_definitions ----------------------------------------------

drop policy "World owners and editors can insert world_field_definitions" on "public"."world_field_definitions";

create policy "World guides and above can insert world_field_definitions"
on "public"."world_field_definitions"
as permissive
for insert
to authenticated
with check (
    public.world_role(world_field_definitions.world_id, ( select auth.uid() )) in ('owner', 'editor', 'guide')
);

drop policy "World owners and editors can update world_field_definitions" on "public"."world_field_definitions";

create policy "World guides and above can update world_field_definitions"
on "public"."world_field_definitions"
as permissive
for update
to authenticated
using (
    public.world_role(world_field_definitions.world_id, ( select auth.uid() )) in ('owner', 'editor', 'guide')
)
with check (
    public.world_role(world_field_definitions.world_id, ( select auth.uid() )) in ('owner', 'editor', 'guide')
);

-- "World owners and editors can delete world_field_definitions" is
-- intentionally left as-is (owner/editor only).
