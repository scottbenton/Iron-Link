-- Character bonds with world entries (#217, #238).
--
-- A row links one character to one entry. What it means follows the rules of
-- the character's game, chosen by the client when the row is made:
--   - 'bond': an Ironlands bond. The row is the bond; it has no progress.
--   - 'connection': a Starforged connection, with a rank, a progress track
--     (0 to 40 ticks) and whether it has become a bond (Forge a Bond).
--
-- 1. New columns: kind, rank, completed_ticks, bonded, world_id, updated_at.
-- 2. Guards: bonds only in categories with bonds, only for characters whose
--    game is linked to the entry's world; a row never moves to another entry,
--    character or kind. Turning bonds off on a category, unlinking a game or
--    moving a character keeps the rows, so they come back with the link.
-- 3. RLS: reading needs the entry (so a bond never reveals an entry the reader
--    cannot see); writing needs the right to edit the character and to read
--    the entry. Before this, adding a bond checked only the character.
begin;

-- ---------------------------------------------------------------------------
-- 1. Columns
-- ---------------------------------------------------------------------------

alter table public.world_entry_bonds
  add column kind text not null default 'bond'
    constraint world_entry_bonds_kind_check check (kind in ('bond', 'connection')),
  add column rank public.progress_track_difficulty,
  add column completed_ticks smallint not null default 0
    constraint world_entry_bonds_ticks_check check (completed_ticks between 0 and 40),
  add column bonded boolean not null default false,
  add column world_id uuid references public.worlds(id) on delete cascade,
  add column updated_at timestamp with time zone not null default now(),
  -- An Ironlands bond is only the link; a connection always has a rank.
  add constraint world_entry_bonds_shape_check check (
    (kind = 'bond' and rank is null and completed_ticks = 0 and not bonded)
    or (kind = 'connection' and rank is not null));

update public.world_entry_bonds b set world_id = we.world_id
  from public.world_entries we where we.id = b.entry_id;
alter table public.world_entry_bonds alter column world_id set not null;

create index world_entry_bonds_world_id_idx on public.world_entry_bonds(world_id);

-- ---------------------------------------------------------------------------
-- 2. Guards
-- ---------------------------------------------------------------------------

create function public.world_entry_bond_check() returns trigger
language plpgsql security definer set search_path = '' as $$
declare v_entry public.world_entries;
begin
  if tg_op = 'UPDATE' then
    if new.entry_id <> old.entry_id or new.character_id <> old.character_id
      or new.world_id <> old.world_id or new.kind <> old.kind then
      raise exception 'A bond cannot move to another entry, character or kind'
        using errcode = '23514', hint = 'invalid_bond';
    end if;
    new.updated_at := now();
    return new;
  end if;

  select * into v_entry from public.world_entries where id = new.entry_id;
  new.world_id := v_entry.world_id;
  if not coalesce((select (c->>'supports_bonds')::boolean
    from public.get_world_effective_categories(v_entry.world_id) c
    where (c->>'id')::uuid = v_entry.category_id), false) then
    raise exception 'This category does not have bonds'
      using errcode = '23514', hint = 'bonds_not_supported';
  end if;
  if not exists (select 1 from public.characters ch
    join public.games g on g.id = ch.game_id
    where ch.id = new.character_id and g.world_id = v_entry.world_id) then
    raise exception 'Only characters in a game linked to this world can bond with its entries'
      using errcode = '23514', hint = 'character_not_in_world';
  end if;
  return new;
end $$;

create trigger world_entry_bonds_check before insert or update on public.world_entry_bonds
  for each row execute function public.world_entry_bond_check();

revoke all on function public.world_entry_bond_check() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 3. RLS
-- ---------------------------------------------------------------------------
-- The world_entries subqueries are filtered by the entry read policy.

drop policy "World members can read world_entry_bonds" on public.world_entry_bonds;
drop policy "Character editors can insert world_entry_bonds" on public.world_entry_bonds;
drop policy "Character editors can delete world_entry_bonds" on public.world_entry_bonds;

create policy "World entry bonds follow their entry for reads"
on public.world_entry_bonds for select to authenticated
using (exists (select 1 from public.world_entries we where we.id = world_entry_bonds.entry_id));

create policy "Character editors can add bonds with entries they can read"
on public.world_entry_bonds for insert to authenticated
with check (
  public.can_edit_character(world_entry_bonds.character_id, ( select auth.uid() ))
  and exists (select 1 from public.world_entries we where we.id = world_entry_bonds.entry_id));

create policy "Character editors can update bonds with entries they can read"
on public.world_entry_bonds for update to authenticated
using (
  public.can_edit_character(world_entry_bonds.character_id, ( select auth.uid() ))
  and exists (select 1 from public.world_entries we where we.id = world_entry_bonds.entry_id))
with check (
  public.can_edit_character(world_entry_bonds.character_id, ( select auth.uid() ))
  and exists (select 1 from public.world_entries we where we.id = world_entry_bonds.entry_id));

create policy "Character editors can remove bonds with entries they can read"
on public.world_entry_bonds for delete to authenticated
using (
  public.can_edit_character(world_entry_bonds.character_id, ( select auth.uid() ))
  and exists (select 1 from public.world_entries we where we.id = world_entry_bonds.entry_id));

commit;
