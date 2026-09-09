-- =============================================================================
-- Field definitions and field values become tables
--
-- The original design stored field definitions as a JSONB array on
-- world_categories and field values as a JSONB object on world_entries, with a
-- parallel world_entry_gm_data row holding the GM-only half. That could not
-- carry its own weight:
--
--   * gmOnly was not a security boundary. The value still lived in
--     world_entries.fields, a column every reader of the entry can read, so
--     marking a field GM-only only hid it in the UI.
--   * Renaming a definition's key orphaned every existing value.
--   * Toggling gmOnly was an N-entry, cross-table, non-atomic migration.
--   * Values could not be joined or filtered, so listing or filtering entries
--     by a field value meant pulling every entry's whole blob client-side.
--
-- As rows, gmOnly is an ordinary row-level RLS predicate, values point at a
-- definition id so renames are free, and world_entry_gm_data disappears: GM
-- notes are just a gmOnly richText field definition.
--
-- Nothing consumes any of this yet (no UI reads it, no rows exist), so this
-- replaces the old shape outright rather than migrating data.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. world_field_definitions
-- ---------------------------------------------------------------------------

create table "public"."world_field_definitions" (
    "id"          uuid not null default gen_random_uuid(),
    "category_id" uuid not null,
    "world_id"    uuid not null,
    "key"         text not null,
    "label"       text not null,
    "type"        text not null,
    "binding"     jsonb,
    "gm_only"     boolean not null default false,
    "sort_order"  integer not null default 0,
    "created_at"  timestamp with time zone not null default now(),
    "updated_at"  timestamp with time zone not null default now()
);

alter table "public"."world_field_definitions" enable row level security;

CREATE UNIQUE INDEX world_field_definitions_pkey
    ON public.world_field_definitions USING btree (id);
alter table "public"."world_field_definitions"
    add constraint "world_field_definitions_pkey" PRIMARY KEY using index "world_field_definitions_pkey";

-- `key` is only an import/export handle now (values point at id), but it still
-- has to be unambiguous within a category for the IF importer to target.
CREATE UNIQUE INDEX world_field_definitions_category_id_key_idx
    ON public.world_field_definitions USING btree (category_id, key);

