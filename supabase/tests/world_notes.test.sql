-- World Notes: owners, editors and Guides save them, players and viewers read
-- them, and nobody outside the world reaches them. Every fixture is rolled
-- back.
begin;
create extension if not exists pgtap with schema extensions;
set search_path = public,extensions;
select no_plan();

-- 1 owner, 2 editor, 3 guide, 4 player, 5 viewer, 6 outsider.
insert into auth.users(id)
  select ('d7000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid from generate_series(1,6) n;
create temporary table notes_worlds(key text primary key,id uuid);
grant all on notes_worlds to authenticated;
create function pg_temp.u(p_n integer) returns uuid language sql as $$
  select ('d7000000-0000-4000-8000-'||lpad(p_n::text,12,'0'))::uuid $$;
create function pg_temp.as_user(p_n integer) returns void language sql as $$
  select set_config('request.jwt.claim.sub',pg_temp.u(p_n)::text,true) $$;
create function pg_temp.w() returns uuid language sql as $$
  select id from notes_worlds where key='main' $$;
create function pg_temp.saves(p_n integer) returns text language plpgsql as $$
begin
  perform pg_temp.as_user(p_n);
  perform public.update_world_notes(pg_temp.w(),('\x0'||p_n)::bytea);
  return 'ok';
exception when others then
  return sqlstate;
end $$;
grant execute on function pg_temp.saves(integer) to authenticated;

select ok(to_regprocedure('public.create_world(text,text)') is not null
  and to_regprocedure('public.create_world(text,text,text)') is null,
  'create_world no longer takes a description');
select hasnt_column('public','worlds','description','worlds.description is gone');
select has_column('public','worlds','notes_content','worlds hold their Notes');
select ok(has_function_privilege('authenticated','public.update_world_notes(uuid,bytea)','EXECUTE')
  and not has_function_privilege('anon','public.update_world_notes(uuid,bytea)','EXECUTE'),
  'only signed-in clients can save world notes');

set local role authenticated;
select pg_temp.as_user(1);
insert into notes_worlds values ('main',public.create_world('Notes'));
select is((select notes_content from public.worlds where id=pg_temp.w()),null::bytea,
  'a new world starts with empty Notes');
reset role;

insert into public.world_players(world_id,user_id,role) values
  (pg_temp.w(),pg_temp.u(2),'editor'),(pg_temp.w(),pg_temp.u(5),'viewer');
insert into public.games(id,name,game_type,world_id) values
  ('d8000000-0000-4000-8000-000000000001','Guided','guided',pg_temp.w());
insert into public.game_players(game_id,user_id,role) values
  ('d8000000-0000-4000-8000-000000000001',pg_temp.u(3),'guide'),
  ('d8000000-0000-4000-8000-000000000001',pg_temp.u(4),'player');

set local role authenticated;
select is(pg_temp.saves(1),'ok','owners save world notes');
select is(pg_temp.saves(2),'ok','editors save world notes');
select is(pg_temp.saves(3),'ok','Guides save world notes');
select is((select notes_content from public.worlds where id=pg_temp.w()),'\x03'::bytea,
  'the latest save is stored');
select is(pg_temp.saves(4),'42501','players cannot save world notes');
select is(pg_temp.saves(5),'42501','viewers cannot save world notes');
select is(pg_temp.saves(6),'42501','people outside the world cannot save its notes');

select pg_temp.as_user(3);
select is((select count(*) from public.worlds where id=pg_temp.w() and name='Notes'),1::bigint,
  'Guides read the world');
select lives_ok($$update public.worlds set name='Renamed' where id=pg_temp.w()$$,
  'a Guide renaming the world is not an error');
select pg_temp.as_user(1);
select is((select name from public.worlds where id=pg_temp.w()),'Notes',
  'but saving notes does not let Guides rename the world');

select pg_temp.as_user(4);
select is((select notes_content from public.worlds where id=pg_temp.w()),'\x03'::bytea,
  'players read world notes');
select pg_temp.as_user(5);
select is((select notes_content from public.worlds where id=pg_temp.w()),'\x03'::bytea,
  'viewers read world notes');
select pg_temp.as_user(6);
select is((select count(*) from public.worlds where id=pg_temp.w()),0::bigint,
  'people outside the world read nothing');

select * from finish();
rollback;
