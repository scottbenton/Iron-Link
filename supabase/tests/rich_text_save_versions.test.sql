-- Merged saves guard each write with the row's updated_at, so every rich text
-- row must keep one that moves on update.
begin;
create extension if not exists pgtap with schema extensions;
set search_path = public,extensions;
select no_plan();

select has_column('public','notes','updated_at','notes keep a save version');
select col_not_null('public','notes','updated_at','a note always has a save version');
select has_trigger('public','notes','notes_set_updated_at','saving a note moves its version');
select has_trigger('public','world_entries','world_entries_set_updated_at',
  'saving an entry''s Notes moves its version');

select has_column('public','worlds','notes_updated_at','world Notes keep a save version');
select col_not_null('public','worlds','notes_updated_at','world Notes always have a save version');

-- World Notes save through a guarded RPC, as Guides may not update worlds.
-- 1 owner, 2 viewer, 3 outsider.
insert into auth.users(id)
  select ('e7000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid from generate_series(1,3) n;
create function pg_temp.u(p_n integer) returns uuid language sql as $$
  select ('e7000000-0000-4000-8000-'||lpad(p_n::text,12,'0'))::uuid $$;
create function pg_temp.as_user(p_n integer) returns void language sql as $$
  select set_config('request.jwt.claim.sub',pg_temp.u(p_n)::text,true) $$;
create function pg_temp.outcome(p_sql text) returns text language plpgsql as $$
begin
  execute p_sql;
  return 'ok';
exception when others then
  return sqlstate;
end $$;
grant execute on function pg_temp.outcome(text) to authenticated;
create temporary table notes_world(id uuid, version timestamptz);
grant all on notes_world to authenticated;
create function pg_temp.w() returns uuid language sql as $$ select id from notes_world $$;
create function pg_temp.version() returns timestamptz language sql as $$
  select notes_updated_at from public.worlds where id=pg_temp.w() $$;

set local role authenticated;
select pg_temp.as_user(1);
insert into notes_world(id) values (public.create_world('Notes',null));
reset role;
insert into public.world_players(world_id,user_id,role) values (pg_temp.w(),pg_temp.u(2),'viewer');
-- Each save is its own transaction in use; here they share one, so move the
-- version by hand to tell saves apart.
update public.worlds set notes_updated_at='2026-01-01' where id=pg_temp.w();
update notes_world set version=pg_temp.version();

set local role authenticated;
select pg_temp.as_user(1);
select isnt(public.update_world_notes_if_unchanged(pg_temp.w(),'\x01'::bytea,(select version from notes_world)),null,
  'an owner saves Notes still at the version they read');
select is((select notes_content from public.worlds where id=pg_temp.w()),'\x01'::bytea,'the save is stored');
select is(public.update_world_notes_if_unchanged(pg_temp.w(),'\x02'::bytea,(select version from notes_world)),null,
  'a save from an older version is refused, to merge and retry');
select is((select notes_content from public.worlds where id=pg_temp.w()),'\x01'::bytea,
  'a refused save leaves the stored Notes alone');
select pg_temp.as_user(2);
select is(pg_temp.outcome($$select public.update_world_notes_if_unchanged(pg_temp.w(),'\x03'::bytea,pg_temp.version())$$),'42501',
  'a viewer cannot save world Notes');
select pg_temp.as_user(3);
select is(pg_temp.outcome($$select public.update_world_notes_if_unchanged(pg_temp.w(),'\x03'::bytea,pg_temp.version())$$),'42501',
  'an outsider cannot save world Notes');
reset role;

update notes_world set version=pg_temp.version();
update public.worlds set name='Renamed' where id=pg_temp.w();
select is(pg_temp.version(),(select version from notes_world),'renaming a world leaves its Notes version alone');

select * from finish();
rollback;
