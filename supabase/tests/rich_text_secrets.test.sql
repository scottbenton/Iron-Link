-- Guide-only secrets: who can read and write a surface's secrets, that rows
-- can't be pointed elsewhere, merged saves, cascades, and the guide_images
-- bucket. Every fixture is rolled back.
begin;
create extension if not exists pgtap with schema extensions;
set search_path = public,extensions;
select no_plan();

-- 1 Guide, 2 and 3 players, 4 outsider, 5 co-op member, 6 world owner,
-- 7 world viewer, 8 world editor.
insert into auth.users(id)
  select ('f1000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid from generate_series(1,8) n;
create function pg_temp.u(p_n integer) returns uuid language sql as $$
  select ('f1000000-0000-4000-8000-'||lpad(p_n::text,12,'0'))::uuid $$;
create function pg_temp.as_user(p_n integer) returns void language sql as $$
  select set_config('request.jwt.claim.sub',pg_temp.u(p_n)::text,true) $$;
create function pg_temp.id(p_kind text,p_n integer) returns uuid language sql as $$
  select ((case p_kind when 'game' then 'f2' when 'note' then 'f3' when 'entry' then 'f4'
    when 'folder' then 'f5' end)||'000000-0000-4000-8000-'||lpad(p_n::text,12,'0'))::uuid $$;
create temporary table secret_world(id uuid);
grant all on secret_world to authenticated;
create function pg_temp.w() returns uuid language sql as $$ select id from secret_world $$;
create function pg_temp.outcome(p_sql text) returns text language plpgsql as $$
begin
  execute p_sql;
  return 'ok';
exception when others then
  return sqlstate;
end $$;
grant execute on function pg_temp.outcome(text) to authenticated;
-- Which surfaces' secrets the current user can see.
create function pg_temp.visible() returns text[] language sql as $$
  select coalesce(array_agg(s order by s),'{}') from (
    select case
      when note_id is not null then 'note '||right(note_id::text,1)
      when world_entry_id is not null then 'entry '||right(world_entry_id::text,1)
      else 'world' end s
    from public.rich_text_secrets) v $$;
create function pg_temp.add(p_column text,p_id uuid) returns text language sql as $$
  select pg_temp.outcome(format(
    'insert into public.rich_text_secrets(%I) values (%L) on conflict do nothing',p_column,p_id)) $$;
create function pg_temp.add_note(p_n integer) returns text language sql as $$
  select pg_temp.add('note_id',pg_temp.id('note',p_n)) $$;
create function pg_temp.add_entry(p_n integer) returns text language sql as $$
  select pg_temp.add('world_entry_id',pg_temp.id('entry',p_n)) $$;
create function pg_temp.upload(p_name text) returns text language sql as $$
  select pg_temp.outcome(format(
    'insert into storage.objects(bucket_id,name) values (''guide_images'',%L)',p_name)) $$;
create function pg_temp.images() returns text[] language sql as $$
  select coalesce(array_agg(name order by name),'{}') from storage.objects
  where bucket_id='guide_images' $$;

set local role authenticated;
select pg_temp.as_user(6);
insert into secret_world values (public.create_world('Secrets','world:classic/ironlands'));
reset role;

insert into public.games(id,name,game_type,world_id) values
  (pg_temp.id('game',1),'Guided','guided',pg_temp.w()),
  (pg_temp.id('game',2),'Co-op','co-op',null);
insert into public.game_players(game_id,user_id,role) values
  (pg_temp.id('game',1),pg_temp.u(1),'guide'),
  (pg_temp.id('game',1),pg_temp.u(2),'player'),
  (pg_temp.id('game',1),pg_temp.u(3),'player'),
  (pg_temp.id('game',2),pg_temp.u(5),'player');
insert into public.world_players(world_id,user_id,role) values
  (pg_temp.w(),pg_temp.u(7),'viewer'),
  (pg_temp.w(),pg_temp.u(8),'editor');
insert into public.note_folders(id,author_id,game_id,"order",read_permissions,edit_permissions,parent_folder_id)
  values (pg_temp.id('folder',1),pg_temp.u(1),pg_temp.id('game',1),1,'all_players','all_players',null),
    (pg_temp.id('folder',2),pg_temp.u(5),pg_temp.id('game',2),1,'all_players','all_players',null);
insert into public.notes(id,author_id,parent_folder_id,game_id,title,"order",read_permissions,edit_permissions)
  select pg_temp.id('note',n),pg_temp.u(a),pg_temp.id('folder',f),pg_temp.id('game',g),t,n,
    r::public.note_read_permissions,e::public.note_edit_permissions
  from (values (1,1,1,1,'Everyone','all_players','all_players'),
    (2,1,1,1,'Guides','only_guides','only_guides'),
    (3,2,1,1,'Private','only_author','only_author'),
    (4,2,1,1,'Player''s','all_players','only_author'),
    (5,5,2,2,'Co-op','all_players','all_players')) v(n,a,f,g,t,r,e);
insert into public.world_entries(id,world_id,category_id,name,author_id,read_permissions,edit_permissions)
  select pg_temp.id('entry',n),pg_temp.w(),extensions.uuid_generate_v5(pg_temp.w(),'category:npcs'),t,
    pg_temp.u(a),r::public.note_read_permissions,'only_author'
  from (values (1,6,'Everyone','all_players'),(2,1,'Guides','only_guides'),(3,2,'Private','only_author')) v(n,a,t,r);

-- Clients add and edit content, nothing else.
select ok(not has_table_privilege('authenticated','public.rich_text_secrets','DELETE,TRUNCATE'),
  'clients cannot delete secrets rows');
select ok(not has_table_privilege('anon','public.rich_text_secrets','SELECT,INSERT,UPDATE'),
  'signed-out clients cannot touch secrets');
select ok(not has_column_privilege('authenticated','public.rich_text_secrets','note_id','UPDATE')
  and not has_column_privilege('authenticated','public.rich_text_secrets','world_entry_id','UPDATE')
  and not has_column_privilege('authenticated','public.rich_text_secrets','world_id','UPDATE'),
  'clients cannot repoint a row at another surface');
select ok(not has_column_privilege('authenticated','public.rich_text_secrets','created_by','INSERT'),
  'clients cannot claim someone else created a row');

set local role authenticated;

-- Game notes: Guides who can read the note.
select pg_temp.as_user(2);
select is(pg_temp.add_note(1),'42501','a player cannot add secrets to a shared note');
select is(pg_temp.add_note(4),'42501','a player cannot add secrets to their own note');
select pg_temp.as_user(4);
select is(pg_temp.add_note(1),'42501','an outsider cannot add secrets');
select pg_temp.as_user(1);
select is(pg_temp.add_note(1),'ok','a Guide adds secrets to a shared note');
select is(pg_temp.add_note(2),'ok','a Guide adds secrets to a Guide-only note');
select is(pg_temp.add_note(4),'42501','a Guide cannot add secrets to a note only its author edits');
select is(pg_temp.add_note(3),'42501','a Guide cannot add secrets to a note they cannot read');
select is(pg_temp.add_note(5),'42501','a Guide of one game cannot add secrets to another game''s note');
select is(pg_temp.add_note(1),'ok','adding a surface''s secrets twice is not an error');
select is((select created_by from public.rich_text_secrets where note_id=pg_temp.id('note',1)),pg_temp.u(1),
  'the row records who created it');
select pg_temp.as_user(5);
select is(pg_temp.add_note(5),'ok','a co-op member is a Guide of their game');
select is(pg_temp.add('world_id',null),'42501','a row must name a surface');
select is(pg_temp.outcome(format(
  'insert into public.rich_text_secrets(note_id,world_id) values (%L,%L)',pg_temp.id('note',5),pg_temp.w())),
  '42501','a row cannot name two surfaces');

-- Entries and world Notes: world owners, editors and Guides who can read them.
select pg_temp.as_user(6);
select is(pg_temp.add_entry(1),'ok','the world owner adds secrets to a shared entry');
select is(pg_temp.add('world_id',pg_temp.w()),'ok','the world owner adds secrets to the world''s Notes');
select pg_temp.as_user(8);
select is(pg_temp.add_entry(2),'ok','a world editor adds secrets to a Guide-only entry');
select is(pg_temp.add_entry(3),'42501','a world editor cannot add secrets to an entry they cannot read');
select pg_temp.as_user(7);
select is(pg_temp.add_entry(1),'42501','a viewer cannot add secrets to an entry');
select is(pg_temp.add('world_id',pg_temp.w()),'42501','a viewer cannot add secrets to the world''s Notes');
select pg_temp.as_user(2);
select is(pg_temp.add_entry(3),'42501','a player cannot add secrets to their own entry');

reset role;
select is((select count(*) from public.rich_text_secrets where note_id=pg_temp.id('note',1)),1::bigint,
  'one row per surface');
-- Secrets added to note 4 while its Guide could still edit it.
insert into public.rich_text_secrets(note_id,content_text) values (pg_temp.id('note',4),'Older');
insert into storage.objects(bucket_id,name) values ('guide_images','notes/'||pg_temp.id('note',4)||'/old.png');
set local role authenticated;

-- Reading.
select pg_temp.as_user(1);
select is(pg_temp.visible(),array['entry 1','entry 2','note 1','note 2','note 4','world'],
  'a guided game''s Guide reads its notes'' and its world''s secrets, even where they cannot edit the note');
update public.rich_text_secrets set content_text='Changed' where note_id=pg_temp.id('note',4);
select is((select content_text from public.rich_text_secrets where note_id=pg_temp.id('note',4)),
  'Older','a Guide cannot change the secrets of a note they cannot edit');
select pg_temp.as_user(6);
select is(pg_temp.visible(),array['entry 1','entry 2','world'],'the world owner reads the world''s secrets');
select pg_temp.as_user(8);
select is(pg_temp.visible(),array['entry 1','entry 2','world'],'a world editor reads the world''s secrets');
select pg_temp.as_user(5);
select is(pg_temp.visible(),array['note 5'],'a co-op member reads their game''s secrets');
select pg_temp.as_user(2);
select is(pg_temp.visible(),'{}'::text[],'a player reads no secrets');
select pg_temp.as_user(7);
select is(pg_temp.visible(),'{}'::text[],'a viewer reads no secrets');
select pg_temp.as_user(4);
select is(pg_temp.visible(),'{}'::text[],'an outsider reads no secrets');

-- Saving: a guarded update, like any rich text. The row is put at an old
-- version first (skipping the trigger), since now() is fixed in a transaction.
reset role;
set local session_replication_role = replica;
update public.rich_text_secrets set updated_at='2026-01-01' where note_id=pg_temp.id('note',1);
set local session_replication_role = origin;
set local role authenticated;
select pg_temp.as_user(1);
update public.rich_text_secrets set content_bytes='\x01',content_text='The king is a dragon',
    mentioned_entry_ids=array[pg_temp.id('entry',1)]
  where note_id=pg_temp.id('note',1) and updated_at='2026-01-01';
select is((select content_text from public.rich_text_secrets where note_id=pg_temp.id('note',1)),
  'The king is a dragon','a Guide saves secrets at the version they read');
select ok((select updated_at from public.rich_text_secrets where note_id=pg_temp.id('note',1))
  > '2026-01-01','a save moves the version');
update public.rich_text_secrets set content_text='Stale'
  where note_id=pg_temp.id('note',1) and updated_at='2026-01-01';
select is((select content_text from public.rich_text_secrets where note_id=pg_temp.id('note',1)),
  'The king is a dragon','a save at an old version writes nothing');
select is((select array_agg(note_id) from public.rich_text_secrets
    where mentioned_entry_ids @> array[pg_temp.id('entry',1)]),array[pg_temp.id('note',1)],
  'Guides find the secrets that mention an entry');
select is(pg_temp.outcome(format('update public.rich_text_secrets set note_id=%L where note_id=%L',
  pg_temp.id('note',2),pg_temp.id('note',4))),'42501','a Guide cannot move a row to another note');
select pg_temp.as_user(2);
update public.rich_text_secrets set content_text='Overwritten' where note_id=pg_temp.id('note',1);
select pg_temp.as_user(1);
select is((select content_text from public.rich_text_secrets where note_id=pg_temp.id('note',1)),
  'The king is a dragon','a player''s update writes nothing');

-- Images.
select is(pg_temp.upload('notes/'||pg_temp.id('note',1)||'/map.png'),'ok','a Guide uploads an image to a note''s secrets');
select is(pg_temp.upload('worlds/'||pg_temp.w()||'/map.png'),'ok','a Guide uploads an image to world Notes secrets');
select is(pg_temp.upload('notes/'||pg_temp.id('note',3)||'/map.png'),'42501','not to a note they cannot read');
select is(pg_temp.upload('notes/'||pg_temp.id('note',4)||'/map.png'),'42501','not to a note they cannot edit');
select ok('notes/'||pg_temp.id('note',4)||'/old.png' = any(pg_temp.images()),
  'but they still read its guide images');
select is(pg_temp.outcome(format('delete from storage.objects where bucket_id=''guide_images'' and name=%L',
  'notes/'||pg_temp.id('note',4)||'/old.png')),'ok','deleting them is refused quietly');
select ok('notes/'||pg_temp.id('note',4)||'/old.png' = any(pg_temp.images()),
  'and leaves them in place');
select is(pg_temp.upload('notes/'||pg_temp.id('note',1)||'/x/map.png'),'42501','not to a deeper path');
select is(pg_temp.upload('notes/not-a-uuid/map.png'),'42501','not to a malformed path');
select is(pg_temp.upload('characters/'||pg_temp.id('note',1)||'/map.png'),'42501','not to an unknown kind');
select pg_temp.as_user(2);
select is(pg_temp.upload('notes/'||pg_temp.id('note',1)||'/peek.png'),'42501','a player cannot upload guide images');
select is(pg_temp.images(),'{}'::text[],'a player cannot list or sign guide images');
select pg_temp.as_user(7);
select is(pg_temp.images(),'{}'::text[],'a viewer cannot read world Notes guide images');
select pg_temp.as_user(6);
select is(pg_temp.images(),array['worlds/'||pg_temp.w()||'/map.png'],
  'the world owner reads the world''s guide images, not a game''s');
reset role;
select ok(not (select public from storage.buckets where id='guide_images'),'guide images are not public');

-- Access follows the surface and the role.
select set_config('request.jwt.claim.sub','',true);
update public.notes set read_permissions='only_guides' where id=pg_temp.id('note',1);
select ok(exists (select 1 from public.rich_text_secrets where note_id=pg_temp.id('note',1)),
  'making a note Guides only keeps its secrets');
update public.game_players set role='player' where game_id=pg_temp.id('game',1) and user_id=pg_temp.u(1);
set local role authenticated;
select pg_temp.as_user(1);
select is(pg_temp.visible(),'{}'::text[],'a Guide demoted to player reads no secrets');
reset role;
delete from public.notes where id=pg_temp.id('note',2);
delete from public.world_entries where id=pg_temp.id('entry',2);
select ok(not exists (select 1 from public.rich_text_secrets
    where note_id=pg_temp.id('note',2) or world_entry_id=pg_temp.id('entry',2)),
  'deleting a note or entry deletes its secrets');

select * from finish();
rollback;
