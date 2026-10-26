-- Game membership: who may join a game, change roles and change the game type.
-- Clients only add themselves to a new game they created, roles change only at
-- a Guide's hand (or a member taking the Guide role in a game without one), and
-- only a Guide changes the game type. Every fixture is rolled back.
begin;
create extension if not exists pgtap with schema extensions;
set search_path = public,extensions;
select no_plan();

-- 1 creates games, 2 and 4 join guided games, 3 is an outsider,
-- 5 creates the guided game that becomes co-op, 6 and 7 join it.
insert into auth.users(id)
  select ('e1000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid from generate_series(1,7) n;
create function pg_temp.u(p_n integer) returns uuid language sql as $$
  select ('e1000000-0000-4000-8000-'||lpad(p_n::text,12,'0'))::uuid $$;
create function pg_temp.g(p_n integer) returns uuid language sql as $$
  select ('e2000000-0000-4000-8000-'||lpad(p_n::text,12,'0'))::uuid $$;
-- Runs a statement as a user: 'ok:<rows>' or the SQLSTATE and message.
create function pg_temp.run(p_n integer,p_sql text) returns text language plpgsql as $$
declare v_rows bigint; v_state text; v_message text;
begin
  perform set_config('request.jwt.claim.sub',pg_temp.u(p_n)::text,true);
  execute p_sql;
  get diagnostics v_rows = row_count;
  return 'ok:'||v_rows;
exception when others then
  get stacked diagnostics v_state = returned_sqlstate, v_message = message_text;
  return v_state||' '||v_message;
end $$;
grant execute on function pg_temp.u(integer),pg_temp.g(integer),pg_temp.run(integer,text)
  to anon,authenticated,service_role;
create function pg_temp.role_of(p_game integer,p_user integer) returns text language sql as $$
  select role::text from public.game_players where game_id=pg_temp.g(p_game) and user_id=pg_temp.u(p_user) $$;
create function pg_temp.type_of(p_game integer) returns text language sql as $$
  select game_type::text from public.games where id=pg_temp.g(p_game) $$;

-- Expected errors.
create function pg_temp.rls(p_table text) returns text language sql as $$
  select '42501 new row violates row-level security policy for table "'||p_table||'"' $$;
create function pg_temp.moved() returns text language sql as $$
  select '42501 A game membership cannot move to another game or user' $$;
create function pg_temp.not_guide_role() returns text language sql as $$
  select '42501 Only a Guide can change roles in this game' $$;
create function pg_temp.not_guide_type() returns text language sql as $$
  select '42501 Only a Guide can change the game type' $$;

-- Shape and privileges.
select has_column('public','games','created_by','games record their creator');
select col_default_is('public','games','created_by','auth.uid()','the creator defaults to the signed-in user');
select fk_ok('public','games','created_by','public','users','id','the creator references a user');
select ok(not has_column_privilege('authenticated','public.games','created_by','INSERT')
  and not has_column_privilege('authenticated','public.games','created_by','UPDATE')
  and not has_column_privilege('anon','public.games','created_by','INSERT'),
  'clients cannot write the creator');
select ok(has_function_privilege('authenticated','public.is_game_guide(uuid,uuid)','EXECUTE')
  and has_function_privilege('authenticated','public.game_has_guide(uuid)','EXECUTE')
  and has_function_privilege('authenticated','public.is_new_game_creator(uuid,uuid)','EXECUTE')
  and not has_function_privilege('anon','public.is_game_guide(uuid,uuid)','EXECUTE')
  and not has_function_privilege('anon','public.game_has_guide(uuid)','EXECUTE')
  and not has_function_privilege('anon','public.is_new_game_creator(uuid,uuid)','EXECUTE'),
  'membership helpers are for signed-in clients only');
select ok(not has_function_privilege('authenticated','public.game_players_guard_update()','EXECUTE')
  and not has_function_privilege('anon','public.game_players_guard_update()','EXECUTE')
  and not has_function_privilege('authenticated','public.games_guard_update()','EXECUTE')
  and not has_function_privilege('anon','public.games_guard_update()','EXECUTE'),
  'clients cannot execute the guard triggers');

-- A game nobody created through the app, standing in for games from before
-- created_by existed.
insert into public.games(id,name,game_type,created_by) values (pg_temp.g(9),'Legacy','guided',null);

set local role authenticated;

-- Creating each kind of game and joining it.
select is(pg_temp.run(1,$$insert into public.games(id,name,game_type) values (pg_temp.g(1),'Solo','solo')$$),
  'ok:1','a user creates a solo game');
select is(pg_temp.run(1,$$insert into public.game_players(game_id,user_id,role) values (pg_temp.g(1),pg_temp.u(1),'guide')$$),
  'ok:1','and joins it as its Guide');
select is(pg_temp.run(1,$$insert into public.games(id,name,game_type) values (pg_temp.g(2),'Co-op','co-op')$$),
  'ok:1','a user creates a co-op game');
select is(pg_temp.run(1,$$insert into public.game_players(game_id,user_id,role) values (pg_temp.g(2),pg_temp.u(1),'guide')$$),
  'ok:1','and joins it as a Guide');
select is(pg_temp.run(1,$$insert into public.games(id,name,game_type) values (pg_temp.g(3),'Guided','guided')$$),
  'ok:1','a user creates a guided game');
select is(pg_temp.run(1,$$insert into public.game_players(game_id,user_id,role) values (pg_temp.g(3),pg_temp.u(1),'player')$$),
  'ok:1','and joins it as a player');
select is(pg_temp.run(1,$$insert into public.games(id,name,game_type) values (pg_temp.g(4),'Abandoned','guided')$$),
  'ok:1','a user creates a game they will leave');
select is(pg_temp.run(1,$$insert into public.game_players(game_id,user_id,role) values (pg_temp.g(4),pg_temp.u(1),'player')$$),
  'ok:1','and joins it');
reset role;
select is((select count(*) from public.games where id in (pg_temp.g(1),pg_temp.g(2),pg_temp.g(3),pg_temp.g(4))
  and created_by=pg_temp.u(1)),4::bigint,'each new game records its creator');
set local role authenticated;

-- Nobody else joins directly.
select is(pg_temp.run(3,$$insert into public.game_players(game_id,user_id,role) values (pg_temp.g(3),pg_temp.u(3),'guide')$$),
  pg_temp.rls('game_players'),'an outsider cannot join a game as its Guide');
select is(pg_temp.run(3,$$insert into public.game_players(game_id,user_id,role) values (pg_temp.g(3),pg_temp.u(3),'player')$$),
  pg_temp.rls('game_players'),'or as a player');
select is(pg_temp.run(3,$$insert into public.game_players(game_id,user_id,role) values (pg_temp.g(2),pg_temp.u(3),'guide')$$),
  pg_temp.rls('game_players'),'or join a co-op game');
select is(pg_temp.run(3,$$insert into public.game_players(game_id,user_id,role) values (pg_temp.g(9),pg_temp.u(3),'player')$$),
  pg_temp.rls('game_players'),'nobody joins a game without a recorded creator');
select is(pg_temp.run(1,$$insert into public.game_players(game_id,user_id,role) values (pg_temp.g(3),pg_temp.u(2),'player')$$),
  pg_temp.rls('game_players'),'a creator cannot add someone else to their game');
select is(pg_temp.run(3,$$insert into public.game_players(game_id,user_id,role) values (pg_temp.g(3),pg_temp.u(3),'player')
  on conflict (user_id,game_id) do update set role='guide'$$),
  pg_temp.rls('game_players'),'an upsert cannot join a game either');
reset role;
set local role anon;
select is(pg_temp.run(3,$$insert into public.game_players(game_id,user_id,role) values (pg_temp.g(3),pg_temp.u(3),'player')$$),
  pg_temp.rls('game_players'),'signed-out visitors cannot join a game');
reset role;

-- The invite edge function joins people with the service role.
set local role service_role;
select is(pg_temp.run(2,$$insert into public.game_players(game_id,user_id,role) values
  (pg_temp.g(3),pg_temp.u(2),'player'),(pg_temp.g(3),pg_temp.u(4),'player'),(pg_temp.g(4),pg_temp.u(2),'player')$$),
  'ok:3','the service role adds invited players');
reset role;
set local role authenticated;

-- An emptied game cannot be claimed.
select is(pg_temp.run(1,$$delete from public.game_players where game_id=pg_temp.g(4) and user_id=pg_temp.u(1)$$),
  'ok:1','a member leaves a game');
select is(pg_temp.run(1,$$insert into public.game_players(game_id,user_id,role) values (pg_temp.g(4),pg_temp.u(1),'guide')$$),
  pg_temp.rls('game_players'),'a creator cannot rejoin their game once others are in it');
select is(pg_temp.run(2,$$delete from public.game_players where game_id=pg_temp.g(4) and user_id=pg_temp.u(2)$$),
  'ok:1','the last member leaves');
select is(pg_temp.run(3,$$insert into public.game_players(game_id,user_id,role) values (pg_temp.g(4),pg_temp.u(3),'guide')$$),
  pg_temp.rls('game_players'),'an outsider cannot claim a game everyone left');

-- The creator cannot be forged or changed.
select is(pg_temp.run(3,$$insert into public.games(id,name,game_type,created_by) values (pg_temp.g(5),'Forged','guided',pg_temp.u(1))$$),
  '42501 permission denied for table games','a game cannot claim another creator');
select is(pg_temp.run(1,$$update public.games set created_by=pg_temp.u(3) where id=pg_temp.g(3)$$),
  '42501 permission denied for table games','a game''s creator cannot change');

-- Roles in a guided game.
select is(pg_temp.run(1,$$update public.game_players set role='guide' where game_id=pg_temp.g(3) and user_id=pg_temp.u(1)$$),
  'ok:1','a member takes the Guide role in a game without one');
select is(pg_temp.run(2,$$update public.game_players set role='guide' where game_id=pg_temp.g(3) and user_id=pg_temp.u(2)$$),
  pg_temp.not_guide_role(),'a player cannot make themselves Guide while the game has one');
select is(pg_temp.role_of(3,2),'player','the player is still a player');
select is(pg_temp.run(2,$$update public.game_players set game_id=pg_temp.g(2) where game_id=pg_temp.g(3) and user_id=pg_temp.u(2)$$),
  pg_temp.moved(),'a player cannot move their membership into another game');
select is(pg_temp.run(1,$$update public.game_players set game_id=pg_temp.g(1) where game_id=pg_temp.g(3) and user_id=pg_temp.u(2)$$),
  pg_temp.moved(),'a Guide cannot move a membership into another game');
select is(pg_temp.run(1,$$update public.game_players set user_id=pg_temp.u(3) where game_id=pg_temp.g(3) and user_id=pg_temp.u(2)$$),
  pg_temp.moved(),'a Guide cannot hand a membership to someone else');
select is(pg_temp.run(2,$$update public.game_players set last_seen_log_timestamp='2026-01-02T03:04:05Z'
  where game_id=pg_temp.g(3) and user_id=pg_temp.u(2)$$),
  'ok:1','a player records when they last read the log');
select is((select last_seen_log_timestamp from public.game_players where game_id=pg_temp.g(3) and user_id=pg_temp.u(2)),
  '2026-01-02T03:04:05Z'::timestamptz,'and it is stored');
select is(pg_temp.run(2,$$update public.games set game_type='co-op' where id=pg_temp.g(3)$$),
  pg_temp.not_guide_type(),'a player cannot change a guided game''s type');
select is(pg_temp.type_of(3),'guided','the game stays guided');
select is(pg_temp.run(2,$$update public.games set name='Renamed' where id=pg_temp.g(3)$$),
  'ok:1','a player still renames the game');
select is(pg_temp.run(1,$$update public.game_players set role='guide' where game_id=pg_temp.g(3) and user_id=pg_temp.u(2)$$),
  'ok:1','a Guide makes a player Guide');
select is(pg_temp.role_of(3,2),'guide','the player is now Guide');
select is(pg_temp.run(1,$$update public.game_players set role='player' where game_id=pg_temp.g(3) and user_id=pg_temp.u(1)$$),
  'ok:1','a Guide leaves the Guide role');
select is(pg_temp.role_of(3,1),'player','and is a player again');
select is(pg_temp.run(1,$$update public.game_players set role='guide' where game_id=pg_temp.g(3) and user_id=pg_temp.u(1)$$),
  pg_temp.not_guide_role(),'and cannot take it back while another Guide remains');
select is(pg_temp.run(2,$$delete from public.game_players where game_id=pg_temp.g(3) and user_id=pg_temp.u(4)$$),
  'ok:1','a Guide removes a player');
select is(pg_temp.run(1,$$delete from public.game_players where game_id=pg_temp.g(3) and user_id=pg_temp.u(1)$$),
  'ok:1','a player leaves the game');
select is((select count(*) from public.game_players where game_id=pg_temp.g(3)),1::bigint,
  'only the Guide remains');

-- Changing type the way the app does: reset every role, then set the type.
select is(pg_temp.run(5,$$insert into public.games(id,name,game_type) values (pg_temp.g(6),'Switching','guided')$$),
  'ok:1','a user creates another guided game');
select is(pg_temp.run(5,$$insert into public.game_players(game_id,user_id,role) values (pg_temp.g(6),pg_temp.u(5),'player')$$),
  'ok:1','and joins it');
select is(pg_temp.run(5,$$update public.game_players set role='guide' where game_id=pg_temp.g(6) and user_id=pg_temp.u(5)$$),
  'ok:1','and takes the Guide role');
reset role;
set local role service_role;
select is(pg_temp.run(6,$$insert into public.game_players(game_id,user_id,role) values
  (pg_temp.g(6),pg_temp.u(6),'player'),(pg_temp.g(6),pg_temp.u(7),'player')$$),'ok:2','two players are invited');
reset role;
set local role authenticated;
select is(pg_temp.run(6,$$update public.game_players set role='guide' where game_id=pg_temp.g(6)$$),
  pg_temp.not_guide_role(),'a player cannot reset every role');
reset role;
select is((select count(*) from public.game_players where game_id=pg_temp.g(6) and role='guide'),1::bigint,
  'so only the Guide is Guide');
set local role authenticated;
select is(pg_temp.run(5,$$update public.game_players set role='guide' where game_id=pg_temp.g(6)$$),
  'ok:3','a Guide makes every member Guide to switch to co-op');
select is(pg_temp.run(5,$$update public.games set game_type='co-op' where id=pg_temp.g(6)$$),
  'ok:1','then switches the game to co-op');
select is(pg_temp.type_of(6),'co-op','the game is co-op');

select is(pg_temp.run(1,$$update public.games set game_type='solo' where id=pg_temp.g(2)$$),
  'ok:1','a co-op member may change a co-op game''s type');
select is(pg_temp.run(1,$$update public.games set game_type='co-op' where id=pg_temp.g(2)$$),
  'ok:1','and a solo member a solo game''s type');
reset role;
set local role service_role;
select is(pg_temp.run(6,$$insert into public.game_players(game_id,user_id,role) values
  (pg_temp.g(2),pg_temp.u(6),'guide'),(pg_temp.g(2),pg_temp.u(7),'guide')$$),'ok:2','two members join the co-op game');
reset role;
set local role authenticated;
-- The creator's row comes first, so it is reset before the others are checked:
-- the Guide check must not depend on it.
select is(pg_temp.run(1,$$update public.game_players set role='player' where game_id=pg_temp.g(2)$$),
  'ok:3','a co-op member makes every member a player, themselves included');
select is(pg_temp.run(1,$$update public.games set game_type='guided' where id=pg_temp.g(2)$$),
  'ok:1','then switches the game to guided');
select is(pg_temp.type_of(2),'guided','the game is guided');
reset role;
select is((select count(*) from public.game_players where game_id=pg_temp.g(2) and role='player'),3::bigint,
  'every member is a player');
set local role authenticated;
select is(pg_temp.run(7,$$update public.games set game_type='co-op' where id=pg_temp.g(2)$$),
  pg_temp.not_guide_type(),'a player cannot switch it back');
select is(pg_temp.run(7,$$update public.game_players set role='guide' where game_id=pg_temp.g(2) and user_id=pg_temp.u(7)$$),
  'ok:1','but a member can take the Guide role it now lacks');
select is(pg_temp.run(6,$$update public.game_players set role='guide' where game_id=pg_temp.g(2) and user_id=pg_temp.u(6)$$),
  pg_temp.not_guide_role(),'after which nobody else can');
reset role;

select * from finish();
rollback;
