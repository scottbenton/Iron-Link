-- A world entry can be shown on a game's second screen (#163). Its options
-- hold { world_id, entry_id }; the screen draws only what the whole table
-- may see.
alter type "public"."second_screen_options" add value if not exists 'world_entry';
