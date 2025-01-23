create type "public"."second_screen_options" as enum ('character', 'track', 'note_image');

create table "public"."game_second_screen_settings" (
    "game_id" uuid not null,
    "type" second_screen_options,
    "options" jsonb not null default '{}'::jsonb,
    "created_at" timestamp with time zone not null default now()
);


alter table "public"."game_second_screen_settings" enable row level security;

CREATE UNIQUE INDEX game_second_screen_settings_pkey ON public.game_second_screen_settings USING btree (game_id);

alter table "public"."game_second_screen_settings" add constraint "game_second_screen_settings_pkey" PRIMARY KEY using index "game_second_screen_settings_pkey";

alter table "public"."game_second_screen_settings" add constraint "game_second_screen_settings_game_id_fkey" FOREIGN KEY (game_id) REFERENCES games(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."game_second_screen_settings" validate constraint "game_second_screen_settings_game_id_fkey";

grant delete on table "public"."game_second_screen_settings" to "anon";

grant insert on table "public"."game_second_screen_settings" to "anon";

grant references on table "public"."game_second_screen_settings" to "anon";

grant select on table "public"."game_second_screen_settings" to "anon";

grant trigger on table "public"."game_second_screen_settings" to "anon";

grant truncate on table "public"."game_second_screen_settings" to "anon";

grant update on table "public"."game_second_screen_settings" to "anon";

grant delete on table "public"."game_second_screen_settings" to "authenticated";

grant insert on table "public"."game_second_screen_settings" to "authenticated";

grant references on table "public"."game_second_screen_settings" to "authenticated";

grant select on table "public"."game_second_screen_settings" to "authenticated";

grant trigger on table "public"."game_second_screen_settings" to "authenticated";

grant truncate on table "public"."game_second_screen_settings" to "authenticated";

grant update on table "public"."game_second_screen_settings" to "authenticated";

grant delete on table "public"."game_second_screen_settings" to "service_role";

grant insert on table "public"."game_second_screen_settings" to "service_role";

grant references on table "public"."game_second_screen_settings" to "service_role";

grant select on table "public"."game_second_screen_settings" to "service_role";

grant trigger on table "public"."game_second_screen_settings" to "service_role";

grant truncate on table "public"."game_second_screen_settings" to "service_role";

grant update on table "public"."game_second_screen_settings" to "service_role";


