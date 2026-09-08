-- ---------------------------------------------------------------------------
-- create_world() helper function
--
-- The world_players insert policy is owner-only, but a world's creator has no
-- role until their owner row exists ("world_role() returns 'none'"), so the
-- initial owner row can never be inserted under RLS. This SECURITY DEFINER
-- function creates the world and its owner membership row atomically instead
-- of loosening the policy.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.create_world(
    p_name text,
    p_description text default null,
    p_setting_key text default null
)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
    v_uid uuid := auth.uid();
    v_world_id uuid;
begin
    if v_uid is null then
        raise exception 'Must be authenticated to create a world';
    end if;

    insert into public.worlds (name, description, setting_key, created_by)
    values (p_name, p_description, p_setting_key, v_uid)
    returning id into v_world_id;

    insert into public.world_players (world_id, user_id, role)
    values (v_world_id, v_uid, 'owner');

    return v_world_id;
end;
$function$;

revoke execute on function public.create_world(text, text, text) from public;
revoke execute on function public.create_world(text, text, text) from anon;
grant execute on function public.create_world(text, text, text) to authenticated;
grant execute on function public.create_world(text, text, text) to service_role;


-- ---------------------------------------------------------------------------
-- Exclude explicit 'viewer' members from world_entries writes
--
-- The original insert policy and the 'all_players' edit branch accepted any
-- world_players row, so an explicitly-invited read-only viewer could create
-- and edit entries. Viewers are read-only (the storage write policies already
-- exclude them); require a writing role instead of bare membership.
-- ---------------------------------------------------------------------------

drop policy "World members can insert world_entries" on "public"."world_entries";

create policy "World members can insert world_entries"
on "public"."world_entries"
as permissive
for insert
to authenticated
with check (
    world_entries.author_id = ( select auth.uid() )
    and public.world_role(world_entries.world_id, ( select auth.uid() ))
        in ('owner', 'editor', 'guide', 'player')
);

drop policy "World entries are writable per edit_permissions" on "public"."world_entries";

create policy "World entries are writable per edit_permissions"
on "public"."world_entries"
as permissive
for update
to authenticated
using (
    case world_entries.edit_permissions
        when 'all_players' then (
            public.world_role(world_entries.world_id, ( select auth.uid() ))
                in ('owner', 'editor', 'guide', 'player')
        )
        when 'guides_and_author' then (
            world_entries.author_id = ( select auth.uid() )
            or public.world_role(world_entries.world_id, ( select auth.uid() )) in ('owner', 'editor', 'guide')
        )
        when 'only_guides' then (
            public.world_role(world_entries.world_id, ( select auth.uid() )) in ('owner', 'editor', 'guide')
        )
        when 'only_author' then (
            world_entries.author_id = ( select auth.uid() )
        )
        else false
    end
)
with check (
    case world_entries.edit_permissions
        when 'all_players' then (
            public.world_role(world_entries.world_id, ( select auth.uid() ))
                in ('owner', 'editor', 'guide', 'player')
        )
        when 'guides_and_author' then (
            world_entries.author_id = ( select auth.uid() )
            or public.world_role(world_entries.world_id, ( select auth.uid() )) in ('owner', 'editor', 'guide')
        )
        when 'only_guides' then (
            public.world_role(world_entries.world_id, ( select auth.uid() )) in ('owner', 'editor', 'guide')
        )
        when 'only_author' then (
            world_entries.author_id = ( select auth.uid() )
        )
        else false
    end
);


-- ---------------------------------------------------------------------------
-- Fix infinite recursion in the worlds / world_players select policies
--
-- The world_players select policy referenced world_players in its own USING
-- clause, which Postgres rejects at query time (42P17), and the worlds select
-- policy hit the same recursion through its world_players subquery — every
-- read of either table failed. world_role() is SECURITY DEFINER, so its
-- internal membership lookups bypass RLS and cannot recurse.
-- ---------------------------------------------------------------------------

drop policy "World members and linked game players can read worlds" on "public"."worlds";

create policy "World members and linked game players can read worlds"
on "public"."worlds"
as permissive
for select
to authenticated
using (
    public.world_role(worlds.id, ( select auth.uid() )) <> 'none'
);

drop policy "World members can read world_players" on "public"."world_players";

create policy "World members can read world_players"
on "public"."world_players"
as permissive
for select
to authenticated
using (
    public.world_role(world_players.world_id, ( select auth.uid() )) <> 'none'
);


