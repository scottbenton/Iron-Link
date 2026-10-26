-- Note and folder permissions: who can read, create, edit, manage and delete
-- each, by role and permission. Every fixture is rolled back.
begin;
create extension if not exists pgtap with schema extensions;
set search_path = public,extensions;
select no_plan();

-- 1 Guide, 2 and 3 players, 4 outsider, 5 co-op member.
insert into auth.users(id)
  select ('f1000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid from generate_series(1,5) n;
create function pg_temp.u(p_n integer) returns uuid language sql as $$
  select ('f1000000-0000-4000-8000-'||lpad(p_n::text,12,'0'))::uuid $$;
create function pg_temp.as_user(p_n integer) returns void language sql as $$
  select set_config('request.jwt.claim.sub',pg_temp.u(p_n)::text,true) $$;
create function pg_temp.id(p_kind text,p_n integer) returns uuid language sql as $$
  select ((case p_kind when 'game' then 'f2' when 'folder' then 'f3' when 'note' then 'f4' end)
    ||'000000-0000-4000-8000-'||lpad(p_n::text,12,'0'))::uuid $$;
-- What the current user can see.
create function pg_temp.readable_notes() returns integer[] language sql as $$
  select coalesce(array_agg(n order by n),'{}') from generate_series(1,9) n
  where exists (select 1 from public.notes where id=pg_temp.id('note',n)) $$;
create function pg_temp.readable_folders() returns integer[] language sql as $$
  select coalesce(array_agg(n order by n),'{}') from generate_series(1,9) n
  where exists (select 1 from public.note_folders where id=pg_temp.id('folder',n)) $$;
create function pg_temp.outcome(p_sql text) returns text language plpgsql as $$
begin
  execute p_sql;
  return 'ok';
exception when others then
  return sqlstate;
end $$;
grant execute on function pg_temp.outcome(text) to authenticated;
-- Runs a write and reports how many rows it touched, then undoes it.
create function pg_temp.rows(p_sql text) returns text language plpgsql as $$
declare v_rows bigint;
begin
  execute p_sql;
  get diagnostics v_rows = row_count;
  raise exception using errcode = 'P0099', message = v_rows::text;
exception
  when sqlstate 'P0099' then return 'rows '||sqlerrm;
  when others then return sqlstate;
end $$;
grant execute on function pg_temp.rows(text) to authenticated;

insert into public.games(id,name,game_type) values
  (pg_temp.id('game',1),'Guided','guided'),(pg_temp.id('game',2),'Co-op','co-op');
insert into public.game_players(game_id,user_id,role) values
  (pg_temp.id('game',1),pg_temp.u(1),'guide'),
  (pg_temp.id('game',1),pg_temp.u(2),'player'),
  (pg_temp.id('game',1),pg_temp.u(3),'player'),
  (pg_temp.id('game',2),pg_temp.u(5),'player');
-- 1 shared, 2 Guides only, 3 player 2's root folder, 4 public, 5 the co-op game's.
insert into public.note_folders(id,author_id,game_id,parent_folder_id,"order",read_permissions,edit_permissions,is_root_player_folder)
  values
  (pg_temp.id('folder',1),pg_temp.u(1),pg_temp.id('game',1),null,1,'all_players','all_players',false),
  (pg_temp.id('folder',2),pg_temp.u(1),pg_temp.id('game',1),null,1,'only_guides','only_guides',false),
  (pg_temp.id('folder',3),pg_temp.u(2),pg_temp.id('game',1),null,1,'only_author','only_author',true),
  (pg_temp.id('folder',4),pg_temp.u(1),pg_temp.id('game',1),null,1,'public','only_guides',false),
  (pg_temp.id('folder',5),pg_temp.u(5),pg_temp.id('game',2),null,1,'only_guides','only_guides',false);
-- Player 2's notes in the shared folder, one per read permission, then two
-- with other edit permissions.
insert into public.notes(id,author_id,parent_folder_id,game_id,title,"order",read_permissions,edit_permissions)
  select pg_temp.id('note',n),pg_temp.u(2),pg_temp.id('folder',1),pg_temp.id('game',1),t,n,
    r::public.note_read_permissions,e::public.note_edit_permissions
  from (values (1,'Public','public','only_author'),(2,'Everyone','all_players','all_players'),
    (3,'Guides and author','guides_and_author','guides_and_author'),(4,'Guides','only_guides','only_guides'),
    (5,'Author','only_author','only_author'),(6,'Shared, author edits','all_players','only_author'))
    v(n,t,r,e);

-- Reading.
set local role authenticated;
select pg_temp.as_user(1);
select is(pg_temp.readable_notes(),array[1,2,3,4,6],'a Guide reads every note but a private one');
select is(pg_temp.readable_folders(),array[1,2,4],'a Guide reads shared and Guide-only folders');
select pg_temp.as_user(2);
select is(pg_temp.readable_notes(),array[1,2,3,5,6],'an author reads their own notes and shared ones');
select is(pg_temp.readable_folders(),array[1,3,4],'a player reads shared folders and their own root folder');
select pg_temp.as_user(3);
select is(pg_temp.readable_notes(),array[1,2,6],'another player cannot read Guide-only or private notes');
select is(pg_temp.readable_folders(),array[1,4],'another player cannot read Guide-only or private folders');
select is((select note_content_bytes from public.notes where id=pg_temp.id('note',4)),null,
  'another player cannot select a Guide-only note''s content');
select pg_temp.as_user(4);
select is(pg_temp.readable_notes(),array[1],'an outsider reads only public notes');
select is(pg_temp.readable_folders(),array[4],'an outsider reads only public folders');
select pg_temp.as_user(5);
select is(pg_temp.readable_folders(),array[4,5],'a co-op member is a Guide of their own game only');

-- Deleting, which any member of any game could do to folders before.
select pg_temp.as_user(4);
select is(pg_temp.rows($$delete from public.note_folders where id=pg_temp.id('folder',1)$$),'rows 0',
  'an outsider cannot delete a folder');
select pg_temp.as_user(3);
select is(pg_temp.rows($$delete from public.note_folders where id=pg_temp.id('folder',1)$$),'rows 0',
  'a player cannot delete a folder they did not write');
select is(pg_temp.rows($$delete from public.notes where id=pg_temp.id('note',2)$$),'rows 0',
  'a player cannot delete another''s note, even one everyone edits');
select pg_temp.as_user(2);
select is(pg_temp.rows($$delete from public.notes where id=pg_temp.id('note',2)$$),'rows 1',
  'an author deletes their note');
select pg_temp.as_user(1);
select is(pg_temp.rows($$delete from public.notes where id=pg_temp.id('note',4)$$),'rows 1',
  'a Guide deletes a note only Guides edit');
select is(pg_temp.rows($$delete from public.notes where id=pg_temp.id('note',3)$$),'rows 0',
  'a Guide cannot delete a player''s note the player also edits');
select is(pg_temp.rows($$delete from public.note_folders where id=pg_temp.id('folder',2)$$),'rows 1',
  'a folder''s author deletes it');

-- Editing.
select pg_temp.as_user(3);
select is(pg_temp.outcome($$update public.notes set title='Mine now' where id=pg_temp.id('note',2)$$),'ok',
  'a player edits a note everyone edits');
select is(pg_temp.outcome($$update public.notes set note_content_text='Overwritten' where id=pg_temp.id('note',6)$$),'42501',
  'a player cannot edit the content of a note only its author edits');
select is(pg_temp.outcome($$update public.notes set "order"=20 where id=pg_temp.id('note',6)$$),'ok',
  'a folder editor reorders a note they cannot edit');
select is(pg_temp.outcome($$update public.notes set read_permissions='only_author' where id=pg_temp.id('note',2)$$),'42501',
  'a player cannot change who can read another''s note');
select is(pg_temp.outcome($$update public.notes set author_id=pg_temp.u(3) where id=pg_temp.id('note',2)$$),'42501',
  'a player cannot take over another''s note');
select is(pg_temp.rows($$update public.notes set title='Seen' where id=pg_temp.id('note',5)$$),'rows 0',
  'a player cannot touch a private note');
select pg_temp.as_user(2);
select is(pg_temp.outcome($$update public.notes set read_permissions='only_author',edit_permissions='only_author'
  where id=pg_temp.id('note',2)$$),'ok','an author changes their note''s permissions');
select is(pg_temp.outcome($$update public.notes set parent_folder_id=pg_temp.id('folder',3) where id=pg_temp.id('note',6)$$),'ok',
  'an author moves their note into their own folder');
select is(pg_temp.outcome($$update public.notes set parent_folder_id=pg_temp.id('folder',5) where id=pg_temp.id('note',6)$$),'42501',
  'a note cannot move into another game''s folder');
select is(pg_temp.outcome($$update public.notes set game_id=pg_temp.id('game',2) where id=pg_temp.id('note',6)$$),'42501',
  'a note cannot move to another game');

select pg_temp.as_user(3);
select is(pg_temp.rows($$update public.note_folders set name='Renamed' where id=pg_temp.id('folder',4)$$),'rows 0',
  'a player cannot rename a folder only Guides edit');
select is(pg_temp.outcome($$update public.note_folders set name='Renamed' where id=pg_temp.id('folder',1)$$),'ok',
  'a player renames a folder everyone edits');
select is(pg_temp.outcome($$update public.note_folders set read_permissions='only_author' where id=pg_temp.id('folder',1)$$),'42501',
  'a player cannot change who can read another''s folder');
select pg_temp.as_user(1);
select is(pg_temp.outcome($$update public.note_folders set read_permissions='only_guides' where id=pg_temp.id('folder',1)$$),'ok',
  'a folder''s author changes its permissions');
update public.note_folders set read_permissions='all_players' where id=pg_temp.id('folder',1);

-- Creating.
select pg_temp.as_user(3);
select is(pg_temp.outcome($$insert into public.notes(author_id,parent_folder_id,game_id,"order",read_permissions,edit_permissions)
  values (pg_temp.u(3),pg_temp.id('folder',1),pg_temp.id('game',1),9,'all_players','all_players')$$),'ok',
  'a player creates a note in a folder they edit');
select is(pg_temp.outcome($$insert into public.notes(author_id,parent_folder_id,game_id,"order",read_permissions,edit_permissions)
  values (pg_temp.u(2),pg_temp.id('folder',1),pg_temp.id('game',1),9,'all_players','all_players')$$),'42501',
  'a player cannot create a note as someone else');
select is(pg_temp.outcome($$insert into public.notes(author_id,parent_folder_id,game_id,"order",read_permissions,edit_permissions)
  values (pg_temp.u(3),pg_temp.id('folder',4),pg_temp.id('game',1),9,'all_players','all_players')$$),'42501',
  'a player cannot create a note in a folder only Guides edit');
select is(pg_temp.outcome($$insert into public.notes(author_id,parent_folder_id,game_id,"order",read_permissions,edit_permissions)
  values (pg_temp.u(3),pg_temp.id('folder',1),pg_temp.id('game',2),9,'all_players','all_players')$$),'42501',
  'a note cannot name another game than its folder''s');
select is(pg_temp.outcome($$insert into public.note_folders(author_id,game_id,parent_folder_id,"order",read_permissions,edit_permissions,is_root_player_folder)
  values (pg_temp.u(3),pg_temp.id('game',1),null,0,'only_author','only_author',true)$$),'ok',
  'a player creates their root folder');
select is(pg_temp.outcome($$insert into public.note_folders(author_id,game_id,parent_folder_id,"order",read_permissions,edit_permissions)
  values (pg_temp.u(3),pg_temp.id('game',1),pg_temp.id('folder',4),1,'public','only_guides')$$),'42501',
  'a player cannot create a folder inside one only Guides edit');
select pg_temp.as_user(4);
select is(pg_temp.outcome($$insert into public.note_folders(author_id,game_id,parent_folder_id,"order",read_permissions,edit_permissions)
  values (pg_temp.u(4),pg_temp.id('game',1),null,0,'only_author','only_author')$$),'42501',
  'an outsider cannot create folders in a game');
reset role;

-- Room keys share the read rule.
select ok(public.note_readable(pg_temp.id('note',1),pg_temp.u(4))
  and not public.note_readable(pg_temp.id('note',5),pg_temp.u(1)),
  'room keys follow the same read rule as notes');

select * from finish();
rollback;
