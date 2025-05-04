create table "public"."admins" (
    "created_at" timestamp with time zone not null default now(),
    "user_id" uuid not null
);


alter table "public"."admins" enable row level security;

CREATE UNIQUE INDEX admins_pkey ON public.admins USING btree (user_id);

CREATE UNIQUE INDEX admins_user_id_key ON public.admins USING btree (user_id);

alter table "public"."admins" add constraint "admins_pkey" PRIMARY KEY using index "admins_pkey";

alter table "public"."admins" add constraint "admins_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."admins" validate constraint "admins_user_id_fkey";

alter table "public"."admins" add constraint "admins_user_id_key" UNIQUE using index "admins_user_id_key";

grant delete on table "public"."admins" to "anon";

grant insert on table "public"."admins" to "anon";

grant references on table "public"."admins" to "anon";

grant select on table "public"."admins" to "anon";

grant trigger on table "public"."admins" to "anon";

grant truncate on table "public"."admins" to "anon";

grant update on table "public"."admins" to "anon";

grant delete on table "public"."admins" to "authenticated";

grant insert on table "public"."admins" to "authenticated";

grant references on table "public"."admins" to "authenticated";

grant select on table "public"."admins" to "authenticated";

grant trigger on table "public"."admins" to "authenticated";

grant truncate on table "public"."admins" to "authenticated";

grant update on table "public"."admins" to "authenticated";

grant delete on table "public"."admins" to "service_role";

grant insert on table "public"."admins" to "service_role";

grant references on table "public"."admins" to "service_role";

grant select on table "public"."admins" to "service_role";

grant trigger on table "public"."admins" to "service_role";

grant truncate on table "public"."admins" to "service_role";

grant update on table "public"."admins" to "service_role";

create policy "Any user can read"
on "public"."admins"
as permissive
for select
to authenticated
using ((user_id = ( SELECT auth.uid() AS uid)));



