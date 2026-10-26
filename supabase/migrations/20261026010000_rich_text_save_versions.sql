-- Merged rich text saves (#251).
--
-- Saving a note or entry's Notes now reads the stored Yjs state, merges it
-- into the editor's own and writes the result only if nothing was saved in
-- between, comparing updated_at, and retries otherwise. World entries already
-- keep updated_at; notes start keeping it here.
begin;

alter table public.notes add column updated_at timestamptz not null default now();

create trigger notes_set_updated_at before update on public.notes
  for each row execute function public.set_updated_at();

commit;
