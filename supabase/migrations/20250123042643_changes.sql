alter table "public"."game_second_screen_settings" add column "show_all_characters_second_screen" boolean not null default false;

create policy "Anyone can read game second screen settings"
on "public"."game_second_screen_settings"
as permissive
for select
to authenticated, anon
using (true);


create policy "Only guides can delete game second screen settings"
on "public"."game_second_screen_settings"
as permissive
for delete
to authenticated
using ((EXISTS ( SELECT 1
   FROM game_players
  WHERE ((game_players.user_id = ( SELECT auth.uid() AS uid)) AND (game_players.game_id = game_second_screen_settings.game_id) AND (game_players.role = 'guide'::player_role)))));


create policy "Only guides can insert game second screen settings"
on "public"."game_second_screen_settings"
as permissive
for insert
to authenticated
with check ((EXISTS ( SELECT 1
   FROM game_players
  WHERE ((game_players.user_id = ( SELECT auth.uid() AS uid)) AND (game_players.game_id = game_second_screen_settings.game_id) AND (game_players.role = 'guide'::player_role)))));


create policy "Only guides can update game second screen settings"
on "public"."game_second_screen_settings"
as permissive
for update
to authenticated
using ((EXISTS ( SELECT 1
   FROM game_players
  WHERE ((game_players.user_id = ( SELECT auth.uid() AS uid)) AND (game_players.game_id = game_second_screen_settings.game_id) AND (game_players.role = 'guide'::player_role)))))
with check ((EXISTS ( SELECT 1
   FROM game_players
  WHERE ((game_players.user_id = ( SELECT auth.uid() AS uid)) AND (game_players.game_id = game_second_screen_settings.game_id) AND (game_players.role = 'guide'::player_role)))));



