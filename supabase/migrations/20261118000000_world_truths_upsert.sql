-- Choosing a truth is an upsert, and PostgREST's upsert sets every column it
-- was sent, the key included (`on conflict ... do update set world_id =
-- excluded.world_id, truth_id = excluded.truth_id, ...`). Without UPDATE on
-- the key columns every choice was refused with "permission denied". Grant
-- them, and refuse an update that changes them instead, so a truth still never
-- moves to another world or truth.

grant update (world_id, truth_id) on public.world_truths to authenticated;

create function public.world_truths_keep_key()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.world_id is distinct from old.world_id
     or new.truth_id is distinct from old.truth_id then
    raise exception 'A world truth cannot move to another world or truth'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

revoke all on function public.world_truths_keep_key() from public, anon, authenticated;

create trigger world_truths_keep_key
  before update of world_id, truth_id on public.world_truths
  for each row execute function public.world_truths_keep_key();
