alter type "public"."game_log_type" rename to "game_log_type__old_version_to_be_dropped";

create type "public"."game_log_type" as enum ('stat_roll', 'oracle_table_roll', 'track_progress_roll', 'special_track_progress_roll', 'clock_progression_roll', 'message');

alter table "public"."game_logs" alter column type type "public"."game_log_type" using type::text::"public"."game_log_type";

drop type "public"."game_log_type__old_version_to_be_dropped";


