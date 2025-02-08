CREATE INDEX assets_character_id_idx ON public.assets USING btree (character_id);

CREATE INDEX assets_game_id_idx ON public.assets USING btree (game_id);

CREATE INDEX characters_game_id_idx ON public.characters USING btree (game_id);

CREATE INDEX characters_uid_idx ON public.characters USING btree (uid);

CREATE INDEX game_invite_keys_game_id_is_active_idx ON public.game_invite_keys USING btree (game_id, is_active);

CREATE INDEX game_logs_character_id_idx ON public.game_logs USING btree (character_id);

CREATE INDEX game_logs_created_at_game_id_idx ON public.game_logs USING btree (created_at DESC, game_id);

CREATE INDEX game_logs_game_id_idx ON public.game_logs USING btree (game_id);

CREATE INDEX game_logs_guides_only_game_id_created_at_idx ON public.game_logs USING btree (guides_only, game_id, created_at DESC);

CREATE INDEX game_logs_user_id_idx ON public.game_logs USING btree (user_id);

CREATE INDEX game_players_game_id_idx ON public.game_players USING btree (game_id);

CREATE INDEX game_players_user_id_idx ON public.game_players USING btree (user_id);

CREATE INDEX game_tracks_game_id_idx ON public.game_tracks USING btree (game_id);

CREATE INDEX note_folders_author_id_idx ON public.note_folders USING btree (author_id);

CREATE INDEX note_folders_game_id_idx ON public.note_folders USING btree (game_id);

CREATE INDEX note_folders_game_id_read_permissions_author_id_idx ON public.note_folders USING btree (game_id, read_permissions, author_id);

CREATE INDEX note_folders_game_id_read_permissions_idx ON public.note_folders USING btree (game_id, read_permissions);

CREATE INDEX note_folders_parent_folder_id_idx ON public.note_folders USING btree (parent_folder_id);

CREATE INDEX notes_author_id_idx ON public.notes USING btree (author_id);

CREATE INDEX notes_game_id_idx ON public.notes USING btree (game_id);

CREATE INDEX notes_game_id_read_permissions_idx ON public.notes USING btree (game_id, read_permissions);

CREATE INDEX notes_parent_folder_id_idx ON public.notes USING btree (parent_folder_id);

CREATE INDEX notes_read_permissions_author_id_game_id_idx ON public.notes USING btree (read_permissions, author_id, game_id);


