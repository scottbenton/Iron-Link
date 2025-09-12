-- Add is_manual column to game_logs table to indicate manually added rolls
ALTER TABLE public.game_logs ADD COLUMN is_manual boolean NOT NULL DEFAULT false;