alter table "public"."world_field_definitions" add constraint "world_field_definitions_category_id_fkey"
    FOREIGN KEY (category_id) REFERENCES world_categories(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;
alter table "public"."world_field_definitions" validate constraint "world_field_definitions_category_id_fkey";

alter table "public"."world_field_definitions" add constraint "world_field_definitions_world_id_fkey"
    FOREIGN KEY (world_id) REFERENCES worlds(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;
alter table "public"."world_field_definitions" validate constraint "world_field_definitions_world_id_fkey";

alter table "public"."world_field_definitions" add constraint "world_field_definitions_type_check"
    check (type in ('text', 'richText', 'oracleText', 'tags', 'number'));

CREATE INDEX world_field_definitions_world_id_idx
    ON public.world_field_definitions USING btree (world_id);
CREATE INDEX world_field_definitions_category_id_idx
    ON public.world_field_definitions USING btree (category_id);

CREATE TRIGGER world_field_definitions_set_updated_at
    BEFORE UPDATE ON public.world_field_definitions
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ---------------------------------------------------------------------------
-- 2. world_entry_field_values
--
-- `value` carries scalars/arrays/structs; `content` carries richText and
-- oracleText Yjs documents. Yjs bodies stay bytea rather than base64 inside
-- `value`: base64 inflates ~33%, adds a JSON parse to every autosave, breaks
-- reuse of the notes Tiptap/Yjs stack (which writes \x<hex>), and with replica
-- identity full would broadcast the whole document on every keystroke batch.
-- ---------------------------------------------------------------------------

create table "public"."world_entry_field_values" (
    "entry_id"            uuid not null,
    "field_definition_id" uuid not null,
    "world_id"            uuid not null,
    "gm_only"             boolean not null default false,
    "value"               jsonb,
    "content"             bytea,
    "created_at"          timestamp with time zone not null default now(),
    "updated_at"          timestamp with time zone not null default now()
);

alter table "public"."world_entry_field_values" enable row level security;

CREATE UNIQUE INDEX world_entry_field_values_pkey
    ON public.world_entry_field_values USING btree (entry_id, field_definition_id);
alter table "public"."world_entry_field_values"
    add constraint "world_entry_field_values_pkey" PRIMARY KEY using index "world_entry_field_values_pkey";

alter table "public"."world_entry_field_values" add constraint "world_entry_field_values_entry_id_fkey"
    FOREIGN KEY (entry_id) REFERENCES world_entries(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;
alter table "public"."world_entry_field_values" validate constraint "world_entry_field_values_entry_id_fkey";

alter table "public"."world_entry_field_values" add constraint "world_entry_field_values_field_definition_id_fkey"
    FOREIGN KEY (field_definition_id) REFERENCES world_field_definitions(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;
alter table "public"."world_entry_field_values" validate constraint "world_entry_field_values_field_definition_id_fkey";

alter table "public"."world_entry_field_values" add constraint "world_entry_field_values_world_id_fkey"
    FOREIGN KEY (world_id) REFERENCES worlds(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;
alter table "public"."world_entry_field_values" validate constraint "world_entry_field_values_world_id_fkey";

CREATE INDEX world_entry_field_values_world_id_idx
    ON public.world_entry_field_values USING btree (world_id);
CREATE INDEX world_entry_field_values_entry_id_idx
    ON public.world_entry_field_values USING btree (entry_id);
-- Drives the per-category subtitle subscription and subtitle list joins
CREATE INDEX world_entry_field_values_field_definition_id_idx
    ON public.world_entry_field_values USING btree (field_definition_id);

CREATE TRIGGER world_entry_field_values_set_updated_at
    BEFORE UPDATE ON public.world_entry_field_values
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ---------------------------------------------------------------------------
-- 3. gm_only is mirrored from the definition, never written by clients
--
-- Denormalizing it keeps the value read policy index-friendly (no per-row join
-- to the definition) and makes flipping a definition's gm_only a single atomic
-- statement instead of moving values across a table boundary. The trigger is
-- what makes the denormalized copy trustworthy: a client that sets gm_only
-- itself is simply overruled.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.world_entry_field_value_sync_gm_only()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
    select fd.gm_only into new.gm_only
    from public.world_field_definitions fd
    where fd.id = new.field_definition_id;

    if new.gm_only is null then
        raise exception 'Unknown world field definition %', new.field_definition_id;
    end if;

    return new;
end;
$function$;

CREATE TRIGGER world_entry_field_values_sync_gm_only
    BEFORE INSERT OR UPDATE ON public.world_entry_field_values
    FOR EACH ROW EXECUTE FUNCTION public.world_entry_field_value_sync_gm_only();

-- Keep existing value rows in step when a definition's gm_only flips.
CREATE OR REPLACE FUNCTION public.world_field_definition_propagate_gm_only()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
    if new.gm_only is distinct from old.gm_only then
        update public.world_entry_field_values
        set gm_only = new.gm_only
        where field_definition_id = new.id;
    end if;
    return new;
end;
$function$;

CREATE TRIGGER world_field_definitions_propagate_gm_only
    AFTER UPDATE ON public.world_field_definitions
    FOR EACH ROW EXECUTE FUNCTION public.world_field_definition_propagate_gm_only();


-- ---------------------------------------------------------------------------
-- 4. Reshape world_categories and world_entries
--
-- No data migration: nothing writes these columns yet.
-- ---------------------------------------------------------------------------

alter table "public"."world_categories" drop column "field_definitions";

alter table "public"."world_categories"
    add column "subtitle_field_definition_id" uuid null;

-- Set null rather than cascade: losing the subtitle field should blank the
-- setting, not delete the category.
alter table "public"."world_categories" add constraint "world_categories_subtitle_field_definition_id_fkey"
    FOREIGN KEY (subtitle_field_definition_id) REFERENCES world_field_definitions(id)
    ON UPDATE CASCADE ON DELETE SET NULL not valid;
alter table "public"."world_categories" validate constraint "world_categories_subtitle_field_definition_id_fkey";

alter table "public"."world_entries" drop column "fields";

-- One avatar image, not a gallery: extra images live in the entry's notes.
-- Resolution order is image_filename -> icon -> a client-side derived default
-- -> world_categories.icon.
alter table "public"."world_entries" drop column "image_filenames";
alter table "public"."world_entries" add column "image_filename" text null;

drop table "public"."world_entry_gm_data";


-- ---------------------------------------------------------------------------
-- 5. Grants
-- ---------------------------------------------------------------------------

grant delete, insert, references, select, trigger, truncate, update
    on table "public"."world_field_definitions" to "anon";
grant delete, insert, references, select, trigger, truncate, update
    on table "public"."world_field_definitions" to "authenticated";
grant delete, insert, references, select, trigger, truncate, update
    on table "public"."world_field_definitions" to "service_role";

grant delete, insert, references, select, trigger, truncate, update
    on table "public"."world_entry_field_values" to "anon";
grant delete, insert, references, select, trigger, truncate, update
    on table "public"."world_entry_field_values" to "authenticated";
grant delete, insert, references, select, trigger, truncate, update
    on table "public"."world_entry_field_values" to "service_role";


-- ---------------------------------------------------------------------------
-- 6. RLS: world_field_definitions
--
-- Definitions are the category's shape, so they follow the category's rules:
-- any member reads, owner/editor writes.
-- ---------------------------------------------------------------------------

create policy "World members can read world_field_definitions"
on "public"."world_field_definitions"
as permissive
for select
to authenticated
using (
    public.world_role(world_field_definitions.world_id, ( select auth.uid() )) <> 'none'
);

create policy "World owners and editors can insert world_field_definitions"
on "public"."world_field_definitions"
as permissive
for insert
to authenticated
with check (
    public.world_role(world_field_definitions.world_id, ( select auth.uid() )) in ('owner', 'editor')
);

create policy "World owners and editors can update world_field_definitions"
on "public"."world_field_definitions"
as permissive
for update
to authenticated
using (
    public.world_role(world_field_definitions.world_id, ( select auth.uid() )) in ('owner', 'editor')
)
with check (
    public.world_role(world_field_definitions.world_id, ( select auth.uid() )) in ('owner', 'editor')
);

create policy "World owners and editors can delete world_field_definitions"
on "public"."world_field_definitions"
as permissive
for delete
to authenticated
using (
    public.world_role(world_field_definitions.world_id, ( select auth.uid() )) in ('owner', 'editor')
);


-- ---------------------------------------------------------------------------
-- 7. RLS: world_entry_field_values
--
-- A value follows its entry. The world_entries subqueries below are themselves
-- filtered by the entry read/update policies, so read access to a value is
-- exactly read access to its entry, and write access is exactly the entry's
-- edit_permissions -- expressed once, in one place, rather than restated here.
-- The gm_only clause is the only thing layered on top.
-- ---------------------------------------------------------------------------

create policy "World entry field values follow their entry for reads"
on "public"."world_entry_field_values"
as permissive
for select
to authenticated
using (
    exists (
        select 1 from public.world_entries we
        where we.id = world_entry_field_values.entry_id
    )
    and (
        not world_entry_field_values.gm_only
        or public.world_role(world_entry_field_values.world_id, ( select auth.uid() ))
            in ('owner', 'editor', 'guide')
    )
);

-- `for update` on world_entries in the subquery evaluates the entry UPDATE
-- policy (its edit_permissions CASE) rather than the read policy, so a value
-- write requires the right to edit the entry it belongs to.
create policy "World entry field values follow their entry for inserts"
on "public"."world_entry_field_values"
as permissive
for insert
to authenticated
with check (
    exists (
        select 1 from public.world_entries we
        where we.id = world_entry_field_values.entry_id
        for update
    )
    and (
        not world_entry_field_values.gm_only
        or public.world_role(world_entry_field_values.world_id, ( select auth.uid() ))
            in ('owner', 'editor', 'guide')
    )
);

create policy "World entry field values follow their entry for updates"
on "public"."world_entry_field_values"
as permissive
for update
to authenticated
using (
    exists (
        select 1 from public.world_entries we
        where we.id = world_entry_field_values.entry_id
        for update
    )
    and (
        not world_entry_field_values.gm_only
        or public.world_role(world_entry_field_values.world_id, ( select auth.uid() ))
            in ('owner', 'editor', 'guide')
    )
)
with check (
    exists (
        select 1 from public.world_entries we
        where we.id = world_entry_field_values.entry_id
        for update
    )
    and (
        not world_entry_field_values.gm_only
        or public.world_role(world_entry_field_values.world_id, ( select auth.uid() ))
            in ('owner', 'editor', 'guide')
    )
);

create policy "World entry field values follow their entry for deletes"
on "public"."world_entry_field_values"
as permissive
for delete
to authenticated
using (
    exists (
        select 1 from public.world_entries we
        where we.id = world_entry_field_values.entry_id
        for update
    )
    and (
        not world_entry_field_values.gm_only
        or public.world_role(world_entry_field_values.world_id, ( select auth.uid() ))
            in ('owner', 'editor', 'guide')
    )
);


-- ---------------------------------------------------------------------------
-- 8. Realtime
-- ---------------------------------------------------------------------------

alter table world_field_definitions   replica identity full;
alter table world_entry_field_values  replica identity full;

alter publication supabase_realtime add table world_field_definitions;
alter publication supabase_realtime add table world_entry_field_values;