-- ---------------------------------------------------------------------------
-- world_role(): treat every member of a solo/co-op game as a guide
--
-- game_players.role is the enum player_role ('guide' | 'player'), and solo /
-- co-op games never store a 'guide' row -- the app grants guide permissions to
-- any member of those games (see GamePermission in src/stores/game.store.ts).
-- Deriving the world role from gp.role alone therefore locked the sole player
-- of a solo game out of world_entry_gm_data and 'only_guides' entries in a game
-- where they *are* the guide. Mirror the app's rule here instead.
--
-- The previous ELSE branch was unreachable (player_role has exactly two
-- values); the new CASE makes the real fallback explicit.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.world_role(p_world_id uuid, p_uid uuid)
 RETURNS text
 LANGUAGE sql
 STABLE
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
    SELECT coalesce(
        -- Explicit world membership takes precedence
        (SELECT wp.role
         FROM public.world_players wp
         WHERE wp.world_id = p_world_id
           AND wp.user_id  = p_uid
         LIMIT 1),
        -- Derive role from the best game_players role across linked games
        (SELECT
            CASE
                WHEN gp.role::text = 'guide' THEN 'guide'
                -- Solo and co-op games have no guide row; every member is one
                WHEN g.game_type::text IN ('solo', 'co-op') THEN 'guide'
                ELSE 'player'
            END
         FROM public.game_players gp
         JOIN public.games g ON g.id = gp.game_id
         WHERE g.world_id   = p_world_id
           AND gp.user_id   = p_uid
         ORDER BY
             -- guide-equivalent memberships outrank plain player memberships
             CASE
                 WHEN gp.role::text = 'guide'
                   OR g.game_type::text IN ('solo', 'co-op') THEN 0
                 ELSE 1
             END
         LIMIT 1),
        'none'
    );
$function$;


-- ---------------------------------------------------------------------------
-- world_role() was callable by anon
--
-- EXECUTE on a function is granted to PUBLIC by default, and the original
-- migration only added grants without revoking that. world_role() is SECURITY
-- DEFINER and takes an arbitrary p_uid, so an unauthenticated caller could
-- probe whether a given user belongs to a given world. create_world() above
-- already revokes correctly; match it.
-- ---------------------------------------------------------------------------

revoke execute on function public.world_role(uuid, uuid) from public;
revoke execute on function public.world_role(uuid, uuid) from anon;
grant execute on function public.world_role(uuid, uuid) to authenticated;
grant execute on function public.world_role(uuid, uuid) to service_role;


-- ---------------------------------------------------------------------------
-- Remove the direct-insert path on worlds
--
-- create_world() exists because a world inserted without its owner
-- world_players row is unreachable: world_role() reports 'none' for everyone,
-- so the row can never be read, updated, or deleted by anybody, and it never
-- appears in the creator's world list. Leaving the plain insert policy in place
-- just preserves a way to create that orphan. The RPC is the only door.
-- ---------------------------------------------------------------------------

drop policy "Authenticated users can create worlds" on "public"."worlds";


-- ---------------------------------------------------------------------------
-- Express membership through world_role() everywhere
--
-- The recursion fix converted the worlds / world_players read policies to
-- world_role() but left three policies on the old EXISTS-against-world_players
-- shape. Those are no longer recursive, but each one now costs a nested RLS
-- evaluation (the subquery runs world_players' own policy, which calls
-- world_role() anyway), and membership ends up expressed two different ways
-- across six tables. Use world_role() consistently.
-- ---------------------------------------------------------------------------

drop policy "World members can read world_categories" on "public"."world_categories";

create policy "World members can read world_categories"
on "public"."world_categories"
as permissive
for select
to authenticated
using (
    public.world_role(world_categories.world_id, ( select auth.uid() )) <> 'none'
);

drop policy "World entries are readable per read_permissions" on "public"."world_entries";

create policy "World entries are readable per read_permissions"
on "public"."world_entries"
as permissive
for select
to authenticated
using (
    case world_entries.read_permissions
        when 'public' then true
        when 'all_players' then (
            public.world_role(world_entries.world_id, ( select auth.uid() )) <> 'none'
        )
        when 'guides_and_author' then (
            world_entries.author_id = ( select auth.uid() )
            or public.world_role(world_entries.world_id, ( select auth.uid() )) in ('owner', 'editor', 'guide')
        )
        when 'only_guides' then (
            public.world_role(world_entries.world_id, ( select auth.uid() )) in ('owner', 'editor', 'guide')
        )
        when 'only_author' then (
            world_entries.author_id = ( select auth.uid() )
        )
        else false
    end
);

-- Bonds follow the entry: the world_entries subquery is already filtered by the
-- entry read policy above, so membership needs no second check here. This also
-- closes a leak -- the old membership-only check exposed bond rows for entries
-- the reader could not read (e.g. 'only_guides' entries).
drop policy "World members can read world_entry_bonds" on "public"."world_entry_bonds";

create policy "World members can read world_entry_bonds"
on "public"."world_entry_bonds"
as permissive
for select
to authenticated
using (
    exists (
        select 1 from public.world_entries we
        where we.id = world_entry_bonds.entry_id
    )
);
