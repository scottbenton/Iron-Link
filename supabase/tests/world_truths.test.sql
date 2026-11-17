-- World truths: one choice per truth per world, read by every member and
-- written by world editors and Guides. A written truth's quest starter is read
-- only by world editors and Guides, saved with its truth in one step, and
-- removed when a Datasworn option replaces the written truth. Every fixture is
-- rolled back.
begin;
create extension if not exists pgtap with schema extensions;
set search_path = public,extensions;
select no_plan();

-- 1 owner, 2 world editor, 3 Guide, 4 player, 5 viewer, 6 outsider,
-- 7 co-op member (a Guide of an unguided game).
insert into auth.users(id)
  select ('e2100000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid from generate_series(1,7) n;
create temporary table truth_worlds(key text primary key,id uuid);
grant all on truth_worlds to authenticated;
create function pg_temp.u(p_n integer) returns uuid language sql as $$
  select ('e2100000-0000-4000-8000-'||lpad(p_n::text,12,'0'))::uuid $$;
create function pg_temp.as_user(p_n integer) returns void language sql as $$
  select set_config('request.jwt.claim.sub',pg_temp.u(p_n)::text,true) $$;
create function pg_temp.w(p_key text) returns uuid language sql as $$
  select id from truth_worlds where key=p_key $$;
create function pg_temp.game(p_n integer) returns uuid language sql as $$
  select ('e2500000-0000-4000-8000-'||lpad(p_n::text,12,'0'))::uuid $$;
create function pg_temp.choose(p_truth text,p_option text,p_sub text default null) returns void language sql as $$
  insert into public.world_truths(world_id,truth_id,option_id,sub_option_id)
    values (pg_temp.w('main'),p_truth,p_option,p_sub)
    on conflict (world_id,truth_id) do update set option_id=excluded.option_id,
      sub_option_id=excluded.sub_option_id, custom_description=null $$;
create function pg_temp.write(p_truth text,p_description text,p_quest text) returns void language sql as $$
  select public.set_world_custom_truth(pg_temp.w('main'),p_truth,p_description,p_quest) $$;
create function pg_temp.truths() returns text language sql as $$
  select coalesce(string_agg(truth_id||'='||coalesce(option_id,'custom:'||custom_description)
    ||coalesce('/'||sub_option_id,''),', ' order by truth_id),'')
  from public.world_truths where world_id=pg_temp.w('main') $$;
create function pg_temp.quests() returns text language sql as $$
  select coalesce(string_agg(truth_id||'='||quest_starter,', ' order by truth_id),'')
  from public.world_truth_quest_starters where world_id=pg_temp.w('main') $$;
create function pg_temp.outcome(p_sql text) returns text language plpgsql as $$
declare v_state text; v_message text;
begin
  execute p_sql;
  return 'ok';
exception when others then
  get stacked diagnostics v_state = returned_sqlstate, v_message = message_text;
  return v_state||' '||v_message;
end $$;
grant execute on function pg_temp.outcome(text) to authenticated;

select is((select count(*) from pg_policies where schemaname='public' and tablename='world_truths'),4::bigint,
  'truths have one policy each for reading, choosing, changing and clearing');
select is((select count(*) from pg_policies where schemaname='public' and tablename='world_truth_quest_starters'),1::bigint,
  'quest starters have only a read policy');
select ok(not has_table_privilege('authenticated','public.world_truth_quest_starters','INSERT')
  and not has_table_privilege('authenticated','public.world_truth_quest_starters','UPDATE')
  and not has_table_privilege('authenticated','public.world_truth_quest_starters','DELETE'),
  'clients write quest starters only through set_world_custom_truth');
select ok(not has_column_privilege('authenticated','public.world_truths','world_id','UPDATE')
  and not has_column_privilege('authenticated','public.world_truths','truth_id','UPDATE'),
  'a truth never moves to another world or truth');
select ok(not has_function_privilege('authenticated','public.world_truths_drop_quest_starter()','EXECUTE'),
  'the quest starter clean-up is not exposed to clients');
select ok(not has_function_privilege('anon','public.set_world_custom_truth(uuid,text,text,text)','EXECUTE'),
  'signed out visitors cannot write truths');

-- Fixtures: a world linked to a guided game and a co-op game, and another
-- world.
set local role authenticated;
select pg_temp.as_user(1);
insert into truth_worlds values ('main',public.create_world('Truths','starforged')),('other',public.create_world('Other'));
reset role;
insert into public.games(id,name,game_type,world_id) values
  (pg_temp.game(1),'Guided','guided',pg_temp.w('main')),
  (pg_temp.game(2),'Co-op','co-op',pg_temp.w('main'));
insert into public.game_players(game_id,user_id,role) values
  (pg_temp.game(1),pg_temp.u(3),'guide'),(pg_temp.game(1),pg_temp.u(4),'player'),
  (pg_temp.game(2),pg_temp.u(7),'guide');
insert into public.world_players(world_id,user_id,role) values
  (pg_temp.w('main'),pg_temp.u(2),'editor'),(pg_temp.w('main'),pg_temp.u(5),'viewer');

set local role authenticated;

-- Choosing
select pg_temp.as_user(3);
select is(pg_temp.outcome($$select pg_temp.choose('truth:starforged/cataclysm','truth.option:starforged/cataclysm.0',
  'truth.option.oracle_rollable.row:starforged/cataclysm.0.sun_plague_cause.0')$$),'ok',
  'a Guide chooses an option and a sub-table row');
select pg_temp.as_user(2);
select is(pg_temp.outcome($$select pg_temp.choose('truth:starforged/exodus','truth.option:starforged/exodus.1')$$),'ok',
  'a world editor chooses an option');
select pg_temp.as_user(7);
select is(pg_temp.outcome($$select pg_temp.choose('truth:starforged/iron','truth.option:starforged/iron.2')$$),'ok',
  'a co-op member, a Guide of their game, chooses an option');
select pg_temp.as_user(1);
select is(pg_temp.outcome($$select pg_temp.choose('truth:starforged/exodus','truth.option:starforged/exodus.2')$$),'ok',
  'the owner changes a choice');
select is(pg_temp.truths(),
  'truth:starforged/cataclysm=truth.option:starforged/cataclysm.0/truth.option.oracle_rollable.row:starforged/cataclysm.0.sun_plague_cause.0, '
  ||'truth:starforged/exodus=truth.option:starforged/exodus.2, truth:starforged/iron=truth.option:starforged/iron.2',
  'one choice per truth, the latest one standing');

select pg_temp.as_user(4);
select is(pg_temp.outcome($$select pg_temp.choose('truth:starforged/laws','truth.option:starforged/laws.0')$$),
  '42501 new row violates row-level security policy for table "world_truths"','a player cannot choose a truth');
select is(pg_temp.outcome($$update public.world_truths set option_id='truth.option:starforged/iron.0'
  where world_id=pg_temp.w('main') and truth_id='truth:starforged/iron'$$),'ok','a player''s update is a no-op');
select is(pg_temp.outcome($$delete from public.world_truths where world_id=pg_temp.w('main')$$),'ok',
  'a player''s delete is a no-op');
select pg_temp.as_user(5);
select is(pg_temp.outcome($$select pg_temp.write('truth:starforged/laws','Viewer law','Viewer quest')$$),
  '42501 Only world editors and Guides can write world truths','a viewer cannot write a truth');
select pg_temp.as_user(6);
select is(pg_temp.outcome($$select pg_temp.choose('truth:starforged/laws','truth.option:starforged/laws.0')$$),
  '42501 new row violates row-level security policy for table "world_truths"','an outsider cannot choose a truth');
select pg_temp.as_user(1);
select is((select option_id from public.world_truths where world_id=pg_temp.w('main') and truth_id='truth:starforged/iron'),
  'truth.option:starforged/iron.2','players, viewers and outsiders changed nothing');

-- Shape
select is(pg_temp.outcome($$insert into public.world_truths(world_id,truth_id) values (pg_temp.w('main'),'truth:starforged/laws')$$),
  '23514 new row for relation "world_truths" violates check constraint "world_truths_choice_check"',
  'a truth holds an option or a written description');
select is(pg_temp.outcome($$insert into public.world_truths(world_id,truth_id,option_id,custom_description)
  values (pg_temp.w('main'),'truth:starforged/laws','truth.option:starforged/laws.0','Both')$$),
  '23514 new row for relation "world_truths" violates check constraint "world_truths_choice_check"',
  'never both');
select is(pg_temp.outcome($$insert into public.world_truths(world_id,truth_id,sub_option_id,custom_description)
  values (pg_temp.w('main'),'truth:starforged/laws','row','Written')$$),
  '23514 new row for relation "world_truths" violates check constraint "world_truths_choice_check"',
  'a sub-table row needs an option');
select is(pg_temp.outcome($$insert into public.world_truths(world_id,truth_id,option_id)
  values (pg_temp.w('main'),'cataclysm','truth.option:starforged/laws.0')$$),
  '23514 new row for relation "world_truths" violates check constraint "world_truths_truth_id_check"',
  'truths are keyed by their Datasworn id');

-- Writing your own
select pg_temp.as_user(3);
select is(pg_temp.outcome($$select pg_temp.write('truth:starforged/laws','No laws reach the Forge.','Find who still keeps the old code.')$$),'ok',
  'a Guide writes their own truth with a quest starter');
select is(pg_temp.outcome($$select pg_temp.write('truth:starforged/cataclysm','We fled our own war.','Learn who started it.')$$),'ok',
  'writing your own replaces a chosen option');
select is(pg_temp.truths(),
  'truth:starforged/cataclysm=custom:We fled our own war., truth:starforged/exodus=truth.option:starforged/exodus.2, '
  ||'truth:starforged/iron=truth.option:starforged/iron.2, truth:starforged/laws=custom:No laws reach the Forge.',
  'the written truths replace their sub-table choice too');
select is(pg_temp.quests(),
  'truth:starforged/cataclysm=Learn who started it., truth:starforged/laws=Find who still keeps the old code.',
  'Guides read the quest starters they wrote');
select is(pg_temp.outcome($$select pg_temp.write('truth:starforged/laws','No laws reach the Forge.','')$$),'ok',
  'an empty quest starter is allowed');
select is(pg_temp.quests(),'truth:starforged/cataclysm=Learn who started it.','and removes the stored one');

-- Reading
select pg_temp.as_user(4);
select is(pg_temp.truths(),
  'truth:starforged/cataclysm=custom:We fled our own war., truth:starforged/exodus=truth.option:starforged/exodus.2, '
  ||'truth:starforged/iron=truth.option:starforged/iron.2, truth:starforged/laws=custom:No laws reach the Forge.',
  'players read every chosen truth and written description');
select is(pg_temp.quests(),'','players never read a written quest starter');
select pg_temp.as_user(5);
select is((select count(*) from public.world_truths where world_id=pg_temp.w('main')),4::bigint,'viewers read the truths');
select is(pg_temp.quests(),'','viewers never read a written quest starter');
select pg_temp.as_user(6);
select is((select count(*) from public.world_truths),0::bigint,'outsiders read no truths');
select pg_temp.as_user(2);
select is(pg_temp.quests(),'truth:starforged/cataclysm=Learn who started it.','world editors read written quest starters');
select pg_temp.as_user(7);
select is(pg_temp.quests(),'truth:starforged/cataclysm=Learn who started it.','co-op members read written quest starters');

-- Choosing an option drops the written quest starter
select pg_temp.as_user(3);
select is(pg_temp.outcome($$select pg_temp.choose('truth:starforged/cataclysm','truth.option:starforged/cataclysm.1')$$),'ok',
  'a Guide picks an option over their written truth');
select is(pg_temp.quests(),'','its quest starter goes with it');
select is(pg_temp.outcome($$delete from public.world_truths where world_id=pg_temp.w('main') and truth_id='truth:starforged/laws'$$),'ok',
  'a Guide clears a truth');
select is(pg_temp.truths(),
  'truth:starforged/cataclysm=truth.option:starforged/cataclysm.1, truth:starforged/exodus=truth.option:starforged/exodus.2, '
  ||'truth:starforged/iron=truth.option:starforged/iron.2',
  'a cleared truth is no longer chosen');

-- Setting changes keep the choices
reset role;
update public.worlds set setting_key='world:classic/ironlands' where id=pg_temp.w('main');
set local role authenticated;
select pg_temp.as_user(4);
select is((select count(*) from public.world_truths where world_id=pg_temp.w('main')),3::bigint,
  'changing the setting keeps the earlier setting''s choices');

-- The other world is separate
select pg_temp.as_user(1);
select is((select count(*) from public.world_truths where world_id=pg_temp.w('other')),0::bigint,
  'each world has its own truths');

select * from finish();
rollback;
