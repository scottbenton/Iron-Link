-- =============================================================================
-- Derive world_id from the parent row instead of trusting the client
--
-- world_field_definitions.world_id and world_entry_field_values.world_id are
-- denormalized so the RLS policies can call world_role() without a join. But
-- nothing tied either column to the row's actual parent, and every policy
-- trusted whatever the client sent -- so a caller could name a world they
-- happen to own and satisfy the check while writing into someone else's
-- category or entry.
--
-- Two concrete consequences, both reproduced before this migration:
--
--   1. A plain player could plant a gm_only value row on an entry they can
--      edit, passing world_id for a world of their own (obtained by simply
--      calling create_world). The gm_only trigger set the flag as designed,
--      but the guard then evaluated world_role() against *their* world, where
--      they are owner. The row lands in the victim entry's
--      (entry_id, field_definition_id) slot, invisible to that world's guides,
--      who then cannot select, update or delete it -- and cannot insert over
--      it either, because the primary key is taken.
--   2. Anyone holding a category id -- readable by any member, down to a
--      viewer -- could inject a field definition into that category while
--      naming their own world, squatting the unique (category_id, key) index
--      with a row the victim world's owner cannot see or remove.
--
-- Neither leaks data: the victim's writes are refused rather than silently
-- redirected. Both are integrity/denial-of-service.
--
-- The fix is the one already used for gm_only: derive the value in a BEFORE
-- trigger rather than accepting it. RLS WITH CHECK runs after BEFORE ROW
-- triggers, so the policies now evaluate the derived world, not the sent one.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. world_field_definitions.world_id follows its category
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.world_field_definition_derive_world()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
    v_world_id uuid;
begin
    select wc.world_id into v_world_id
    from public.world_categories wc
    where wc.id = new.category_id;

    if v_world_id is null then
        raise exception 'Unknown world category %', new.category_id;
    end if;

    new.world_id := v_world_id;
    return new;
end;
$function$;

CREATE TRIGGER world_field_definitions_derive_world
    BEFORE INSERT OR UPDATE ON public.world_field_definitions
    FOR EACH ROW EXECUTE FUNCTION public.world_field_definition_derive_world();


-- ---------------------------------------------------------------------------
-- 2. world_entry_field_values.world_id follows its entry
--
-- Folded into the gm_only trigger: both derive from a parent, and doing them
-- in one function keeps a single BEFORE trigger on the hot write path.
-- The definition is additionally required to belong to the entry's world, so a
-- value cannot splice a definition from one world onto an entry in another.
-- ---------------------------------------------------------------------------

DROP TRIGGER world_entry_field_values_sync_gm_only
    ON public.world_entry_field_values;
DROP FUNCTION public.world_entry_field_value_sync_gm_only();

CREATE OR REPLACE FUNCTION public.world_entry_field_value_derive_parents()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
    v_entry_world_id uuid;
    v_definition_world_id uuid;
    v_gm_only boolean;
begin
    select we.world_id into v_entry_world_id
    from public.world_entries we
    where we.id = new.entry_id;

    if v_entry_world_id is null then
        raise exception 'Unknown world entry %', new.entry_id;
    end if;

    select fd.world_id, fd.gm_only into v_definition_world_id, v_gm_only
    from public.world_field_definitions fd
    where fd.id = new.field_definition_id;

    if v_definition_world_id is null then
        raise exception 'Unknown world field definition %', new.field_definition_id;
    end if;

    if v_definition_world_id <> v_entry_world_id then
        raise exception
            'World field definition % belongs to world %, not the entry''s world %',
            new.field_definition_id, v_definition_world_id, v_entry_world_id;
    end if;

    new.world_id := v_entry_world_id;
    new.gm_only  := v_gm_only;
    return new;
end;
$function$;

CREATE TRIGGER world_entry_field_values_derive_parents
    BEFORE INSERT OR UPDATE ON public.world_entry_field_values
    FOR EACH ROW EXECUTE FUNCTION public.world_entry_field_value_derive_parents();


-- ---------------------------------------------------------------------------
-- 3. world_entries.category_id must belong to the entry's world
--
-- Same class, lesser severity: the entry insert policy checks
-- world_role(NEW.world_id) but never that category_id lives in that world, so
-- an entry could point at a foreign category. That one is not cross-tenant --
-- the entry stays in the author's own world, where only its own members can
-- read it -- but it produces entries whose category nobody in the world can
-- resolve. Reject it rather than leave the inconsistency reachable.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.world_entry_check_category_world()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
    v_category_world_id uuid;
begin
    select wc.world_id into v_category_world_id
    from public.world_categories wc
    where wc.id = new.category_id;

    if v_category_world_id is null then
        raise exception 'Unknown world category %', new.category_id;
    end if;

    if v_category_world_id <> new.world_id then
        raise exception 'World category % belongs to world %, not %',
            new.category_id, v_category_world_id, new.world_id;
    end if;

    return new;
end;
$function$;

CREATE TRIGGER world_entries_check_category_world
    BEFORE INSERT OR UPDATE ON public.world_entries
    FOR EACH ROW EXECUTE FUNCTION public.world_entry_check_category_world();
