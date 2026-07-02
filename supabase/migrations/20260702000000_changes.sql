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
