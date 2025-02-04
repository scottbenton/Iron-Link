alter table "public"."characters" drop constraint "characters_game_id_fkey";

alter table "public"."characters" alter column "game_id" set not null;

alter table "public"."characters" add constraint "characters_game_id_fkey" FOREIGN KEY (game_id) REFERENCES games(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."characters" validate constraint "characters_game_id_fkey";


