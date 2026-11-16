-- World truths (#164).
--
-- A world keeps one choice per truth of its setting: a Datasworn option (and,
-- for Starforged, the row picked on that option's sub-table), or a truth its
-- Guides wrote themselves. Choices are keyed by the Datasworn truth id, so
-- every game linked to the world sees the same truths, and a world whose
-- setting changes keeps them: the screen shows the current setting's truths,
-- and switching back brings the old choices back. A choice whose truth or
-- option a rules update removed stays stored and reads as not chosen.
--
-- Players read only the chosen descriptions. A Datasworn option's quest
-- starter and the options that weren't picked come from the bundled rules
-- data, and only Guides' screens show them. A written truth's quest starter
-- is the Guides' own text, so it lives in its own table that only world
-- editors and Guides read.
--
-- 1. world_truths: one row per world and truth, readable by every member,
--    written by world editors and Guides (the people who edit world Notes).
-- 2. world_truth_quest_starters: a written truth's quest starter, readable
--    only by world editors and Guides, written only by set_world_custom_truth,
--    and removed when its truth stops being a written one.
-- 3. set_world_custom_truth(): saves a written truth and its quest starter in
--    one step.
begin;

-- ---------------------------------------------------------------------------
-- 1. Truths
-- ---------------------------------------------------------------------------

create table public.world_truths (
  world_id uuid not null references public.worlds(id) on delete cascade,
  -- The Datasworn truth id, such as truth:starforged/cataclysm.
  truth_id text not null
    constraint world_truths_truth_id_check check (truth_id like 'truth:%' and length(truth_id) <= 200),
  -- The chosen Datasworn option id, or null for a written truth.
  option_id text
    constraint world_truths_option_id_check check (length(option_id) between 1 and 200),
  -- The row chosen on the option's sub-table (Starforged), if any.
  sub_option_id text
    constraint world_truths_sub_option_id_check check (length(sub_option_id) between 1 and 200),
  -- A written truth's description, shown to everyone.
  custom_description text
    constraint world_truths_custom_description_check check (length(custom_description) <= 10000),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  primary key (world_id, truth_id),
  constraint world_truths_choice_check check (
    (option_id is null) <> (custom_description is null)
    and (sub_option_id is null or option_id is not null)
  )
);

alter table public.world_truths enable row level security;
alter table public.world_truths replica identity full;
alter publication supabase_realtime add table public.world_truths;

-- A truth never moves to another world or truth: change the choice instead.
revoke all on public.world_truths from anon, authenticated;
grant select, delete on public.world_truths to authenticated;
grant insert (world_id, truth_id, option_id, sub_option_id, custom_description)
  on public.world_truths to authenticated;
grant update (option_id, sub_option_id, custom_description)
  on public.world_truths to authenticated;

create trigger world_truths_set_updated_at
  before update on public.world_truths
  for each row execute function public.set_updated_at();

create policy "World members read world truths"
on public.world_truths for select to authenticated
using (public.world_role(world_id, (select auth.uid())) <> 'none');

create policy "World editors and Guides choose world truths"
on public.world_truths for insert to authenticated
with check (public.world_role(world_id, (select auth.uid())) in ('owner', 'editor', 'guide'));

create policy "World editors and Guides change world truths"
on public.world_truths for update to authenticated
using (public.world_role(world_id, (select auth.uid())) in ('owner', 'editor', 'guide'))
with check (public.world_role(world_id, (select auth.uid())) in ('owner', 'editor', 'guide'));

create policy "World editors and Guides clear world truths"
on public.world_truths for delete to authenticated
using (public.world_role(world_id, (select auth.uid())) in ('owner', 'editor', 'guide'));

-- ---------------------------------------------------------------------------
-- 2. Quest starters of written truths
-- ---------------------------------------------------------------------------

create table public.world_truth_quest_starters (
  world_id uuid not null,
  truth_id text not null,
  quest_starter text not null
    constraint world_truth_quest_starters_length_check check (length(quest_starter) <= 10000),
  updated_at timestamp with time zone not null default now(),
  primary key (world_id, truth_id),
  foreign key (world_id, truth_id) references public.world_truths(world_id, truth_id)
    on delete cascade
);

alter table public.world_truth_quest_starters enable row level security;
alter table public.world_truth_quest_starters replica identity full;
alter publication supabase_realtime add table public.world_truth_quest_starters;

-- Clients only read them; set_world_custom_truth() writes them.
revoke all on public.world_truth_quest_starters from anon, authenticated;
grant select on public.world_truth_quest_starters to authenticated;

create trigger world_truth_quest_starters_set_updated_at
  before update on public.world_truth_quest_starters
  for each row execute function public.set_updated_at();

create policy "World editors and Guides read written truths' quest starters"
on public.world_truth_quest_starters for select to authenticated
using (public.world_role(world_id, (select auth.uid())) in ('owner', 'editor', 'guide'));

-- Choosing a Datasworn option for a written truth drops its quest starter, so
-- nothing the Guides wrote outlives the truth it belonged to.
create function public.world_truths_drop_quest_starter() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  delete from public.world_truth_quest_starters
    where world_id = new.world_id and truth_id = new.truth_id;
  return null;
end $$;

revoke all on function public.world_truths_drop_quest_starter() from public, anon, authenticated;

create trigger world_truths_drop_quest_starter
  after update of option_id on public.world_truths
  for each row when (new.option_id is not null and old.option_id is null)
  execute function public.world_truths_drop_quest_starter();

-- ---------------------------------------------------------------------------
-- 3. Saving a written truth
-- ---------------------------------------------------------------------------

-- Writes the description everyone reads and the quest starter only Guides
-- read, together. An empty quest starter removes it.
create function public.set_world_custom_truth(
    p_world_id uuid,
    p_truth_id text,
    p_description text,
    p_quest_starter text
)
 returns void
 language plpgsql
 security definer
 set search_path to ''
as $function$
begin
    if auth.uid() is null
       or public.world_role(p_world_id, auth.uid()) not in ('owner', 'editor', 'guide') then
        raise exception 'Only world editors and Guides can write world truths'
          using errcode = '42501';
    end if;

    insert into public.world_truths(world_id, truth_id, option_id, sub_option_id, custom_description)
      values (p_world_id, p_truth_id, null, null, coalesce(p_description, ''))
      on conflict (world_id, truth_id) do update
        set option_id = null, sub_option_id = null, custom_description = excluded.custom_description;

    if coalesce(p_quest_starter, '') = '' then
      delete from public.world_truth_quest_starters
        where world_id = p_world_id and truth_id = p_truth_id;
    else
      insert into public.world_truth_quest_starters(world_id, truth_id, quest_starter)
        values (p_world_id, p_truth_id, p_quest_starter)
        on conflict (world_id, truth_id) do update set quest_starter = excluded.quest_starter;
    end if;
end;
$function$;

revoke execute on function public.set_world_custom_truth(uuid, text, text, text) from public;
revoke execute on function public.set_world_custom_truth(uuid, text, text, text) from anon;
grant execute on function public.set_world_custom_truth(uuid, text, text, text) to authenticated;
grant execute on function public.set_world_custom_truth(uuid, text, text, text) to service_role;

commit;
