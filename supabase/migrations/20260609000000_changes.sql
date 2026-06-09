-- =============================================================================
-- Worlds schema (task W1)
-- Implements: worlds, world_players, world_categories, world_entries,
--             world_entry_gm_data, world_entry_bonds
--             + games.world_id FK
--             + storage buckets for entry images and map backgrounds
--             + world_role() helper function
--             + RLS policies
--             + realtime publication additions
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Core tables
-- ---------------------------------------------------------------------------

create table "public"."worlds" (
    "id"          uuid not null default gen_random_uuid(),
    "name"        text not null,
    "description" text,
    "created_by"  uuid not null,
    "setting_key" text,
    "created_at"  timestamp with time zone not null default now(),
    "updated_at"  timestamp with time zone not null default now()
);

alter table "public"."worlds" enable row level security;

CREATE UNIQUE INDEX worlds_pkey ON public.worlds USING btree (id);

alter table "public"."worlds" add constraint "worlds_pkey" PRIMARY KEY using index "worlds_pkey";

alter table "public"."worlds" add constraint "worlds_created_by_fkey"
    FOREIGN KEY (created_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;
alter table "public"."worlds" validate constraint "worlds_created_by_fkey";


-- ---------------------------------------------------------------------------
-- 2. world_players  (explicit membership + role)
-- ---------------------------------------------------------------------------

create table "public"."world_players" (
    "world_id" uuid not null,
    "user_id"  uuid not null,
    "role"     text not null,
    "created_at" timestamp with time zone not null default now()
);

alter table "public"."world_players" enable row level security;

CREATE UNIQUE INDEX world_players_pkey ON public.world_players USING btree (world_id, user_id);

alter table "public"."world_players" add constraint "world_players_pkey" PRIMARY KEY using index "world_players_pkey";

alter table "public"."world_players" add constraint "world_players_role_check"
    check (role in ('owner', 'editor', 'viewer'));

alter table "public"."world_players" add constraint "world_players_world_id_fkey"
    FOREIGN KEY (world_id) REFERENCES worlds(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;
alter table "public"."world_players" validate constraint "world_players_world_id_fkey";

alter table "public"."world_players" add constraint "world_players_user_id_fkey"
    FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;
alter table "public"."world_players" validate constraint "world_players_user_id_fkey";


-- ---------------------------------------------------------------------------
-- 3. games.world_id FK  (one world per game, many games per world)
-- ---------------------------------------------------------------------------

alter table "public"."games" add column "world_id" uuid null;

alter table "public"."games" add constraint "games_world_id_fkey"
    FOREIGN KEY (world_id) REFERENCES worlds(id) ON UPDATE CASCADE ON DELETE SET NULL not valid;
alter table "public"."games" validate constraint "games_world_id_fkey";


-- ---------------------------------------------------------------------------
-- 4. world_categories
-- ---------------------------------------------------------------------------

create table "public"."world_categories" (
    "id"                 uuid not null default gen_random_uuid(),
    "world_id"           uuid not null,
    "name"               text not null,
    "icon"               jsonb,
    "sort_order"         integer not null default 0,
    "supports_hierarchy" boolean not null default false,
    "supports_map"       boolean not null default false,
    "supports_bonds"     boolean not null default false,
    "field_definitions"  jsonb not null default '[]'::jsonb,
    "created_at"         timestamp with time zone not null default now(),
    "updated_at"         timestamp with time zone not null default now()
);

alter table "public"."world_categories" enable row level security;

CREATE UNIQUE INDEX world_categories_pkey ON public.world_categories USING btree (id);

alter table "public"."world_categories" add constraint "world_categories_pkey" PRIMARY KEY using index "world_categories_pkey";

alter table "public"."world_categories" add constraint "world_categories_world_id_fkey"
    FOREIGN KEY (world_id) REFERENCES worlds(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;
alter table "public"."world_categories" validate constraint "world_categories_world_id_fkey";


-- ---------------------------------------------------------------------------
-- 5. world_entries
-- ---------------------------------------------------------------------------

create table "public"."world_entries" (
    "id"                    uuid not null default gen_random_uuid(),
    "world_id"              uuid not null,
    "category_id"           uuid not null,
    "parent_entry_id"       uuid null,
    "name"                  text not null,
    "icon"                  jsonb,
    "image_filenames"       text[] not null default '{}'::text[],
    "fields"                jsonb not null default '{}'::jsonb,
    "notes_content"         bytea,
    "map"                   jsonb,
    "map_background_filename" text,
    "map_settings"          jsonb,
    "read_permissions"      note_read_permissions not null default 'all_players'::note_read_permissions,
    "edit_permissions"      note_edit_permissions not null default 'all_players'::note_edit_permissions,
    "author_id"             uuid not null,
    "created_at"            timestamp with time zone not null default now(),
    "updated_at"            timestamp with time zone not null default now()
);

alter table "public"."world_entries" enable row level security;

CREATE UNIQUE INDEX world_entries_pkey ON public.world_entries USING btree (id);

alter table "public"."world_entries" add constraint "world_entries_pkey" PRIMARY KEY using index "world_entries_pkey";

alter table "public"."world_entries" add constraint "world_entries_world_id_fkey"
    FOREIGN KEY (world_id) REFERENCES worlds(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;
alter table "public"."world_entries" validate constraint "world_entries_world_id_fkey";

alter table "public"."world_entries" add constraint "world_entries_category_id_fkey"
    FOREIGN KEY (category_id) REFERENCES world_categories(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;
alter table "public"."world_entries" validate constraint "world_entries_category_id_fkey";

alter table "public"."world_entries" add constraint "world_entries_parent_entry_id_fkey"
    FOREIGN KEY (parent_entry_id) REFERENCES world_entries(id) ON UPDATE CASCADE ON DELETE SET NULL not valid;
alter table "public"."world_entries" validate constraint "world_entries_parent_entry_id_fkey";

alter table "public"."world_entries" add constraint "world_entries_author_id_fkey"
    FOREIGN KEY (author_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;
alter table "public"."world_entries" validate constraint "world_entries_author_id_fkey";


-- ---------------------------------------------------------------------------
-- 6. world_entry_gm_data  (GM-only values, separate row for RLS)
-- ---------------------------------------------------------------------------

create table "public"."world_entry_gm_data" (
    "entry_id"          uuid not null,
    "world_id"          uuid not null,
    "fields"            jsonb not null default '{}'::jsonb,
    "gm_notes_content"  bytea,
    "created_at"        timestamp with time zone not null default now(),
    "updated_at"        timestamp with time zone not null default now()
);

alter table "public"."world_entry_gm_data" enable row level security;

CREATE UNIQUE INDEX world_entry_gm_data_pkey ON public.world_entry_gm_data USING btree (entry_id);

alter table "public"."world_entry_gm_data" add constraint "world_entry_gm_data_pkey" PRIMARY KEY using index "world_entry_gm_data_pkey";

alter table "public"."world_entry_gm_data" add constraint "world_entry_gm_data_entry_id_fkey"
    FOREIGN KEY (entry_id) REFERENCES world_entries(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;
alter table "public"."world_entry_gm_data" validate constraint "world_entry_gm_data_entry_id_fkey";

alter table "public"."world_entry_gm_data" add constraint "world_entry_gm_data_world_id_fkey"
    FOREIGN KEY (world_id) REFERENCES worlds(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;
alter table "public"."world_entry_gm_data" validate constraint "world_entry_gm_data_world_id_fkey";


-- ---------------------------------------------------------------------------
-- 7. world_entry_bonds  (character ↔ entry bond records)
-- ---------------------------------------------------------------------------

create table "public"."world_entry_bonds" (
    "entry_id"     uuid not null,
    "character_id" uuid not null,
    "created_at"   timestamp with time zone not null default now()
);

alter table "public"."world_entry_bonds" enable row level security;

CREATE UNIQUE INDEX world_entry_bonds_pkey ON public.world_entry_bonds USING btree (entry_id, character_id);

alter table "public"."world_entry_bonds" add constraint "world_entry_bonds_pkey" PRIMARY KEY using index "world_entry_bonds_pkey";

alter table "public"."world_entry_bonds" add constraint "world_entry_bonds_entry_id_fkey"
    FOREIGN KEY (entry_id) REFERENCES world_entries(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;
alter table "public"."world_entry_bonds" validate constraint "world_entry_bonds_entry_id_fkey";

alter table "public"."world_entry_bonds" add constraint "world_entry_bonds_character_id_fkey"
    FOREIGN KEY (character_id) REFERENCES characters(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;
alter table "public"."world_entry_bonds" validate constraint "world_entry_bonds_character_id_fkey";


-- ---------------------------------------------------------------------------
-- 8. Indexes
-- ---------------------------------------------------------------------------

CREATE INDEX worlds_created_by_idx ON public.worlds USING btree (created_by);

CREATE INDEX world_players_world_id_idx ON public.world_players USING btree (world_id);
CREATE INDEX world_players_user_id_idx  ON public.world_players USING btree (user_id);

CREATE INDEX games_world_id_idx ON public.games USING btree (world_id);

CREATE INDEX world_categories_world_id_idx ON public.world_categories USING btree (world_id);

CREATE INDEX world_entries_world_id_idx         ON public.world_entries USING btree (world_id);
CREATE INDEX world_entries_category_id_idx      ON public.world_entries USING btree (category_id);
CREATE INDEX world_entries_parent_entry_id_idx  ON public.world_entries USING btree (parent_entry_id);
CREATE INDEX world_entries_author_id_idx        ON public.world_entries USING btree (author_id);
CREATE INDEX world_entries_world_id_read_permissions_idx
    ON public.world_entries USING btree (world_id, read_permissions);

CREATE INDEX world_entry_gm_data_world_id_idx ON public.world_entry_gm_data USING btree (world_id);

CREATE INDEX world_entry_bonds_entry_id_idx     ON public.world_entry_bonds USING btree (entry_id);
CREATE INDEX world_entry_bonds_character_id_idx ON public.world_entry_bonds USING btree (character_id);


-- ---------------------------------------------------------------------------
-- 9. updated_at triggers  (mirror notes pattern — no moddatetime extension
--    is used in this project, so we add a small trigger function inline)
-- ---------------------------------------------------------------------------

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$;

CREATE TRIGGER worlds_set_updated_at
    BEFORE UPDATE ON public.worlds
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER world_categories_set_updated_at
    BEFORE UPDATE ON public.world_categories
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER world_entries_set_updated_at
    BEFORE UPDATE ON public.world_entries
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER world_entry_gm_data_set_updated_at
    BEFORE UPDATE ON public.world_entry_gm_data
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ---------------------------------------------------------------------------
-- 10. world_role() helper function
--     Returns: 'owner' | 'editor' | 'guide' | 'player' | 'none'
--     Derived from world_players (explicit) and game_players via linked games.
--     Guides (game role 'guide') map to GM-equivalent access.
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
        -- Derive role from best game_players role across linked games
        (SELECT
            CASE gp.role
                WHEN 'guide'  THEN 'guide'
                WHEN 'player' THEN 'player'
                ELSE 'player'
            END
         FROM public.game_players gp
         JOIN public.games g ON g.id = gp.game_id
         WHERE g.world_id   = p_world_id
           AND gp.user_id   = p_uid
         ORDER BY
             -- guides outrank players when a user has both roles across games
             CASE gp.role WHEN 'guide' THEN 0 ELSE 1 END
         LIMIT 1),
        'none'
    );
$function$;


-- ---------------------------------------------------------------------------
-- 11. Grants
-- ---------------------------------------------------------------------------

grant delete on table "public"."worlds" to "anon";
grant insert on table "public"."worlds" to "anon";
grant references on table "public"."worlds" to "anon";
grant select on table "public"."worlds" to "anon";
grant trigger on table "public"."worlds" to "anon";
grant truncate on table "public"."worlds" to "anon";
grant update on table "public"."worlds" to "anon";

grant delete on table "public"."worlds" to "authenticated";
grant insert on table "public"."worlds" to "authenticated";
grant references on table "public"."worlds" to "authenticated";
grant select on table "public"."worlds" to "authenticated";
grant trigger on table "public"."worlds" to "authenticated";
grant truncate on table "public"."worlds" to "authenticated";
grant update on table "public"."worlds" to "authenticated";

grant delete on table "public"."worlds" to "service_role";
grant insert on table "public"."worlds" to "service_role";
grant references on table "public"."worlds" to "service_role";
grant select on table "public"."worlds" to "service_role";
grant trigger on table "public"."worlds" to "service_role";
grant truncate on table "public"."worlds" to "service_role";
grant update on table "public"."worlds" to "service_role";

grant delete on table "public"."world_players" to "anon";
grant insert on table "public"."world_players" to "anon";
grant references on table "public"."world_players" to "anon";
grant select on table "public"."world_players" to "anon";
grant trigger on table "public"."world_players" to "anon";
grant truncate on table "public"."world_players" to "anon";
grant update on table "public"."world_players" to "anon";

grant delete on table "public"."world_players" to "authenticated";
grant insert on table "public"."world_players" to "authenticated";
grant references on table "public"."world_players" to "authenticated";
grant select on table "public"."world_players" to "authenticated";
grant trigger on table "public"."world_players" to "authenticated";
grant truncate on table "public"."world_players" to "authenticated";
grant update on table "public"."world_players" to "authenticated";

grant delete on table "public"."world_players" to "service_role";
grant insert on table "public"."world_players" to "service_role";
grant references on table "public"."world_players" to "service_role";
grant select on table "public"."world_players" to "service_role";
grant trigger on table "public"."world_players" to "service_role";
grant truncate on table "public"."world_players" to "service_role";
grant update on table "public"."world_players" to "service_role";

grant delete on table "public"."world_categories" to "anon";
grant insert on table "public"."world_categories" to "anon";
grant references on table "public"."world_categories" to "anon";
grant select on table "public"."world_categories" to "anon";
grant trigger on table "public"."world_categories" to "anon";
grant truncate on table "public"."world_categories" to "anon";
grant update on table "public"."world_categories" to "anon";

grant delete on table "public"."world_categories" to "authenticated";
grant insert on table "public"."world_categories" to "authenticated";
grant references on table "public"."world_categories" to "authenticated";
grant select on table "public"."world_categories" to "authenticated";
grant trigger on table "public"."world_categories" to "authenticated";
grant truncate on table "public"."world_categories" to "authenticated";
grant update on table "public"."world_categories" to "authenticated";

grant delete on table "public"."world_categories" to "service_role";
grant insert on table "public"."world_categories" to "service_role";
grant references on table "public"."world_categories" to "service_role";
grant select on table "public"."world_categories" to "service_role";
grant trigger on table "public"."world_categories" to "service_role";
grant truncate on table "public"."world_categories" to "service_role";
grant update on table "public"."world_categories" to "service_role";

grant delete on table "public"."world_entries" to "anon";
grant insert on table "public"."world_entries" to "anon";
grant references on table "public"."world_entries" to "anon";
grant select on table "public"."world_entries" to "anon";
grant trigger on table "public"."world_entries" to "anon";
grant truncate on table "public"."world_entries" to "anon";
grant update on table "public"."world_entries" to "anon";

grant delete on table "public"."world_entries" to "authenticated";
grant insert on table "public"."world_entries" to "authenticated";
grant references on table "public"."world_entries" to "authenticated";
grant select on table "public"."world_entries" to "authenticated";
grant trigger on table "public"."world_entries" to "authenticated";
grant truncate on table "public"."world_entries" to "authenticated";
grant update on table "public"."world_entries" to "authenticated";

grant delete on table "public"."world_entries" to "service_role";
grant insert on table "public"."world_entries" to "service_role";
grant references on table "public"."world_entries" to "service_role";
grant select on table "public"."world_entries" to "service_role";
grant trigger on table "public"."world_entries" to "service_role";
grant truncate on table "public"."world_entries" to "service_role";
grant update on table "public"."world_entries" to "service_role";

grant delete on table "public"."world_entry_gm_data" to "anon";
grant insert on table "public"."world_entry_gm_data" to "anon";
grant references on table "public"."world_entry_gm_data" to "anon";
grant select on table "public"."world_entry_gm_data" to "anon";
grant trigger on table "public"."world_entry_gm_data" to "anon";
grant truncate on table "public"."world_entry_gm_data" to "anon";
grant update on table "public"."world_entry_gm_data" to "anon";

grant delete on table "public"."world_entry_gm_data" to "authenticated";
grant insert on table "public"."world_entry_gm_data" to "authenticated";
grant references on table "public"."world_entry_gm_data" to "authenticated";
grant select on table "public"."world_entry_gm_data" to "authenticated";
grant trigger on table "public"."world_entry_gm_data" to "authenticated";
grant truncate on table "public"."world_entry_gm_data" to "authenticated";
grant update on table "public"."world_entry_gm_data" to "authenticated";

grant delete on table "public"."world_entry_gm_data" to "service_role";
grant insert on table "public"."world_entry_gm_data" to "service_role";
grant references on table "public"."world_entry_gm_data" to "service_role";
grant select on table "public"."world_entry_gm_data" to "service_role";
grant trigger on table "public"."world_entry_gm_data" to "service_role";
grant truncate on table "public"."world_entry_gm_data" to "service_role";
grant update on table "public"."world_entry_gm_data" to "service_role";

grant delete on table "public"."world_entry_bonds" to "anon";
grant insert on table "public"."world_entry_bonds" to "anon";
grant references on table "public"."world_entry_bonds" to "anon";
grant select on table "public"."world_entry_bonds" to "anon";
grant trigger on table "public"."world_entry_bonds" to "anon";
grant truncate on table "public"."world_entry_bonds" to "anon";
grant update on table "public"."world_entry_bonds" to "anon";

grant delete on table "public"."world_entry_bonds" to "authenticated";
grant insert on table "public"."world_entry_bonds" to "authenticated";
grant references on table "public"."world_entry_bonds" to "authenticated";
grant select on table "public"."world_entry_bonds" to "authenticated";
grant trigger on table "public"."world_entry_bonds" to "authenticated";
grant truncate on table "public"."world_entry_bonds" to "authenticated";
grant update on table "public"."world_entry_bonds" to "authenticated";

grant delete on table "public"."world_entry_bonds" to "service_role";
grant insert on table "public"."world_entry_bonds" to "service_role";
grant references on table "public"."world_entry_bonds" to "service_role";
grant select on table "public"."world_entry_bonds" to "service_role";
grant trigger on table "public"."world_entry_bonds" to "service_role";
grant truncate on table "public"."world_entry_bonds" to "service_role";
grant update on table "public"."world_entry_bonds" to "service_role";

grant execute on function public.world_role(uuid, uuid) to authenticated;
grant execute on function public.world_role(uuid, uuid) to service_role;


-- ---------------------------------------------------------------------------
-- 12. RLS Policies
-- ---------------------------------------------------------------------------

-- ---- worlds ---------------------------------------------------------------

-- Read: explicit world_players member OR player in any linked game
create policy "World members and linked game players can read worlds"
on "public"."worlds"
as permissive
for select
to authenticated
using (
    exists (
        select 1 from public.world_players wp
        where wp.world_id = worlds.id
          and wp.user_id  = ( select auth.uid() )
    )
    or exists (
        select 1 from public.game_players gp
        join public.games g on g.id = gp.game_id
        where g.world_id  = worlds.id
          and gp.user_id  = ( select auth.uid() )
    )
);

-- Insert: any authenticated user can create a world (they become owner via app logic)
create policy "Authenticated users can create worlds"
on "public"."worlds"
as permissive
for insert
to authenticated
with check ( created_by = ( select auth.uid() ) );

-- Update: owner or editor
create policy "World owners and editors can update worlds"
on "public"."worlds"
as permissive
for update
to authenticated
using (
    public.world_role(worlds.id, ( select auth.uid() )) in ('owner', 'editor')
)
with check (
    public.world_role(worlds.id, ( select auth.uid() )) in ('owner', 'editor')
);

-- Delete: owner only
create policy "World owners can delete worlds"
on "public"."worlds"
as permissive
for delete
to authenticated
using (
    public.world_role(worlds.id, ( select auth.uid() )) = 'owner'
);


-- ---- world_players --------------------------------------------------------

-- Read: any world member or linked game player can read the membership list
create policy "World members can read world_players"
on "public"."world_players"
as permissive
for select
to authenticated
using (
    exists (
        select 1 from public.world_players wp2
        where wp2.world_id = world_players.world_id
          and wp2.user_id  = ( select auth.uid() )
    )
    or exists (
        select 1 from public.game_players gp
        join public.games g on g.id = gp.game_id
        where g.world_id  = world_players.world_id
          and gp.user_id  = ( select auth.uid() )
    )
);

-- Insert/Update/Delete: owner only
create policy "World owners can insert world_players"
on "public"."world_players"
as permissive
for insert
to authenticated
with check (
    public.world_role(world_players.world_id, ( select auth.uid() )) = 'owner'
);

create policy "World owners can update world_players"
on "public"."world_players"
as permissive
for update
to authenticated
using (
    public.world_role(world_players.world_id, ( select auth.uid() )) = 'owner'
)
with check (
    public.world_role(world_players.world_id, ( select auth.uid() )) = 'owner'
);

create policy "World owners can delete world_players"
on "public"."world_players"
as permissive
for delete
to authenticated
using (
    public.world_role(world_players.world_id, ( select auth.uid() )) = 'owner'
);


-- ---- world_categories -----------------------------------------------------

-- Read: any world member or linked game player
create policy "World members can read world_categories"
on "public"."world_categories"
as permissive
for select
to authenticated
using (
    exists (
        select 1 from public.world_players wp
        where wp.world_id = world_categories.world_id
          and wp.user_id  = ( select auth.uid() )
    )
    or exists (
        select 1 from public.game_players gp
        join public.games g on g.id = gp.game_id
        where g.world_id  = world_categories.world_id
          and gp.user_id  = ( select auth.uid() )
    )
);

-- Write: owner or editor
create policy "World owners and editors can insert world_categories"
on "public"."world_categories"
as permissive
for insert
to authenticated
with check (
    public.world_role(world_categories.world_id, ( select auth.uid() )) in ('owner', 'editor')
);

create policy "World owners and editors can update world_categories"
on "public"."world_categories"
as permissive
for update
to authenticated
using (
    public.world_role(world_categories.world_id, ( select auth.uid() )) in ('owner', 'editor')
)
with check (
    public.world_role(world_categories.world_id, ( select auth.uid() )) in ('owner', 'editor')
);

create policy "World owners and editors can delete world_categories"
on "public"."world_categories"
as permissive
for delete
to authenticated
using (
    public.world_role(world_categories.world_id, ( select auth.uid() )) in ('owner', 'editor')
);


-- ---- world_entries --------------------------------------------------------
-- Read policy mirrors the notes read_permissions model:
--   only_author   -> only the entry's author
--   only_guides   -> owner / editor / guide
--   guides_and_author -> owner / editor / guide OR author
--   all_players   -> any world member or linked game player
--   public        -> any authenticated user

create policy "World entries are readable per read_permissions"
on "public"."world_entries"
as permissive
for select
to authenticated
using (
    case world_entries.read_permissions
        when 'public' then true
        when 'all_players' then (
            exists (
                select 1 from public.world_players wp
                where wp.world_id = world_entries.world_id
                  and wp.user_id  = ( select auth.uid() )
            )
            or exists (
                select 1 from public.game_players gp
                join public.games g on g.id = gp.game_id
                where g.world_id  = world_entries.world_id
                  and gp.user_id  = ( select auth.uid() )
            )
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

-- Insert: any world member or linked game player can create entries
create policy "World members can insert world_entries"
on "public"."world_entries"
as permissive
for insert
to authenticated
with check (
    world_entries.author_id = ( select auth.uid() )
    and (
        exists (
            select 1 from public.world_players wp
            where wp.world_id = world_entries.world_id
              and wp.user_id  = ( select auth.uid() )
        )
        or exists (
            select 1 from public.game_players gp
            join public.games g on g.id = gp.game_id
            where g.world_id  = world_entries.world_id
              and gp.user_id  = ( select auth.uid() )
        )
    )
);

-- Update: mirrors edit_permissions (only_author, only_guides, guides_and_author, all_players)
create policy "World entries are writable per edit_permissions"
on "public"."world_entries"
as permissive
for update
to authenticated
using (
    case world_entries.edit_permissions
        when 'all_players' then (
            exists (
                select 1 from public.world_players wp
                where wp.world_id = world_entries.world_id
                  and wp.user_id  = ( select auth.uid() )
            )
            or exists (
                select 1 from public.game_players gp
                join public.games g on g.id = gp.game_id
                where g.world_id  = world_entries.world_id
                  and gp.user_id  = ( select auth.uid() )
            )
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
            exists (
                select 1 from public.world_players wp
                where wp.world_id = world_entries.world_id
                  and wp.user_id  = ( select auth.uid() )
            )
            or exists (
                select 1 from public.game_players gp
                join public.games g on g.id = gp.game_id
                where g.world_id  = world_entries.world_id
                  and gp.user_id  = ( select auth.uid() )
            )
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

-- Delete: author, owner, or editor (guides can clean up too)
create policy "World entry authors and editors can delete world_entries"
on "public"."world_entries"
as permissive
for delete
to authenticated
using (
    world_entries.author_id = ( select auth.uid() )
    or public.world_role(world_entries.world_id, ( select auth.uid() )) in ('owner', 'editor', 'guide')
);


-- ---- world_entry_gm_data --------------------------------------------------
-- Readable/writable only when world_role is owner, editor, or guide

create policy "GMs can read world_entry_gm_data"
on "public"."world_entry_gm_data"
as permissive
for select
to authenticated
using (
    public.world_role(world_entry_gm_data.world_id, ( select auth.uid() )) in ('owner', 'editor', 'guide')
);

create policy "GMs can insert world_entry_gm_data"
on "public"."world_entry_gm_data"
as permissive
for insert
to authenticated
with check (
    public.world_role(world_entry_gm_data.world_id, ( select auth.uid() )) in ('owner', 'editor', 'guide')
);

create policy "GMs can update world_entry_gm_data"
on "public"."world_entry_gm_data"
as permissive
for update
to authenticated
using (
    public.world_role(world_entry_gm_data.world_id, ( select auth.uid() )) in ('owner', 'editor', 'guide')
)
with check (
    public.world_role(world_entry_gm_data.world_id, ( select auth.uid() )) in ('owner', 'editor', 'guide')
);

create policy "GMs can delete world_entry_gm_data"
on "public"."world_entry_gm_data"
as permissive
for delete
to authenticated
using (
    public.world_role(world_entry_gm_data.world_id, ( select auth.uid() )) in ('owner', 'editor', 'guide')
);


-- ---- world_entry_bonds ----------------------------------------------------
-- Readable by any world/game member who can read the entry; writable by
-- the character's owner (bond is on the character side).

create policy "World members can read world_entry_bonds"
on "public"."world_entry_bonds"
as permissive
for select
to authenticated
using (
    exists (
        select 1 from public.world_entries we
        where we.id = world_entry_bonds.entry_id
          and (
            exists (
                select 1 from public.world_players wp
                where wp.world_id = we.world_id
                  and wp.user_id  = ( select auth.uid() )
            )
            or exists (
                select 1 from public.game_players gp
                join public.games g on g.id = gp.game_id
                where g.world_id  = we.world_id
                  and gp.user_id  = ( select auth.uid() )
            )
          )
    )
);

-- Characters manage their own bonds
create policy "Character owners can insert world_entry_bonds"
on "public"."world_entry_bonds"
as permissive
for insert
to authenticated
with check (
    exists (
        select 1 from public.characters c
        where c.id  = world_entry_bonds.character_id
          and c.uid = ( select auth.uid() )
    )
);

create policy "Character owners can delete world_entry_bonds"
on "public"."world_entry_bonds"
as permissive
for delete
to authenticated
using (
    exists (
        select 1 from public.characters c
        where c.id  = world_entry_bonds.character_id
          and c.uid = ( select auth.uid() )
    )
);


-- ---------------------------------------------------------------------------
-- 13. Replica identity (realtime subscriptions)
-- ---------------------------------------------------------------------------

alter table worlds             replica identity full;
alter table world_players      replica identity full;
alter table world_categories   replica identity full;
alter table world_entries      replica identity full;
alter table world_entry_gm_data replica identity full;
alter table world_entry_bonds  replica identity full;


-- ---------------------------------------------------------------------------
-- 14. Realtime publication
-- ---------------------------------------------------------------------------

alter publication supabase_realtime add table worlds;
alter publication supabase_realtime add table world_players;
alter publication supabase_realtime add table world_categories;
alter publication supabase_realtime add table world_entries;
alter publication supabase_realtime add table world_entry_gm_data;
alter publication supabase_realtime add table world_entry_bonds;


-- ---------------------------------------------------------------------------
-- 15. Storage buckets (via storage schema inserts — mirrors Supabase convention
--     when storage.buckets aren't declared in config.toml)
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
    ('world_entry_images', 'world_entry_images', true,  52428800, array['image/png','image/jpeg','image/gif','image/webp']),
    ('world_map_backgrounds', 'world_map_backgrounds', true, 52428800, array['image/png','image/jpeg','image/gif','image/webp'])
on conflict (id) do nothing;

-- Storage RLS: any authenticated world/game member can read (public bucket already
-- exposes objects publicly, but explicit policies guard uploads/deletes).

create policy "World members can upload entry images"
on storage.objects
as permissive
for insert
to authenticated
with check (
    bucket_id = 'world_entry_images'
    and auth.uid() is not null
);

create policy "World members can upload map backgrounds"
on storage.objects
as permissive
for insert
to authenticated
with check (
    bucket_id = 'world_map_backgrounds'
    and auth.uid() is not null
);

create policy "World entry images are publicly readable"
on storage.objects
as permissive
for select
to public
using ( bucket_id = 'world_entry_images' );

create policy "World map backgrounds are publicly readable"
on storage.objects
as permissive
for select
to public
using ( bucket_id = 'world_map_backgrounds' );

create policy "Authenticated users can delete world entry images"
on storage.objects
as permissive
for delete
to authenticated
using (
    bucket_id = 'world_entry_images'
    and owner = ( select auth.uid() )
);

create policy "Authenticated users can delete world map backgrounds"
on storage.objects
as permissive
for delete
to authenticated
using (
    bucket_id = 'world_map_backgrounds'
    and owner = ( select auth.uid() )
);
