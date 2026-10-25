-- Character edit access: the owner picks who else fills in the sheet, editors
-- reach the whole sheet (row, assets, portrait files, world entry bonds), and
-- only the owner deletes the character or changes who owns or edits it. Every
-- fixture is rolled back.
begin;
create extension if not exists pgtap with schema extensions;
set search_path = public,extensions;
select no_plan();

-- 1 owner in a guided game, 2 its guide, 3 its player, 4 outsider,
-- 5 owner in a co-op game, 6 the other co-op member,
-- 7 world editor and 8 world viewer, neither in either game.
insert into auth.users(id)
  select ('c7000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid from generate_series(1,8) n;
create temporary table edit_worlds(key text primary key,id uuid);
grant all on edit_worlds to authenticated;
create function pg_temp.u(p_n integer) returns uuid language sql as $$
  select ('c7000000-0000-4000-8000-'||lpad(p_n::text,12,'0'))::uuid $$;
create function pg_temp.as_user(p_n integer) returns void language sql as $$
  select set_config('request.jwt.claim.sub',pg_temp.u(p_n)::text,true) $$;
create function pg_temp.game(p_key text) returns uuid language sql as $$
  select case p_key when 'guided' then 'c7100000-0000-4000-8000-000000000001'::uuid
    when 'co-op' then 'c7100000-0000-4000-8000-000000000002'::uuid end $$;
create function pg_temp.ch(p_key text) returns uuid language sql as $$
  select case p_key when 'guided' then 'c7200000-0000-4000-8000-000000000001'::uuid
    when 'co-op' then 'c7200000-0000-4000-8000-000000000002'::uuid end $$;
create function pg_temp.asset(p_key text) returns uuid language sql as $$
  select case p_key when 'guided' then 'c7300000-0000-4000-8000-000000000001'::uuid
    when 'co-op' then 'c7300000-0000-4000-8000-000000000002'::uuid end $$;
create function pg_temp.entry(p_n integer) returns uuid language sql as $$
  select ('c7400000-0000-4000-8000-'||lpad(p_n::text,12,'0'))::uuid $$;
create function pg_temp.w() returns uuid language sql as $$
  select id from edit_worlds where key='main' $$;
-- Sets a character's edit permissions outside RLS, as a request with no user.
create function pg_temp.share(p_key text,p_permissions text) returns void language sql as $$
  select set_config('request.jwt.claim.sub','',true);
  update public.characters set edit_permissions=p_permissions::public.character_edit_permissions
    where id=pg_temp.ch(p_key) $$;
-- Runs a write and reports how many rows it touched (or the SQLSTATE it
-- raised), then undoes it so each case starts from the same fixtures.
create function pg_temp.try(p_sql text) returns text language plpgsql as $$
declare v_rows bigint;
begin
  execute p_sql;
  get diagnostics v_rows = row_count;
  raise exception using errcode = 'P0099', message = v_rows::text;
exception
  when sqlstate 'P0099' then return 'rows '||sqlerrm;
  when others then return sqlstate;
end $$;
grant execute on function pg_temp.try(text) to authenticated;
-- Tries every sheet write on a character as a user and lists the ones that
-- landed: 'all', 'none', or the names of the writes that went through.
create function pg_temp.access(p_n integer,p_key text) returns text language plpgsql as $$
declare
  v_character uuid := pg_temp.ch(p_key);
  v_asset uuid := pg_temp.asset(p_key);
  v_allowed text[] := '{}';
  v_total integer := 0;
  v_write record;
begin
  perform pg_temp.as_user(p_n);
  for v_write in select * from (values
    ('update sheet',format($q$update public.characters set name='Edited' where id=%L$q$,v_character)),
    ('add asset',format($q$insert into public.assets(character_id,datasworn_asset_id,"order")
      values (%L,'asset:classic/path/new',9)$q$,v_character)),
    ('edit asset',format($q$update public.assets set "order"=5 where id=%L$q$,v_asset)),
    ('remove asset',format($q$delete from public.assets where id=%L$q$,v_asset)),
    ('add bond',format($q$insert into public.world_entry_bonds(entry_id,character_id) values (%L,%L)$q$,
      pg_temp.entry(2),v_character)),
    ('remove bond',format($q$delete from public.world_entry_bonds where entry_id=%L and character_id=%L$q$,
      pg_temp.entry(1),v_character)),
    ('upload image',format($q$insert into storage.objects(bucket_id,name) values ('characters',%L)$q$,
      v_character||'/new.png')),
    ('replace image',format($q$update storage.objects set metadata='{"size":1}' where bucket_id='characters' and name=%L$q$,
      v_character||'/portrait.png')),
    ('remove image',format($q$delete from storage.objects where bucket_id='characters' and name=%L$q$,
      v_character||'/portrait.png'))
  ) w(label,statement) loop
    v_total := v_total + 1;
    if pg_temp.try(v_write.statement) = 'rows 1' then
      v_allowed := v_allowed || v_write.label;
    end if;
  end loop;
  return case cardinality(v_allowed) when v_total then 'all' when 0 then 'none'
    else array_to_string(v_allowed,', ') end;
end $$;
grant execute on function pg_temp.access(integer,text) to authenticated;

-- Schema
select has_column('public','characters','edit_permissions','characters have edit permissions');
select col_not_null('public','characters','edit_permissions','edit permissions are always set');
select col_default_is('public','characters','edit_permissions','only_owner'::public.character_edit_permissions,
  'only the owner edits by default');
select enum_has_labels('public','character_edit_permissions',
  array['only_owner','guides_and_owner','all_players'],'the three edit permission choices');
select has_function('public','can_edit_character',array['uuid','uuid'],'can_edit_character exists');
select is_definer('public','can_edit_character',array['uuid','uuid'],
  'can_edit_character reads characters and game_players past their policies');
select ok(has_function_privilege('authenticated','public.can_edit_character(uuid,uuid)','EXECUTE')
  and has_function_privilege('service_role','public.can_edit_character(uuid,uuid)','EXECUTE')
  and not has_function_privilege('anon','public.can_edit_character(uuid,uuid)','EXECUTE'),
  'only signed-in clients and the service role can call can_edit_character');
select has_trigger('public','characters','characters_guard_owner_columns',
  'a trigger guards the owner-only columns');
select ok(not has_function_privilege('authenticated','public.character_guard_owner_columns()','EXECUTE')
  and not has_function_privilege('anon','public.character_guard_owner_columns()','EXECUTE'),
  'the owner column guard is not exposed to clients');
select is((select count(*) from pg_policies where schemaname='public' and tablename='characters'
    and policyname='User or guide can update character'),0::bigint,
  'the old guide update policy is gone');
select is((select array_agg(permissive order by policyname)::text from pg_policies
    where schemaname='public' and tablename='assets' and policyname like 'Prevent invalid asset%'),
  '{RESTRICTIVE,RESTRICTIVE}','the asset shape checks are requirements, not grants');

-- Fixtures
set local role authenticated;
select pg_temp.as_user(1);
insert into edit_worlds values ('main',public.create_world('Bonds'));
reset role;
insert into public.games(id,name,game_type,world_id) values
  (pg_temp.game('guided'),'Guided','guided',pg_temp.w()),
  (pg_temp.game('co-op'),'Co-op','co-op',pg_temp.w());
-- Co-op games store no guide row; every member is a Guide.
insert into public.game_players(game_id,user_id,role) values
  (pg_temp.game('guided'),pg_temp.u(1),'player'),
  (pg_temp.game('guided'),pg_temp.u(2),'guide'),
  (pg_temp.game('guided'),pg_temp.u(3),'player'),
  (pg_temp.game('co-op'),pg_temp.u(5),'player'),
  (pg_temp.game('co-op'),pg_temp.u(6),'player');
insert into public.world_players(world_id,user_id,role) values
  (pg_temp.w(),pg_temp.u(7),'editor'),(pg_temp.w(),pg_temp.u(8),'viewer');
insert into public.characters(id,uid,game_id,name) values
  (pg_temp.ch('guided'),pg_temp.u(1),pg_temp.game('guided'),'Kira'),
  (pg_temp.ch('co-op'),pg_temp.u(5),pg_temp.game('co-op'),'Ash');
insert into public.assets(id,character_id,datasworn_asset_id,"order") values
  (pg_temp.asset('guided'),pg_temp.ch('guided'),'asset:classic/path/old',1),
  (pg_temp.asset('co-op'),pg_temp.ch('co-op'),'asset:classic/path/old',1);
set local role authenticated;
select pg_temp.as_user(1);
insert into public.world_entries(id,world_id,category_id,name,author_id) values
  (pg_temp.entry(1),pg_temp.w(),extensions.uuid_generate_v5(pg_temp.w(),'category:locations'),'Bonded',auth.uid()),
  (pg_temp.entry(2),pg_temp.w(),extensions.uuid_generate_v5(pg_temp.w(),'category:locations'),'Unbonded',auth.uid());
reset role;
insert into public.world_entry_bonds(entry_id,character_id) values
  (pg_temp.entry(1),pg_temp.ch('guided')),(pg_temp.entry(1),pg_temp.ch('co-op'));
insert into storage.objects(bucket_id,name) values
  ('characters',pg_temp.ch('guided')||'/portrait.png'),('characters',pg_temp.ch('co-op')||'/portrait.png');
-- The characters bucket has no SELECT policy (reads use the public URL), and
-- Postgres applies SELECT policies to an UPDATE or DELETE with a WHERE clause,
-- so without one every image update and delete here would touch no rows and
-- prove nothing. This test-only policy lets the write policies decide.
create policy "Test reads character images" on storage.objects for select to authenticated
  using (bucket_id = 'characters');

select is((select edit_permissions::text from public.characters where id=pg_temp.ch('guided')),'only_owner',
  'a new character is only editable by its owner');

-- Guided game
set local role authenticated;
select is(pg_temp.access(1,'guided'),'all','only_owner: the owner edits the whole sheet');
select is(pg_temp.access(2,'guided'),'none','only_owner: the Guide edits nothing (the old guide update is gone)');
select is(pg_temp.access(3,'guided'),'none','only_owner: other players edit nothing');
select is(pg_temp.access(4,'guided'),'none','only_owner: people outside the game edit nothing');
select is(pg_temp.access(7,'guided'),'none','only_owner: a world editor outside the game edits nothing');
select is(pg_temp.access(8,'guided'),'none','only_owner: a world viewer edits nothing');

reset role;
select pg_temp.share('guided','guides_and_owner');
set local role authenticated;
select is(pg_temp.access(1,'guided'),'all','guides_and_owner: the owner edits the whole sheet');
select is(pg_temp.access(2,'guided'),'all','guides_and_owner: the Guide edits the whole sheet');
select is(pg_temp.access(3,'guided'),'none','guides_and_owner: other players edit nothing');
select is(pg_temp.access(4,'guided'),'none','guides_and_owner: people outside the game edit nothing');
select is(pg_temp.access(7,'guided'),'none','guides_and_owner: a world editor outside the game edits nothing');
select is(pg_temp.access(8,'guided'),'none','guides_and_owner: a world viewer edits nothing');

reset role;
select pg_temp.share('guided','all_players');
set local role authenticated;
select is(pg_temp.access(1,'guided'),'all','all_players: the owner edits the whole sheet');
select is(pg_temp.access(2,'guided'),'all','all_players: the Guide edits the whole sheet');
select is(pg_temp.access(3,'guided'),'all','all_players: other players edit the whole sheet');
select is(pg_temp.access(4,'guided'),'none','all_players: people outside the game edit nothing');
select is(pg_temp.access(7,'guided'),'none','all_players: a world editor outside the game edits nothing');
select is(pg_temp.access(8,'guided'),'none','all_players: a world viewer edits nothing');

-- Co-op game: every member counts as a Guide.
select is(pg_temp.access(5,'co-op'),'all','co-op only_owner: the owner edits the whole sheet');
select is(pg_temp.access(6,'co-op'),'none','co-op only_owner: the other member edits nothing');
select is(pg_temp.access(4,'co-op'),'none','co-op only_owner: people outside the game edit nothing');
reset role;
select pg_temp.share('co-op','guides_and_owner');
set local role authenticated;
select is(pg_temp.access(5,'co-op'),'all','co-op guides_and_owner: the owner edits the whole sheet');
select is(pg_temp.access(6,'co-op'),'all','co-op guides_and_owner: the other member edits as a Guide');
select is(pg_temp.access(4,'co-op'),'none','co-op guides_and_owner: people outside the game edit nothing');
reset role;
select pg_temp.share('co-op','all_players');
set local role authenticated;
select is(pg_temp.access(5,'co-op'),'all','co-op all_players: the owner edits the whole sheet');
select is(pg_temp.access(6,'co-op'),'all','co-op all_players: the other member edits the whole sheet');
select is(pg_temp.access(4,'co-op'),'none','co-op all_players: people outside the game edit nothing');

-- can_edit_character directly
select is(public.can_edit_character(pg_temp.ch('guided'),null),false,'no user edits nothing');
select is(public.can_edit_character('c7200000-0000-4000-8000-000000000099',pg_temp.u(1)),false,
  'an unknown character is not editable');
select is(public.can_edit_character(pg_temp.ch('guided'),pg_temp.u(3)),true,
  'can_edit_character agrees with the policies');

-- Owner-only columns (the guided character is shared with all players here)
select pg_temp.as_user(2);
select is(pg_temp.try($$update public.characters set edit_permissions='only_owner' where id=pg_temp.ch('guided')$$),
  '42501','a Guide cannot change who edits a character');
select is(pg_temp.try($$update public.characters set uid=pg_temp.u(2) where id=pg_temp.ch('guided')$$),
  '42501','a Guide cannot take a character');
select is(pg_temp.try($$update public.characters set game_id=pg_temp.game('co-op') where id=pg_temp.ch('guided')$$),
  '42501','a Guide cannot move a character to another game');
select is(pg_temp.try($$update public.characters set id='c7200000-0000-4000-8000-000000000098' where id=pg_temp.ch('guided')$$),
  '42501','a Guide cannot change a character''s id');
select pg_temp.as_user(3);
select is(pg_temp.try($$update public.characters set edit_permissions='all_players', name='Saved' where id=pg_temp.ch('guided')$$),
  'rows 1','an editor can save the whole row when who edits it is unchanged');
select is(pg_temp.try($$update public.characters set uid=pg_temp.u(3) where id=pg_temp.ch('guided')$$),
  '42501','a player cannot take a character');
select is(pg_temp.try($$update public.characters set edit_permissions='only_owner' where id=pg_temp.ch('guided')$$),
  '42501','a player cannot lock other editors out');
select pg_temp.as_user(4);
select is(pg_temp.try($$update public.characters set edit_permissions='all_players' where id=pg_temp.ch('guided')$$),
  'rows 0','people outside the game cannot change who edits a character');

select pg_temp.as_user(1);
select is(pg_temp.try($$update public.characters set edit_permissions='guides_and_owner' where id=pg_temp.ch('guided')$$),
  'rows 1','the owner changes who edits their character');
select is(pg_temp.try($$update public.characters set game_id=pg_temp.game('co-op') where id=pg_temp.ch('guided')$$),
  'rows 1','the owner can still move their character to another game');
select is(pg_temp.try($$update public.characters set uid=pg_temp.u(2) where id=pg_temp.ch('guided')$$),
  '42501','the owner cannot give their character to someone else');
select is(pg_temp.try($$update public.characters set uid=pg_temp.u(2), edit_permissions='all_players' where id=pg_temp.ch('guided')$$),
  '42501','the owner cannot give their character away while sharing it');

-- Only the owner deletes
select pg_temp.as_user(2);
select is(pg_temp.try($$delete from public.characters where id=pg_temp.ch('guided')$$),'rows 0',
  'a Guide who can edit the character cannot delete it');
select pg_temp.as_user(3);
select is(pg_temp.try($$delete from public.characters where id=pg_temp.ch('guided')$$),'rows 0',
  'a player who can edit the character cannot delete it');
select pg_temp.as_user(1);
select is(pg_temp.try($$delete from public.characters where id=pg_temp.ch('guided')$$),'rows 1',
  'the owner deletes their character');

-- The asset shape checks now hold for everyone
select is(pg_temp.try(format($q$insert into public.assets(character_id,game_id,datasworn_asset_id,"order")
    values (%L,%L,'asset:classic/path/both',1)$q$,pg_temp.ch('guided'),pg_temp.game('guided'))),
  '42501','an asset cannot belong to a character and a game at once');
select is(pg_temp.try(format($q$insert into public.assets(game_id,datasworn_asset_id,"order")
    values (%L,'asset:classic/path/shared',1)$q$,pg_temp.game('guided'))),
  'rows 1','game members still add game assets');
select pg_temp.as_user(4);
select is(pg_temp.try(format($q$insert into public.assets(game_id,datasworn_asset_id,"order")
    values (%L,'asset:classic/path/shared',1)$q$,pg_temp.game('guided'))),
  '42501','people outside a game cannot add its assets');

-- Requests without a user (service role, maintenance) are not guarded
reset role;
select set_config('request.jwt.claim.sub','',true);
select is(pg_temp.try($$update public.characters set uid=pg_temp.u(2) where id=pg_temp.ch('guided')$$),
  'rows 1','requests without a user can still reassign a character');

select * from finish();
rollback;
