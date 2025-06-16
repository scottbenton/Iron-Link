alter table "public"."world_players" add column "game_id" uuid;

alter table "public"."world_players" alter column "world_id" set not null;

alter table "public"."worlds" add column "setting_package_id" text;

alter table "public"."worlds" alter column "name" set not null;

alter table "public"."world_players" add constraint "world_players_game_id_fkey" FOREIGN KEY (game_id) REFERENCES games(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."world_players" validate constraint "world_players_game_id_fkey";

create policy "Guides can delete entries"
on "public"."world_players"
as permissive
for delete
to authenticated
using ((EXISTS ( SELECT 1
   FROM (game_players
     JOIN games ON ((games.id = game_players.game_id)))
  WHERE ((games.world_id = world_players.world_id) AND (game_players.user_id = ( SELECT auth.uid() AS uid)) AND (game_players.role = 'guide'::player_role)))));


create policy "Guides can insert entries"
on "public"."world_players"
as permissive
for insert
to authenticated
with check ((EXISTS ( SELECT 1
   FROM (game_players
     JOIN games ON ((games.id = game_players.game_id)))
  WHERE ((games.world_id = world_players.world_id) AND (game_players.user_id = ( SELECT auth.uid() AS uid)) AND (game_players.role = 'guide'::player_role)))));


create policy "Guides can update entries"
on "public"."world_players"
as permissive
for update
to authenticated
using ((EXISTS ( SELECT 1
   FROM (game_players
     JOIN games ON ((games.id = game_players.game_id)))
  WHERE ((games.world_id = world_players.world_id) AND (game_players.user_id = ( SELECT auth.uid() AS uid)) AND (game_players.role = 'guide'::player_role)))))
with check ((EXISTS ( SELECT 1
   FROM (game_players
     JOIN games ON ((games.id = game_players.game_id)))
  WHERE ((games.world_id = world_players.world_id) AND (game_players.user_id = ( SELECT auth.uid() AS uid)) AND (game_players.role = 'guide'::player_role)))));


create policy "Users can delete their own entries"
on "public"."world_players"
as permissive
for delete
to authenticated
using ((( SELECT auth.uid() AS uid) = user_id));


create policy "Users can read their own entries"
on "public"."world_players"
as permissive
for select
to authenticated
using ((( SELECT auth.uid() AS uid) = user_id));


create policy "Users can update their own entries"
on "public"."world_players"
as permissive
for update
to authenticated
using ((( SELECT auth.uid() AS uid) = user_id))
with check ((( SELECT auth.uid() AS uid) = user_id));


create policy "users can insert new roles"
on "public"."world_players"
as permissive
for insert
to authenticated
with check ((( SELECT auth.uid() AS uid) = user_id));


create policy "A world owner can delete a world"
on "public"."worlds"
as permissive
for delete
to authenticated
using ((EXISTS ( SELECT 1
   FROM world_players
  WHERE ((world_players.world_id = world_players.world_id) AND ( SELECT (auth.uid() = world_players.user_id)) AND (world_players.role = 'owner'::world_player_role)))));


create policy "A world user can update a world"
on "public"."worlds"
as permissive
for update
to authenticated
using ((EXISTS ( SELECT 1
   FROM world_players
  WHERE ((world_players.world_id = world_players.world_id) AND ( SELECT (auth.uid() = world_players.user_id))))))
with check ((EXISTS ( SELECT 1
   FROM world_players
  WHERE ((world_players.world_id = world_players.world_id) AND ( SELECT (auth.uid() = world_players.user_id))))));


create policy "Any user can create a world"
on "public"."worlds"
as permissive
for insert
to authenticated
with check (true);


create policy "Anyone can read a world"
on "public"."worlds"
as permissive
for select
to authenticated
using (true);



