alter table "public"."game_players" add column "last_seen_log_timestamp" timestamp with time zone not null default now();


