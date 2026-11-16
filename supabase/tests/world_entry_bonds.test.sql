-- World entry bonds: Ironlands bonds and Starforged connections (one
-- character's or the whole party's), only in categories with bonds, only for
-- characters whose game is linked to the entry's world, hidden with their
-- entry, and written only by people who may edit the character (or a
-- character of the party) and read the entry. Every fixture is rolled back.
begin;
create extension if not exists pgtap with schema extensions;
set search_path = public,extensions;
select no_plan();

-- 1 owner, 2 guide, 3 player (classic), 4 and 7 players (Starforged game),
-- 5 outsider, 6 world viewer.
insert into auth.users(id)
  select ('e1100000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid from generate_series(1,7) n;
create temporary table bond_worlds(key text primary key,id uuid);
grant all on bond_worlds to authenticated;
create function pg_temp.u(p_n integer) returns uuid language sql as $$
  select ('e1100000-0000-4000-8000-'||lpad(p_n::text,12,'0'))::uuid $$;
create function pg_temp.as_user(p_n integer) returns void language sql as $$
  select set_config('request.jwt.claim.sub',pg_temp.u(p_n)::text,true) $$;
create function pg_temp.w(p_key text) returns uuid language sql as $$
  select id from bond_worlds where key=p_key $$;
create function pg_temp.c(p_key text,p_category text) returns uuid language sql as $$
  select extensions.uuid_generate_v5(pg_temp.w(p_key),'category:'||p_category) $$;
create function pg_temp.e(p_n integer) returns uuid language sql as $$
  select ('e1300000-0000-4000-8000-'||lpad(p_n::text,12,'0'))::uuid $$;
create function pg_temp.game(p_n integer) returns uuid language sql as $$
  select ('e1500000-0000-4000-8000-'||lpad(p_n::text,12,'0'))::uuid $$;
create function pg_temp.ch(p_n integer) returns uuid language sql as $$
  select ('e1600000-0000-4000-8000-'||lpad(p_n::text,12,'0'))::uuid $$;
create function pg_temp.add(p_n integer,p_category text,p_name text,p_read text) returns void language sql as $$
  insert into public.world_entries(id,world_id,category_id,name,author_id,read_permissions,edit_permissions)
    values (pg_temp.e(p_n),pg_temp.w('main'),pg_temp.c('main',p_category),p_name,auth.uid(),
      p_read::public.note_read_permissions,p_read::public.note_edit_permissions) $$;
create function pg_temp.bond(p_entry integer,p_character integer) returns void language sql as $$
  insert into public.world_entry_bonds(entry_id,character_id) values (pg_temp.e(p_entry),pg_temp.ch(p_character)) $$;
create function pg_temp.connect(p_entry integer,p_character integer,p_rank text default 'dangerous') returns void language sql as $$
  insert into public.world_entry_connections(entry_id,game_id,character_id,rank)
    select pg_temp.e(p_entry),game_id,id,p_rank::public.progress_track_difficulty from public.characters where id=pg_temp.ch(p_character) $$;
-- A character's own connection with an entry.
create function pg_temp.conn(p_entry integer,p_character integer) returns uuid language sql as $$
  select id from public.world_entry_connections where entry_id=pg_temp.e(p_entry) and character_id=pg_temp.ch(p_character) $$;
-- A game's party connection with an entry.
create function pg_temp.party(p_entry integer,p_game integer) returns uuid language sql as $$
  select id from public.world_entry_connections where entry_id=pg_temp.e(p_entry) and game_id=pg_temp.game(p_game) and character_id is null $$;
create function pg_temp.connections(p_entry integer) returns bigint language sql as $$
  select count(*) from public.world_entry_connections where entry_id=pg_temp.e(p_entry) $$;
create function pg_temp.visible(p_entry integer) returns bigint language sql as $$
  select count(*) from public.world_entry_bonds where entry_id=pg_temp.e(p_entry) $$;
create function pg_temp.outcome(p_sql text) returns text language plpgsql as $$
declare v_state text; v_hint text; v_message text;
begin
  execute p_sql;
  return 'ok';
exception when others then
  get stacked diagnostics v_state = returned_sqlstate, v_hint = pg_exception_hint, v_message = message_text;
  return v_state||' '||coalesce(nullif(v_hint,''),'-')||' '||v_message;
end $$;
grant execute on function pg_temp.outcome(text) to authenticated;
grant execute on function pg_temp.conn(integer,integer) to authenticated;
grant execute on function pg_temp.party(integer,integer) to authenticated;

select ok(not has_function_privilege('authenticated','public.world_entry_bond_check()','EXECUTE')
  and not has_function_privilege('anon','public.world_entry_bond_check()','EXECUTE'),
  'the bond guard is not exposed to clients');
select is((select count(*) from pg_policies where schemaname='public' and tablename='world_entry_bonds'),4::bigint,
  'bonds have one policy each for reading, adding, updating and removing');
select is((select count(*) from pg_policies where schemaname='public' and tablename='world_entry_connections'),4::bigint,
  'connections have one policy each for reading, making, changing and removing');
select ok(not has_function_privilege('authenticated','public.world_entry_connection_check()','EXECUTE'),
  'the connection guard is not exposed to clients');

-- Fixtures: one world linked to a classic game and a Starforged game, and a
-- game linked to another world.
set local role authenticated;
select pg_temp.as_user(1);
insert into bond_worlds values ('main',public.create_world('Bonds')),('other',public.create_world('Other'));
reset role;
insert into public.games(id,name,game_type,world_id) values
  (pg_temp.game(1),'Ironlands','guided',pg_temp.w('main')),
  (pg_temp.game(2),'Forge','guided',pg_temp.w('main')),
  (pg_temp.game(3),'Elsewhere','guided',pg_temp.w('other'));
insert into public.game_players(game_id,user_id,role) values
  (pg_temp.game(1),pg_temp.u(2),'guide'),(pg_temp.game(1),pg_temp.u(3),'player'),
  (pg_temp.game(2),pg_temp.u(2),'guide'),(pg_temp.game(2),pg_temp.u(4),'player'),
  (pg_temp.game(2),pg_temp.u(7),'player'),
  (pg_temp.game(3),pg_temp.u(5),'player');
insert into public.world_players(world_id,user_id,role) values (pg_temp.w('main'),pg_temp.u(6),'viewer');
insert into public.characters(id,uid,game_id,name) values
  (pg_temp.ch(3),pg_temp.u(3),pg_temp.game(1),'Kira'),
  (pg_temp.ch(4),pg_temp.u(4),pg_temp.game(2),'Vex'),
  (pg_temp.ch(7),pg_temp.u(7),pg_temp.game(2),'Nova'),
  (pg_temp.ch(5),pg_temp.u(5),pg_temp.game(3),'Wanderer'),
  (pg_temp.ch(2),pg_temp.u(2),pg_temp.game(1),'Guide character');

set local role authenticated;
select pg_temp.as_user(1);
-- Blank worlds have bonds on Locations and NPCs, not on Lore.
select pg_temp.add(1,'npcs','Captain','all_players');
select pg_temp.add(2,'npcs','Spy','only_guides');
select pg_temp.add(3,'lore','Old song','all_players');
select pg_temp.add(4,'locations','Harbour','all_players');

-- Adding
select pg_temp.as_user(3);
select is(pg_temp.outcome($$select pg_temp.bond(1,3)$$),'ok','a player can bond their character with a shared entry');
select is((select (world_id=pg_temp.w('main'))::text
    from public.world_entry_bonds where entry_id=pg_temp.e(1) and character_id=pg_temp.ch(3)),
  'true','an Ironlands bond is a bare link that takes its world from its entry');
select is(pg_temp.outcome($$select pg_temp.bond(3,3)$$),
  '23514 bonds_not_supported This category does not have bonds','bonds need a category with bonds');
select is(pg_temp.outcome($$select pg_temp.bond(2,3)$$),
  '42501 - new row violates row-level security policy for table "world_entry_bonds"',
  'a player cannot bond with Guide prep');
select is(pg_temp.outcome($$select pg_temp.bond(4,4)$$),
  '42501 - new row violates row-level security policy for table "world_entry_bonds"',
  'nobody bonds a character they cannot edit');
select pg_temp.as_user(5);
select is(pg_temp.outcome($$select pg_temp.bond(4,5)$$),
  '23514 character_not_in_world Only characters in a game linked to this world can bond with its entries',
  'a character bonds only with entries of a world linked to its game');
set local role authenticated;

-- Connections
select pg_temp.as_user(4);
select is(pg_temp.outcome($$select pg_temp.connect(1,4,'formidable')$$),'ok',
  'a Starforged character makes a connection with a rank, on the same entry as an Ironlands bond');
select is((select c.rank||' '||c.completed_ticks||' '||c.bonded||' '||(c.game_id=pg_temp.game(2))||' '||(c.world_id=pg_temp.w('main'))
    from public.world_entry_connections c where c.id=pg_temp.conn(1,4)),
  'formidable 0 false true true','the connection holds the rank and track, in its game and world');
select is(pg_temp.outcome($$select pg_temp.connect(1,4)$$),
  '23505 - duplicate key value violates unique constraint "world_entry_connections_character_key"',
  'a character has one connection per entry');
select is(pg_temp.outcome($$select pg_temp.connect(3,4)$$),
  '23514 bonds_not_supported This category does not have bonds','connections need a category with bonds');
select is(pg_temp.outcome($$insert into public.world_entry_connections(entry_id,game_id,rank)
  values (pg_temp.e(4),pg_temp.game(1),'epic')$$),
  '42501 - new row violates row-level security policy for table "world_entry_connections"',
  'nobody makes a party connection in a game where they edit no character');
select is(pg_temp.outcome($$insert into public.world_entry_connections(entry_id,game_id,character_id,rank)
  values (pg_temp.e(4),pg_temp.game(2),pg_temp.ch(7),'epic')$$),
  '42501 - new row violates row-level security policy for table "world_entry_connections"',
  'nobody makes a connection for someone else''s character');
select is(pg_temp.outcome($$insert into public.world_entry_connections(entry_id,game_id,character_id,rank)
  values (pg_temp.e(4),pg_temp.game(1),pg_temp.ch(4),'epic')$$),
  '23514 invalid_connection A connection belongs to a character of its game',
  'a character''s connection is in its own game');
select pg_temp.as_user(7);
select is(pg_temp.outcome($$select pg_temp.connect(1,7,'epic')$$),'ok',
  'an ally makes their own connection with the same entry, at another rank');

-- Sharing with the party
select pg_temp.as_user(4);
select is(pg_temp.outcome($$update public.world_entry_connections set character_id=null where id=pg_temp.conn(1,4)$$),
  '23514 others_connected Someone in this game already has a connection with this entry',
  'a connection is shared with the party only while no one else has one with the entry');
select is(pg_temp.outcome($$select pg_temp.connect(4,4)$$),'ok','a character makes a connection with another entry');
create temporary table shared as select pg_temp.conn(4,4) as id;
grant select on shared to authenticated;
select is(pg_temp.outcome($$update public.world_entry_connections set character_id=null where id=pg_temp.conn(4,4)$$),'ok',
  'and shares it with the party');
select pg_temp.as_user(7);
select is(pg_temp.outcome($$update public.world_entry_connections set completed_ticks=12 where id=(select id from shared)$$),'ok',
  'every character of the party can mark its progress, including ones who did not make it');
select is(pg_temp.outcome($$select pg_temp.connect(4,7)$$),
  '23514 party_connected The party already shares a connection with this entry',
  'nobody makes their own connection with an entry the party shares one with');
select is(pg_temp.outcome($$insert into public.world_entry_connections(entry_id,game_id,rank)
  values (pg_temp.e(4),pg_temp.game(2),'epic')$$),
  '23514 others_connected Someone in this game already has a connection with this entry',
  'a party shares one connection per entry');
select is(pg_temp.outcome($$update public.world_entry_connections set character_id=pg_temp.ch(4) where id=(select id from shared)$$),
  '42501 - new row violates row-level security policy for table "world_entry_connections"',
  'nobody hands a party connection to a character they cannot edit');
select is(pg_temp.outcome($$update public.world_entry_connections set character_id=pg_temp.ch(7) where id=(select id from shared)$$),'ok',
  'a party connection can be kept for one character');
select is((select (character_id=pg_temp.ch(7))||' '||completed_ticks from public.world_entry_connections where id=(select id from shared)),
  'true 12','with its progress');

-- Updating
select pg_temp.as_user(4);
select is(pg_temp.outcome($$update public.world_entry_connections set completed_ticks=41 where id=pg_temp.conn(1,4)$$),
  '23514 - new row for relation "world_entry_connections" violates check constraint "world_entry_connections_ticks_check"',
  'a track holds at most 40 ticks');
select is(pg_temp.outcome($$update public.world_entry_connections set completed_ticks=12, bonded=true, rank='extreme' where id=pg_temp.conn(1,4)$$),'ok',
  'a connection can mark progress, become a bond and change rank');
select is(pg_temp.outcome($$update public.world_entry_connections set entry_id=pg_temp.e(4) where id=pg_temp.conn(1,4)$$),
  '23514 invalid_connection A connection cannot move to another entry or game','a connection keeps its entry');
select pg_temp.as_user(7);
update public.world_entry_connections set completed_ticks=40 where id=pg_temp.conn(1,4);
delete from public.world_entry_connections where id=pg_temp.conn(1,4);
select pg_temp.as_user(2);
update public.world_entry_connections set completed_ticks=40 where id=pg_temp.conn(1,4);
delete from public.world_entry_connections where id=pg_temp.conn(1,4);
select pg_temp.as_user(4);
select is((select completed_ticks||' '||bonded||' '||rank from public.world_entry_connections where id=pg_temp.conn(1,4)),
  '12 true extreme','allies and the Guide cannot change or remove someone else''s connection');

-- Removing
select is(pg_temp.outcome($$delete from public.world_entry_connections where id=pg_temp.conn(1,4)$$),'ok',
  'a character''s editor removes its connection');
select is(pg_temp.connections(1),1::bigint,'leaving the ally''s');

-- Reading
select pg_temp.as_user(2);
select is(pg_temp.outcome($$select pg_temp.bond(2,2)$$),'ok','a Guide can bond their own character with Guide prep');
select pg_temp.as_user(3);
select is(pg_temp.visible(1),1::bigint,'players see every character''s bonds on a shared entry, across games');
select is(pg_temp.visible(2),0::bigint,'players see no bonds on Guide prep');
select pg_temp.as_user(6);
select is(pg_temp.visible(1),1::bigint,'world viewers see bonds on shared entries');
select is(pg_temp.connections(1),1::bigint,'world viewers see connections on shared entries');
select pg_temp.as_user(5);
select is((select count(*) from public.world_entry_bonds),0::bigint,'outsiders see no bonds');
select is((select count(*) from public.world_entry_connections),0::bigint,'or connections');

-- Hiding an entry hides its bonds, and its owner can no longer remove them
select pg_temp.as_user(1);
update public.world_entries set read_permissions='only_guides', edit_permissions='only_guides' where id=pg_temp.e(1);
select pg_temp.as_user(3);
delete from public.world_entry_bonds where entry_id=pg_temp.e(1);
select is(pg_temp.visible(1),0::bigint,'a bond is hidden once its entry is Guide prep');
select pg_temp.as_user(1);
update public.world_entries set read_permissions='all_players', edit_permissions='all_players' where id=pg_temp.e(1);
select pg_temp.as_user(3);
select is(pg_temp.visible(1),1::bigint,'and shows again, untouched, once it is shared');

-- Turning bonds off keeps them
select pg_temp.as_user(1);
select public.mutate_world_configuration(pg_temp.w('main'),jsonb_build_object('type','update_category',
  'id',pg_temp.c('main','npcs'),'changes',jsonb_build_object('supports_bonds',false)));
select pg_temp.as_user(3);
select is(pg_temp.visible(1),1::bigint,'turning bonds off on a category keeps its bonds');
select is(pg_temp.outcome($$delete from public.world_entry_bonds where entry_id=pg_temp.e(1) and character_id=pg_temp.ch(3)$$),'ok',
  'and their characters can still remove them');
select is(pg_temp.visible(1),0::bigint,'the bond is gone');
select is(pg_temp.connections(1),1::bigint,'and connections stay too');

-- Removing an entry or a character removes its bonds
reset role;
delete from public.characters where id in (pg_temp.ch(2),pg_temp.ch(4),pg_temp.ch(7));
select is((select count(*) from public.world_entry_bonds where entry_id=pg_temp.e(2)),0::bigint,
  'a deleted character takes its bonds with it');
select is(pg_temp.connections(1),0::bigint,'and its connections');
delete from public.world_entries where id in (pg_temp.e(2),pg_temp.e(4));
select is((select count(*) from public.world_entry_bonds where world_id=pg_temp.w('main')),0::bigint,'a deleted entry takes its bonds with it');
select is((select count(*) from public.world_entry_connections where world_id=pg_temp.w('main')),0::bigint,'and its connections');

select * from finish();
rollback;
