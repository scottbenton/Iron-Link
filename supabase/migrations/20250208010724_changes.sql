create table "public"."game_invite_keys" (
    "game_id" uuid not null,
    "url_key" uuid not null default gen_random_uuid(),
    "is_active" boolean not null default true,
    "created_at" timestamp with time zone not null default now()
);


alter table "public"."game_invite_keys" enable row level security;

CREATE UNIQUE INDEX game_invite_keys_pkey ON public.game_invite_keys USING btree (game_id);

CREATE UNIQUE INDEX game_invite_keys_url_key_key ON public.game_invite_keys USING btree (url_key);

alter table "public"."game_invite_keys" add constraint "game_invite_keys_pkey" PRIMARY KEY using index "game_invite_keys_pkey";

alter table "public"."game_invite_keys" add constraint "game_invite_keys_game_id_fkey" FOREIGN KEY (game_id) REFERENCES games(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."game_invite_keys" validate constraint "game_invite_keys_game_id_fkey";

alter table "public"."game_invite_keys" add constraint "game_invite_keys_url_key_key" UNIQUE using index "game_invite_keys_url_key_key";

grant delete on table "public"."game_invite_keys" to "anon";

grant insert on table "public"."game_invite_keys" to "anon";

grant references on table "public"."game_invite_keys" to "anon";

grant select on table "public"."game_invite_keys" to "anon";

grant trigger on table "public"."game_invite_keys" to "anon";

grant truncate on table "public"."game_invite_keys" to "anon";

grant update on table "public"."game_invite_keys" to "anon";

grant delete on table "public"."game_invite_keys" to "authenticated";

grant insert on table "public"."game_invite_keys" to "authenticated";

grant references on table "public"."game_invite_keys" to "authenticated";

grant select on table "public"."game_invite_keys" to "authenticated";

grant trigger on table "public"."game_invite_keys" to "authenticated";

grant truncate on table "public"."game_invite_keys" to "authenticated";

grant update on table "public"."game_invite_keys" to "authenticated";

grant delete on table "public"."game_invite_keys" to "service_role";

grant insert on table "public"."game_invite_keys" to "service_role";

grant references on table "public"."game_invite_keys" to "service_role";

grant select on table "public"."game_invite_keys" to "service_role";

grant trigger on table "public"."game_invite_keys" to "service_role";

grant truncate on table "public"."game_invite_keys" to "service_role";

grant update on table "public"."game_invite_keys" to "service_role";


