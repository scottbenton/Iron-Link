-- A person's Everywhere theme: the colour scheme used wherever neither the
-- character nor the game sets one. Null is Default (the seasonal theme). It
-- uses the same values as characters.color_scheme and games.color_scheme.
-- The existing users policies already let a person update only their own row.
alter table public.users add column color_scheme character varying;
