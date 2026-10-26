-- Room keys: who can read each kind of key, that clients cannot write them,
-- and when they rotate. Every fixture is rolled back.
begin;
create extension if not exists pgtap with schema extensions;
set search_path = public,extensions;
select no_plan();

-- 1 Guide, 2 and 3 players, 4 outsider, 5 co-op member, 6 world owner,
-- 7 world viewer.
insert into auth.users(id)
  select ('e1000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid from generate_series(1,7) n;
create function pg_temp.u(p_n integer) returns uuid language sql as $$
  select ('e1000000-0000-4000-8000-'||lpad(p_n::text,12,'0'))::uuid $$;
create function pg_temp.as_user(p_n integer) returns void language sql as $$
  select set_config('request.jwt.claim.sub',pg_temp.u(p_n)::text,true) $$;
create function pg_temp.id(p_kind text,p_n integer) returns uuid language sql as $$
  select ((case p_kind when 'game' then 'e2' when 'note' then 'e3' when 'entry' then 'e4'
    when 'folder' then 'e5' end)||'000000-0000-4000-8000-'||lpad(p_n::text,12,'0'))::uuid $$;
create temporary table room_world(id uuid);
grant all on room_world to authenticated;
create function pg_temp.w() returns uuid language sql as $$ select id from room_world $$;
-- Keys as stored, read without row-level security.
create function pg_temp.note_key(p_n integer) returns text language sql as $$
  select key from public.room_keys where note_id=pg_temp.id('note',p_n) $$;
create function pg_temp.entry_key(p_n integer) returns text language sql as $$
  select key from public.room_keys where world_entry_id=pg_temp.id('entry',p_n) $$;
create function pg_temp.game_key(p_n integer) returns text language sql as $$
  select key from public.guide_room_keys where game_id=pg_temp.id('game',p_n) $$;
create function pg_temp.world_key() returns text language sql as $$
  select key from public.guide_room_keys where world_id=pg_temp.w() $$;
create function pg_temp.world_notes_key() returns text language sql as $$
  select key from public.room_keys where world_id=pg_temp.w() $$;
create table pg_temp.snapshot(name text primary key,key text);
create function pg_temp.snap() returns void language sql as $$
  delete from pg_temp.snapshot;
  insert into pg_temp.snapshot
    select 'note '||n,pg_temp.note_key(n) from generate_series(1,5) n
    union all select 'entry '||n,pg_temp.entry_key(n) from generate_series(1,3) n
    union all select 'game 1',pg_temp.game_key(1)
    union all select 'world',pg_temp.world_key()
    union all select 'world notes',pg_temp.world_notes_key() $$;
-- Which keys changed since the last snapshot.
create function pg_temp.rotated() returns text[] language sql as $$
  select coalesce(array_agg(s.name order by s.name),'{}') from pg_temp.snapshot s
  where s.key is distinct from (case
    when s.name like 'note %' then pg_temp.note_key(split_part(s.name,' ',2)::integer)
    when s.name like 'entry %' then pg_temp.entry_key(split_part(s.name,' ',2)::integer)
    when s.name = 'game 1' then pg_temp.game_key(1)
    when s.name = 'world notes' then pg_temp.world_notes_key()
    else pg_temp.world_key() end) $$;
create function pg_temp.reads_world_notes_key() returns boolean language sql as $$
  select exists (select 1 from public.room_keys where world_id=pg_temp.w()) $$;
-- What the current user can see.
create function pg_temp.readable_notes() returns integer[] language sql as $$
  select coalesce(array_agg(n order by n),'{}') from generate_series(1,5) n
  where exists (select 1 from public.room_keys where note_id=pg_temp.id('note',n)) $$;
create function pg_temp.readable_entries() returns integer[] language sql as $$
  select coalesce(array_agg(n order by n),'{}') from generate_series(1,3) n
  where exists (select 1 from public.room_keys where world_entry_id=pg_temp.id('entry',n)) $$;
create function pg_temp.readable_guide_keys() returns text[] language sql as $$
  select coalesce(array_agg(scope order by scope),'{}') from (
    select case when game_id=pg_temp.id('game',1) then 'game 1'
      when game_id=pg_temp.id('game',2) then 'game 2' else 'world' end scope
    from public.guide_room_keys
    where game_id in (pg_temp.id('game',1),pg_temp.id('game',2)) or world_id=pg_temp.w()) k $$;
create function pg_temp.outcome(p_sql text) returns text language plpgsql as $$
begin
  execute p_sql;
  return 'ok';
exception when others then
  return sqlstate;
end $$;
grant execute on function pg_temp.outcome(text) to authenticated;

set local role authenticated;
select pg_temp.as_user(6);
insert into room_world values (public.create_world('Rooms','world:classic/ironlands'));
reset role;

insert into public.games(id,name,game_type,world_id) values
  (pg_temp.id('game',1),'Guided','guided',pg_temp.w()),
  (pg_temp.id('game',2),'Co-op','co-op',null);
insert into public.game_players(game_id,user_id,role) values
  (pg_temp.id('game',1),pg_temp.u(1),'guide'),
  (pg_temp.id('game',1),pg_temp.u(2),'player'),
  (pg_temp.id('game',1),pg_temp.u(3),'player'),
  (pg_temp.id('game',2),pg_temp.u(5),'player');
insert into public.world_players(world_id,user_id,role) values (pg_temp.w(),pg_temp.u(7),'viewer');
insert into public.note_folders(id,author_id,game_id,"order",read_permissions,edit_permissions,parent_folder_id)
  values (pg_temp.id('folder',1),pg_temp.u(1),pg_temp.id('game',1),1,'all_players','all_players',null);
insert into public.notes(id,author_id,parent_folder_id,game_id,title,"order",read_permissions,edit_permissions)
  select pg_temp.id('note',n),pg_temp.u(a),pg_temp.id('folder',1),pg_temp.id('game',1),t,n,
    r::public.note_read_permissions,'only_author'
  from (values (1,1,'Public','public'),(2,1,'Everyone','all_players'),
    (3,2,'Guides and author','guides_and_author'),(4,1,'Guides','only_guides'),
    (5,2,'Author','only_author')) v(n,a,t,r);
insert into public.world_entries(id,world_id,category_id,name,author_id,read_permissions,edit_permissions)
  select pg_temp.id('entry',n),pg_temp.w(),extensions.uuid_generate_v5(pg_temp.w(),'category:npcs'),t,
    pg_temp.u(a),r::public.note_read_permissions,'only_author'
  from (values (1,6,'Everyone','all_players'),(2,1,'Guides','only_guides'),(3,2,'Author','only_author')) v(n,a,t,r);

-- Keys exist with their documents and scopes.
select is((select count(*) from public.room_keys
  where note_id in (select id from public.notes where game_id=pg_temp.id('game',1))),5::bigint,
  'every new note gets a room key');
select is((select count(*) from public.room_keys
  where world_entry_id in (select id from public.world_entries where world_id=pg_temp.w())),3::bigint,
  'every new entry gets a room key');
select ok(pg_temp.game_key(1) is not null and pg_temp.game_key(2) is not null,'every new game gets a Guide room key');
select ok(pg_temp.world_key() is not null,'every new world gets a Guide room key');
select ok(pg_temp.world_notes_key() is not null,'every new world gets a room key for its Notes');
select is((select count(distinct key) from public.room_keys),(select count(*) from public.room_keys),
  'room keys are random, not shared');
select ok(pg_temp.note_key(1) <> pg_temp.id('game',1)::text and pg_temp.entry_key(1) <> pg_temp.w()::text,
  'a room key is not the game or world id');
select ok(length(decode(pg_temp.note_key(1),'base64')) = 32,'a room key holds 32 random bytes');

-- Clients only read keys.
select ok(not has_table_privilege('authenticated','public.room_keys','INSERT,UPDATE,DELETE,TRUNCATE')
  and not has_table_privilege('authenticated','public.guide_room_keys','INSERT,UPDATE,DELETE,TRUNCATE'),
  'signed-in clients cannot write keys');
select ok(not has_table_privilege('anon','public.room_keys','SELECT')
  and not has_table_privilege('anon','public.guide_room_keys','SELECT'),
  'signed-out clients cannot read keys');
select ok(not has_function_privilege('authenticated','public.room_keys_rotate_game(uuid,uuid)','EXECUTE')
  and not has_function_privilege('authenticated','public.room_keys_rotate_world(uuid,uuid)','EXECUTE'),
  'clients cannot rotate keys themselves');

set local role authenticated;
select pg_temp.as_user(2);
select is(pg_temp.outcome($$update public.room_keys set key='known' where note_id=pg_temp.id('note',2)$$),'42501',
  'a player cannot overwrite a key');

-- Game note keys follow each note's read permissions.
select pg_temp.as_user(1);
select is(pg_temp.readable_notes(),array[1,2,3,4],'a Guide reads every note key but another''s private note');
select pg_temp.as_user(2);
select is(pg_temp.readable_notes(),array[1,2,3,5],'an author reads their own notes and shared ones');
select pg_temp.as_user(3);
select is(pg_temp.readable_notes(),array[1,2],'a player cannot read the key of a Guide-only or private note');
select pg_temp.as_user(4);
select is(pg_temp.readable_notes(),array[1],'an outsider reads only public note keys');

-- Entry keys follow each entry's read permissions.
select pg_temp.as_user(6);
select is(pg_temp.readable_entries(),array[1,2],'the world owner reads every entry key but a private one');
select pg_temp.as_user(1);
select is(pg_temp.readable_entries(),array[1,2],'a guided game''s Guide reads Guide-only entry keys');
select pg_temp.as_user(2);
select is(pg_temp.readable_entries(),array[1,3],'a player reads shared and their own entry keys');
select pg_temp.as_user(7);
select is(pg_temp.readable_entries(),array[1],'a viewer cannot read a Guide-only entry key');
select pg_temp.as_user(4);
select is(pg_temp.readable_entries(),'{}'::integer[],'an outsider reads no entry keys');

-- A world's Notes key is for every member.
select pg_temp.as_user(6);
select ok(pg_temp.reads_world_notes_key(),'the world owner reads the world Notes key');
select pg_temp.as_user(2);
select ok(pg_temp.reads_world_notes_key(),'a linked game''s player reads the world Notes key');
select pg_temp.as_user(7);
select ok(pg_temp.reads_world_notes_key(),'a viewer reads the world Notes key');
select pg_temp.as_user(4);
select ok(not pg_temp.reads_world_notes_key(),'an outsider cannot read the world Notes key');

-- Guide room keys are for that scope's Guides.
select pg_temp.as_user(1);
select is(pg_temp.readable_guide_keys(),array['game 1','world'],'a Guide reads the game and world Guide keys');
select pg_temp.as_user(6);
select is(pg_temp.readable_guide_keys(),array['world'],'the world owner reads the world Guide key');
select pg_temp.as_user(2);
select is(pg_temp.readable_guide_keys(),'{}'::text[],'a player reads no Guide keys');
select pg_temp.as_user(7);
select is(pg_temp.readable_guide_keys(),'{}'::text[],'a viewer reads no Guide keys');
select pg_temp.as_user(5);
select is(pg_temp.readable_guide_keys(),array['game 2'],'a co-op member is a Guide of their game');
reset role;

-- Rotation. These fixture writes run as no user, as admin work does.
select set_config('request.jwt.claim.sub','',true);
select pg_temp.snap();
update public.notes set title='Renamed',"order"=9 where id=pg_temp.id('note',4);
update public.world_entries set name='Renamed' where id=pg_temp.id('entry',2);
update public.game_players set last_seen_log_timestamp=now() where user_id=pg_temp.u(3);
select is(pg_temp.rotated(),'{}'::text[],'edits that change no one''s access rotate nothing');

update public.notes set read_permissions='only_guides' where id=pg_temp.id('note',2);
select is(pg_temp.rotated(),array['note 2'],'narrowing a note''s read permissions rotates its key');
select pg_temp.snap();
update public.world_entries set read_permissions='only_guides' where id=pg_temp.id('entry',1);
select is(pg_temp.rotated(),array['entry 1'],'narrowing an entry''s read permissions rotates its key');
select pg_temp.snap();
update public.notes set author_id=pg_temp.u(1) where id=pg_temp.id('note',3);
select is(pg_temp.rotated(),array['note 3'],'changing a note''s author rotates its key');
update public.notes set read_permissions='all_players' where id=pg_temp.id('note',2);
update public.world_entries set read_permissions='all_players' where id=pg_temp.id('entry',1);
update public.notes set author_id=pg_temp.u(2) where id=pg_temp.id('note',3);

select pg_temp.snap();
delete from public.game_players where game_id=pg_temp.id('game',1) and user_id=pg_temp.u(3);
select ok(pg_temp.rotated() @> array['note 2','entry 1','game 1','world','world notes'],
  'removing a player rotates the game and world keys they could read');
select ok(not pg_temp.rotated() && array['note 1'],'a public note keeps its key when a player leaves');
set local role authenticated;
select pg_temp.as_user(3);
select is(pg_temp.readable_notes(),array[1],'a removed player reads only public note keys');
select is(pg_temp.readable_entries(),'{}'::integer[],'a removed player reads no entry keys');
reset role;

select pg_temp.snap();
update public.game_players set role='player' where game_id=pg_temp.id('game',1) and user_id=pg_temp.u(1);
select ok(pg_temp.rotated() @> array['note 4','entry 2','game 1','world'],
  'demoting a Guide rotates the Guide-only keys of the game and world');
select ok(not pg_temp.rotated() && array['world notes'],'a demoted Guide keeps the world Notes key');
set local role authenticated;
select pg_temp.as_user(1);
select is(pg_temp.readable_guide_keys(),'{}'::text[],'a demoted Guide cannot read the new Guide keys');
select ok(not pg_temp.readable_notes() && array[4],'a demoted Guide cannot read a Guide-only note key');
reset role;
update public.game_players set role='guide' where game_id=pg_temp.id('game',1) and user_id=pg_temp.u(1);

select pg_temp.snap();
delete from public.world_players where world_id=pg_temp.w() and user_id=pg_temp.u(7);
select ok(pg_temp.rotated() @> array['entry 1','world notes'] and not pg_temp.rotated() && array['note 2'],
  'removing a world member rotates the world''s keys, not the game''s');

select pg_temp.snap();
update public.games set world_id=null where id=pg_temp.id('game',1);
select ok(pg_temp.rotated() @> array['entry 1','entry 2','entry 3','world'],
  'unlinking a game rotates every key in the world');
update public.games set world_id=pg_temp.w() where id=pg_temp.id('game',1);

select pg_temp.snap();
update public.games set game_type='co-op' where id=pg_temp.id('game',1);
select ok(pg_temp.rotated() @> array['note 1','note 4','game 1','entry 1','world'],
  'changing a game''s type rotates every key in the game and its world');

select pg_temp.snap();
delete from public.games where id=pg_temp.id('game',1);
select is(pg_temp.world_key() is distinct from (select key from pg_temp.snapshot where name='world'),true,
  'deleting a linked game rotates the world''s keys');
select is((select count(*) from public.room_keys
  where note_id in (select pg_temp.id('note',n) from generate_series(1,5) n)),0::bigint,'a deleted game''s note keys go with it');

select * from finish();
rollback;
