-- Oracle target changes in shared worlds (#235).
--
-- A customized world's field stores the oracle it rolls (`resolvedOracleId`
-- in its binding, or in a rule's binding). Which oracle a binding resolves to
-- depends on the world's effective playset, the union of its linked games'
-- playsets: Starsmith replaces Starforged oracles only while a linked game
-- includes it. So linking a game, unlinking one, or changing a linked game's
-- playset can move what a field rolls. The playsets live in the bundled
-- Datasworn data, so clients work out the new targets; the database applies
-- them as compare-and-set writes and keeps a record for the other games.
--
-- 1. world_oracle_changes: one open change per binding whose roll target
--    moved and that nobody has reviewed yet, read by world editors and Guides.
--    A later change to the same binding merges into it; a change back to
--    where it started removes it. Editing the binding by hand closes it.
-- 2. world_oracle_change_dismissals: how far each game has dismissed the
--    "fields now roll different oracles" banner.
-- 3. world_oracle_apply_changes(): the shared compare-and-set. Each change
--    names the target the binding rolls today, so a stale or repeated call
--    writes nothing and concurrent clients can't record a change twice.
-- 4. record_world_oracle_changes(): a client that reads the world and finds a
--    binding whose target moved without anyone choosing (a game deleted, a
--    rules update) records it.
-- 5. link_game_to_world(), unlink_game_from_world() and update_game_rules()
--    take the choices made in the save dialog and apply them in the same
--    transaction as the change itself.
-- 6. resolve_world_oracle_change() and dismiss_world_oracle_changes().
begin;

-- ---------------------------------------------------------------------------
-- 1. Changes
-- ---------------------------------------------------------------------------

create sequence public.world_oracle_changes_seq;

create table public.world_oracle_changes (
  id uuid primary key default gen_random_uuid(),
  world_id uuid not null references public.worlds(id) on delete cascade,
  field_definition_id uuid not null
    references public.world_field_definitions(id) on delete cascade,
  -- Null for the field's own binding, else the index of the rule whose
  -- binding moved.
  rule_index integer
    constraint world_oracle_changes_rule_index_check check (rule_index between 0 and 63),
  -- What the binding rolled before the first unreviewed change, and now.
  previous_oracle_id text not null
    constraint world_oracle_changes_previous_check check (length(previous_oracle_id) between 1 and 1024),
  next_oracle_id text not null
    constraint world_oracle_changes_next_check check (length(next_oracle_id) between 1 and 1024),
  -- The game whose link, unlink or playset change caused it, when known. That
  -- game's people chose already, so they see no banner for it.
  source_game_id uuid references public.games(id) on delete set null,
  -- Orders changes for the banner's dismissal; a merged change takes a new
  -- number, so it shows again in games that dismissed the earlier one.
  seq bigint not null default nextval('public.world_oracle_changes_seq'),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint world_oracle_changes_moved_check check (previous_oracle_id <> next_oracle_id)
);

alter sequence public.world_oracle_changes_seq owned by public.world_oracle_changes.seq;

create unique index world_oracle_changes_binding_key
  on public.world_oracle_changes (field_definition_id, coalesce(rule_index, -1));
create index world_oracle_changes_world_id_idx on public.world_oracle_changes (world_id);

alter table public.world_oracle_changes enable row level security;
alter table public.world_oracle_changes replica identity full;
alter publication supabase_realtime add table public.world_oracle_changes;

-- Clients only read them; the functions below write them.
revoke all on public.world_oracle_changes from anon, authenticated;
grant select on public.world_oracle_changes to authenticated;
revoke all on sequence public.world_oracle_changes_seq from public, anon, authenticated;

create policy "World editors and Guides read oracle changes"
on public.world_oracle_changes for select to authenticated
using (public.world_role(world_id, (select auth.uid())) in ('owner', 'editor', 'guide'));

-- Any write that leaves a binding rolling something other than its change's
-- new target (a person choosing another oracle, pinning one, removing the
-- binding or its rule) settles the change, so a flag never outlives the
-- binding it describes.
create function public.world_oracle_changes_close_stale() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  delete from public.world_oracle_changes c
    where c.field_definition_id = new.id
      and (case when c.rule_index is null then new.binding
            else new.configuration->'rules'->c.rule_index->'binding' end)
          ->>'resolvedOracleId' is distinct from c.next_oracle_id;
  return null;
end $$;

revoke all on function public.world_oracle_changes_close_stale() from public, anon, authenticated;

create trigger world_field_definitions_close_stale_oracle_changes
  after update of binding, configuration on public.world_field_definitions
  for each row
  when (old.binding is distinct from new.binding or old.configuration is distinct from new.configuration)
  execute function public.world_oracle_changes_close_stale();

-- ---------------------------------------------------------------------------
-- 2. Banner dismissals
-- ---------------------------------------------------------------------------

create table public.world_oracle_change_dismissals (
  game_id uuid not null references public.games(id) on delete cascade,
  world_id uuid not null references public.worlds(id) on delete cascade,
  -- Changes up to this number are dismissed in this game.
  dismissed_seq bigint not null,
  updated_at timestamp with time zone not null default now(),
  primary key (game_id, world_id)
);

alter table public.world_oracle_change_dismissals enable row level security;
alter table public.world_oracle_change_dismissals replica identity full;
alter publication supabase_realtime add table public.world_oracle_change_dismissals;

revoke all on public.world_oracle_change_dismissals from anon, authenticated;
grant select on public.world_oracle_change_dismissals to authenticated;

create policy "Game members read their game's oracle change dismissals"
on public.world_oracle_change_dismissals for select to authenticated
using (exists (
  select 1 from public.game_players gp
  where gp.game_id = world_oracle_change_dismissals.game_id
    and gp.user_id = (select auth.uid())
));

-- ---------------------------------------------------------------------------
-- 3. Applying changes
-- ---------------------------------------------------------------------------

-- p_changes is a list of
--   { fieldId, ruleIndex (null or a number), previousOracleId,
--     nextOracleId, keep (optional boolean) }
-- previousOracleId is what the binding rolls today. With keep, the binding is
-- pinned to it exactly (Keep the old oracle) and nothing is recorded, because
-- nothing changes for anyone. Otherwise it rolls nextOracleId from now on and
-- the change is recorded. A change whose binding no longer rolls
-- previousOracleId is skipped: someone got there first, and a reader records
-- whatever is still left. Returns how many changes were applied.
--
-- Not exposed: callers check who may change the world first.
create function public.world_oracle_apply_changes(
    p_world_id uuid,
    p_source_game_id uuid,
    p_changes jsonb
)
 returns integer
 language plpgsql
 security definer
 set search_path to ''
as $function$
declare
  v_change jsonb;
  v_field public.world_field_definitions;
  v_rule_index integer;
  v_previous text;
  v_next text;
  v_keep boolean;
  v_binding jsonb;
  v_package text;
  v_existing public.world_oracle_changes;
  v_applied integer := 0;
begin
  if p_changes is null or p_changes = 'null'::jsonb then return 0; end if;
  if jsonb_typeof(p_changes) <> 'array' or jsonb_array_length(p_changes) > 1000 then
    raise exception 'Invalid oracle changes';
  end if;
  if jsonb_array_length(p_changes) = 0 then return 0; end if;

  -- The configuration guards take the same lock first, so this orders with
  -- every other configuration write.
  perform 1 from public.worlds where id = p_world_id for update;
  if not found then raise exception 'Unknown world'; end if;

  for v_change in select value from jsonb_array_elements(p_changes) loop
    if jsonb_typeof(v_change) <> 'object'
      or not (v_change ?& array['fieldId','ruleIndex','previousOracleId','nextOracleId'])
      or v_change - array['fieldId','ruleIndex','previousOracleId','nextOracleId','keep'] <> '{}'::jsonb
      or jsonb_typeof(v_change->'fieldId') <> 'string'
      or jsonb_typeof(v_change->'ruleIndex') not in ('null','number')
      or jsonb_typeof(v_change->'previousOracleId') <> 'string'
      or jsonb_typeof(v_change->'nextOracleId') <> 'string'
      or length(v_change->>'previousOracleId') not between 1 and 1024
      or length(v_change->>'nextOracleId') not between 1 and 1024
      or (v_change ? 'keep' and jsonb_typeof(v_change->'keep') <> 'boolean') then
      raise exception 'Invalid oracle change';
    end if;
    v_rule_index := (v_change->>'ruleIndex')::integer;
    if v_rule_index is not null and v_rule_index not between 0 and 63 then
      raise exception 'Invalid oracle change';
    end if;
    v_previous := v_change->>'previousOracleId';
    v_next := v_change->>'nextOracleId';
    v_keep := coalesce((v_change->>'keep')::boolean, false);

    select * into v_field from public.world_field_definitions
      where id = (v_change->>'fieldId')::uuid and world_id = p_world_id
      for update;
    if not found then continue; end if;

    v_binding := case when v_rule_index is null then v_field.binding
      else v_field.configuration->'rules'->v_rule_index->'binding' end;
    if v_binding is null or jsonb_typeof(v_binding) <> 'object'
      or v_binding->>'resolvedOracleId' is distinct from v_previous then
      continue;
    end if;

    if v_keep then
      if coalesce((v_binding->>'exact')::boolean, false) and v_binding->>'oracleId' = v_previous then
        continue;
      end if;
      -- "oracle_rollable:starsmith/..." belongs to the starsmith package.
      v_package := nullif(split_part(split_part(v_previous, ':', 2), '/', 1), '');
      v_binding := jsonb_build_object(
        'packageId', coalesce(v_package, v_binding->>'packageId'),
        'oracleId', v_previous,
        'resolvedOracleId', v_previous,
        'exact', true);
    else
      if v_next = v_previous then continue; end if;
      -- Record before writing, so the stale-change trigger sees the merged
      -- change's new target and leaves it open.
      select * into v_existing from public.world_oracle_changes
        where field_definition_id = v_field.id
          and coalesce(rule_index, -1) = coalesce(v_rule_index, -1)
        for update;
      if found then
        if v_existing.previous_oracle_id = v_next then
          delete from public.world_oracle_changes where id = v_existing.id;
        else
          update public.world_oracle_changes
            set next_oracle_id = v_next,
                source_game_id = p_source_game_id,
                seq = nextval('public.world_oracle_changes_seq'),
                updated_at = now()
            where id = v_existing.id;
        end if;
      else
        insert into public.world_oracle_changes(world_id, field_definition_id, rule_index,
            previous_oracle_id, next_oracle_id, source_game_id)
          values (p_world_id, v_field.id, v_rule_index, v_previous, v_next, p_source_game_id);
      end if;
      v_binding := v_binding || jsonb_build_object('resolvedOracleId', v_next);
    end if;

    if v_rule_index is null then
      update public.world_field_definitions set binding = v_binding where id = v_field.id;
    else
      update public.world_field_definitions
        set configuration = jsonb_set(configuration,
          array['rules', v_rule_index::text, 'binding'], v_binding)
        where id = v_field.id;
    end if;
    v_applied := v_applied + 1;
  end loop;

  return v_applied;
end;
$function$;

revoke all on function public.world_oracle_apply_changes(uuid, uuid, jsonb) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 4. Recording changes found on read
-- ---------------------------------------------------------------------------

-- Nobody chose these, so they always move to the new target (keep is not
-- accepted) and belong to no game. Only world editors and Guides record, as
-- they are the people who may change the bindings anyway.
--
-- p_playsets is the linked playsets (get_world_playsets) the client worked
-- the targets out from. Realtime brings a game's new playset and the fields a
-- save dialog moved on separate channels, so a client can briefly hold new
-- fields and old playsets; recording then would move the fields straight
-- back. Playsets that no longer match record nothing.
create function public.record_world_oracle_changes(
    p_world_id uuid,
    p_changes jsonb,
    p_playsets jsonb
)
 returns integer
 language plpgsql
 security definer
 set search_path to ''
as $function$
begin
  if auth.uid() is null
     or public.world_role(p_world_id, auth.uid()) not in ('owner', 'editor', 'guide') then
    raise exception 'Only world editors and Guides can record oracle changes' using errcode = '42501';
  end if;
  if jsonb_typeof(p_changes) = 'array' and exists (
    select 1 from jsonb_array_elements(p_changes) c
    where jsonb_typeof(c) = 'object' and c->'keep' = 'true'::jsonb
  ) then
    raise exception 'Invalid oracle change';
  end if;
  -- Games changing their playsets or links lock the world row too.
  perform 1 from public.worlds where id = p_world_id for update;
  if p_playsets is distinct from (
    select coalesce(jsonb_agg(jsonb_build_object('rulesets', rulesets,
      'expansions', expansions, 'playset', playset) order by id), '[]'::jsonb)
    from public.games where world_id = p_world_id
  ) then
    return 0;
  end if;
  return public.world_oracle_apply_changes(p_world_id, null, p_changes);
end;
$function$;

revoke execute on function public.record_world_oracle_changes(uuid, jsonb, jsonb) from public, anon;
grant execute on function public.record_world_oracle_changes(uuid, jsonb, jsonb) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 5. The changes that move targets, with the save dialog's choices
-- ---------------------------------------------------------------------------

-- Linking may also take the game away from the world it was linked to, so
-- each change names its world: the new one, or the one being left.
-- Authorisation is unchanged from 20260911000000_changes.sql; choices for the
-- world being left need world editor or Guide rights there.
drop function public.link_game_to_world(uuid, uuid);

create function public.link_game_to_world(
    p_game_id uuid,
    p_world_id uuid,
    p_oracle_changes jsonb default '[]'::jsonb
)
 returns jsonb
 language plpgsql
 security definer
 set search_path to ''
as $function$
declare
    v_uid uuid := auth.uid();
    v_world_role text;
    v_previous_world_id uuid;
    v_new_changes jsonb;
    v_previous_changes jsonb;
    v_applied integer := 0;
begin
    if v_uid is null then
        raise exception 'Must be authenticated to link a game to a world';
    end if;

    if not public.is_game_guide(p_game_id, v_uid) then
        raise exception 'Must be a guide of the game to link it to a world';
    end if;

    -- World side: explicit owner/editor only -- never a game-derived role.
    v_world_role := public.world_role(p_world_id, v_uid);

    if v_world_role not in ('owner', 'editor') then
        raise exception 'Must be an owner or editor of the world to link a game to it';
    end if;

    if not exists (select 1 from public.worlds w where w.id = p_world_id) then
        raise exception 'World not found';
    end if;

    if p_oracle_changes is null or jsonb_typeof(p_oracle_changes) <> 'array'
      or exists (select 1 from jsonb_array_elements(p_oracle_changes) c
        where jsonb_typeof(c) <> 'object' or jsonb_typeof(c->'worldId') is distinct from 'string') then
        raise exception 'Invalid oracle changes';
    end if;

    select world_id into v_previous_world_id from public.games where id = p_game_id for update;

    select coalesce(jsonb_agg(c - 'worldId') filter (where (c->>'worldId')::uuid = p_world_id), '[]'::jsonb),
           coalesce(jsonb_agg(c - 'worldId') filter (where (c->>'worldId')::uuid is distinct from p_world_id), '[]'::jsonb)
      into v_new_changes, v_previous_changes
      from jsonb_array_elements(p_oracle_changes) c;

    if jsonb_array_length(v_previous_changes) > 0 then
        if v_previous_world_id is null or v_previous_world_id = p_world_id
          or exists (select 1 from jsonb_array_elements(p_oracle_changes) c
            where (c->>'worldId')::uuid not in (p_world_id, v_previous_world_id))
          or public.world_role(v_previous_world_id, v_uid) not in ('owner', 'editor', 'guide') then
            raise exception 'Oracle changes must belong to the worlds this link changes'
              using errcode = '42501';
        end if;
        v_applied := v_applied
          + public.world_oracle_apply_changes(v_previous_world_id, p_game_id, v_previous_changes);
    end if;

    update public.games
       set world_id = p_world_id
     where id = p_game_id;

    v_applied := v_applied + public.world_oracle_apply_changes(p_world_id, p_game_id, v_new_changes);

    return jsonb_build_object('appliedOracleChanges', v_applied);
end;
$function$;

revoke execute on function public.link_game_to_world(uuid, uuid, jsonb) from public;
revoke execute on function public.link_game_to_world(uuid, uuid, jsonb) from anon;
grant execute on function public.link_game_to_world(uuid, uuid, jsonb) to authenticated;
grant execute on function public.link_game_to_world(uuid, uuid, jsonb) to service_role;

-- Unlinking still needs no rights on the world. Choices do: the Guide of a
-- linked game is a Guide of its world until the unlink, which is enough.
drop function public.unlink_game_from_world(uuid);

create function public.unlink_game_from_world(
    p_game_id uuid,
    p_oracle_changes jsonb default '[]'::jsonb
)
 returns void
 language plpgsql
 security definer
 set search_path to ''
as $function$
declare
    v_uid uuid := auth.uid();
    v_world_id uuid;
begin
    if v_uid is null then
        raise exception 'Must be authenticated to unlink a game from a world';
    end if;

    if not public.is_game_guide(p_game_id, v_uid) then
        raise exception 'Must be a guide of the game to unlink it from a world';
    end if;

    select world_id into v_world_id from public.games where id = p_game_id for update;

    if p_oracle_changes is not null and jsonb_typeof(p_oracle_changes) = 'array'
      and jsonb_array_length(p_oracle_changes) > 0 then
        if v_world_id is null
          or public.world_role(v_world_id, v_uid) not in ('owner', 'editor', 'guide') then
            raise exception 'Only world editors and Guides can choose oracle changes'
              using errcode = '42501';
        end if;
        perform public.world_oracle_apply_changes(v_world_id, p_game_id, p_oracle_changes);
    end if;

    update public.games
       set world_id = null
     where id = p_game_id;
end;
$function$;

revoke execute on function public.unlink_game_from_world(uuid, jsonb) from public;
revoke execute on function public.unlink_game_from_world(uuid, jsonb) from anon;
grant execute on function public.unlink_game_from_world(uuid, jsonb) to authenticated;
grant execute on function public.unlink_game_from_world(uuid, jsonb) to service_role;

-- Saves a game's rulesets, expansions and playset together with the choices
-- for its world's fields. Who may save follows the games table's update
-- policy (any member of the game); choices need world editor or Guide rights.
create function public.update_game_rules(
    p_game_id uuid,
    p_rulesets jsonb,
    p_expansions jsonb,
    p_playset jsonb,
    p_oracle_changes jsonb default '[]'::jsonb
)
 returns void
 language plpgsql
 security definer
 set search_path to ''
as $function$
declare
    v_uid uuid := auth.uid();
    v_world_id uuid;
begin
    if v_uid is null or not exists (
      select 1 from public.game_players gp where gp.game_id = p_game_id and gp.user_id = v_uid
    ) then
        raise exception 'Only players in the game can change its rules' using errcode = '42501';
    end if;
    if jsonb_typeof(p_rulesets) is distinct from 'object'
      or jsonb_typeof(p_expansions) is distinct from 'object'
      or jsonb_typeof(p_playset) is distinct from 'object' then
        raise exception 'Invalid game rules';
    end if;

    select world_id into v_world_id from public.games where id = p_game_id for update;

    update public.games
       set rulesets = p_rulesets, expansions = p_expansions, playset = p_playset
     where id = p_game_id;

    if p_oracle_changes is not null and jsonb_typeof(p_oracle_changes) = 'array'
      and jsonb_array_length(p_oracle_changes) > 0 then
        if v_world_id is null
          or public.world_role(v_world_id, v_uid) not in ('owner', 'editor', 'guide') then
            raise exception 'Only world editors and Guides can choose oracle changes'
              using errcode = '42501';
        end if;
        perform public.world_oracle_apply_changes(v_world_id, p_game_id, p_oracle_changes);
    end if;
end;
$function$;

revoke execute on function public.update_game_rules(uuid, jsonb, jsonb, jsonb, jsonb) from public;
revoke execute on function public.update_game_rules(uuid, jsonb, jsonb, jsonb, jsonb) from anon;
grant execute on function public.update_game_rules(uuid, jsonb, jsonb, jsonb, jsonb) to authenticated;
grant execute on function public.update_game_rules(uuid, jsonb, jsonb, jsonb, jsonb) to service_role;

-- ---------------------------------------------------------------------------
-- 6. Reviewing changes
-- ---------------------------------------------------------------------------

-- The field menu's fixes. Keeping the new oracle (follow the playsets) only
-- settles the change. Keeping the previous one pins the binding to it, if it
-- still rolls the change's new target; the stale-change trigger then settles
-- it. Choosing another oracle is an ordinary configuration edit, which
-- settles it the same way. Returns whether the change was open.
create function public.resolve_world_oracle_change(p_change_id uuid, p_keep_previous boolean)
 returns boolean
 language plpgsql
 security definer
 set search_path to ''
as $function$
declare
    v_change public.world_oracle_changes;
begin
    select * into v_change from public.world_oracle_changes where id = p_change_id;
    if not found or auth.uid() is null
       or public.world_role(v_change.world_id, auth.uid()) not in ('owner', 'editor', 'guide') then
        return false;
    end if;

    -- Same lock order as every configuration write: the world, then the change.
    perform 1 from public.worlds where id = v_change.world_id for update;
    select * into v_change from public.world_oracle_changes where id = p_change_id for update;
    if not found then return false; end if;

    if coalesce(p_keep_previous, false) then
        update public.world_field_definitions f
          set binding = case when v_change.rule_index is null then
                jsonb_build_object(
                  'packageId', coalesce(nullif(split_part(split_part(v_change.previous_oracle_id, ':', 2), '/', 1), ''),
                    f.binding->>'packageId'),
                  'oracleId', v_change.previous_oracle_id,
                  'resolvedOracleId', v_change.previous_oracle_id,
                  'exact', true)
                else f.binding end,
              configuration = case when v_change.rule_index is null then f.configuration
                else jsonb_set(f.configuration, array['rules', v_change.rule_index::text, 'binding'],
                  jsonb_build_object(
                    'packageId', coalesce(nullif(split_part(split_part(v_change.previous_oracle_id, ':', 2), '/', 1), ''),
                      f.configuration->'rules'->v_change.rule_index->'binding'->>'packageId'),
                    'oracleId', v_change.previous_oracle_id,
                    'resolvedOracleId', v_change.previous_oracle_id,
                    'exact', true))
                end
          where f.id = v_change.field_definition_id
            and (case when v_change.rule_index is null then f.binding
                  else f.configuration->'rules'->v_change.rule_index->'binding' end)
                ->>'resolvedOracleId' = v_change.next_oracle_id;
    end if;

    -- Keeping the previous target already settled it through the trigger.
    delete from public.world_oracle_changes where id = p_change_id;
    return true;
end;
$function$;

revoke execute on function public.resolve_world_oracle_change(uuid, boolean) from public, anon;
grant execute on function public.resolve_world_oracle_change(uuid, boolean) to authenticated, service_role;

-- Hides the banner in one game for every change up to p_seq. Shared by the
-- game's people who can review it (world editors and Guides who belong to
-- the game); a later change shows it again.
create function public.dismiss_world_oracle_changes(p_game_id uuid, p_seq bigint)
 returns void
 language plpgsql
 security definer
 set search_path to ''
as $function$
declare
    v_uid uuid := auth.uid();
    v_world_id uuid;
begin
    select world_id into v_world_id from public.games where id = p_game_id;
    if v_uid is null or v_world_id is null or p_seq is null
       or not exists (select 1 from public.game_players gp
         where gp.game_id = p_game_id and gp.user_id = v_uid)
       or public.world_role(v_world_id, v_uid) not in ('owner', 'editor', 'guide') then
        raise exception 'Only world editors and Guides in the game can dismiss oracle changes'
          using errcode = '42501';
    end if;

    insert into public.world_oracle_change_dismissals(game_id, world_id, dismissed_seq)
      values (p_game_id, v_world_id, p_seq)
      on conflict (game_id, world_id) do update
        set dismissed_seq = greatest(public.world_oracle_change_dismissals.dismissed_seq, excluded.dismissed_seq),
            updated_at = now();
end;
$function$;

revoke execute on function public.dismiss_world_oracle_changes(uuid, bigint) from public, anon;
grant execute on function public.dismiss_world_oracle_changes(uuid, bigint) to authenticated, service_role;

commit;
