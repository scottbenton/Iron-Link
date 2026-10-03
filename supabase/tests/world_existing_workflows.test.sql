-- Database-first rollout compatibility for origin/main's existing world UI.
-- Category/field editing was not reachable there; its old direct DML APIs are
-- intentionally superseded by mutate_world_configuration, tested elsewhere.
begin;
create extension if not exists pgtap with schema extensions;
set search_path = public,extensions;
select no_plan();
insert into auth.users(id) values
 ('e1000000-0000-4000-8000-000000000001'),
 ('e1000000-0000-4000-8000-000000000002'),
 ('e1000000-0000-4000-8000-000000000003');
insert into public.games(id,name,game_type,rulesets,expansions,playset) values
 ('e6000000-0000-4000-8000-000000000001','Existing workflow game','guided','["classic"]','[]','{}');
insert into public.game_players(game_id,user_id,role) values
 ('e6000000-0000-4000-8000-000000000001','e1000000-0000-4000-8000-000000000001','guide'),
 ('e6000000-0000-4000-8000-000000000001','e1000000-0000-4000-8000-000000000002','player');
create temporary table existing_workflow_worlds(key text primary key,id uuid);
grant all on existing_workflow_worlds to authenticated;
create function pg_temp.existing_world_id(p_key text) returns uuid language sql as $$
 select id from existing_workflow_worlds where key=p_key
$$;
create function pg_temp.existing_category_id(p_key text) returns uuid language sql as $$
 select extensions.uuid_generate_v5(pg_temp.existing_world_id(p_key),'category:locations')
$$;
create function pg_temp.existing_field_id(p_key text,p_field text) returns uuid language sql as $$
 select extensions.uuid_generate_v5(pg_temp.existing_world_id(p_key),'field:locations:'||p_field)
$$;
set local role authenticated;
select set_config('request.jwt.claim.sub','e1000000-0000-4000-8000-000000000001',true);
select lives_ok($$insert into existing_workflow_worlds values
 ('blank',public.create_world('Blank created from existing UI')),
 ('setting',public.create_world('Setting from existing UI',null,'world:classic/ironlands')),
 ('populated',public.create_world('Stored configuration',null,'world:classic/ironlands'))$$,
 'existing create RPC accepts blank and setting worlds');
select is((select count(*) from public.world_players where world_id in
 (select id from existing_workflow_worlds) and user_id=auth.uid() and role='owner'),3::bigint,
 'create still installs explicit owner membership');
select is((select count(*) from public.worlds where id in
 (select id from existing_workflow_worlds)),3::bigint,'existing world list can read created worlds');
select is((select count(*) from public.world_categories where world_id in
 (select id from existing_workflow_worlds)),0::bigint,'creation does not materialize unseen defaults');
select lives_ok($$update public.worlds set name='Renamed by existing UI'
 where id=pg_temp.existing_world_id('setting')$$,'existing direct world rename succeeds');
select is((select name from public.worlds where id=pg_temp.existing_world_id('setting')),
 'Renamed by existing UI','rename updates the world name');
select lives_ok($$update public.worlds set description='Existing description'
 where id=pg_temp.existing_world_id('setting')$$,'existing world description API succeeds');
select is(public.link_game_to_world('e6000000-0000-4000-8000-000000000001',
 pg_temp.existing_world_id('setting')),'{"divergences":[]}'::jsonb,'link RPC retains response contract');
select is((select world_id from public.games where id='e6000000-0000-4000-8000-000000000001'),
 pg_temp.existing_world_id('setting'),'link assigns game world');
select is((select count(*) from public.games where world_id=pg_temp.existing_world_id('setting')),
 1::bigint,'existing delete confirmation can count linked games');
select is(public.link_game_to_world('e6000000-0000-4000-8000-000000000001',
 pg_temp.existing_world_id('blank')),'{"divergences":[]}'::jsonb,'change world RPC retains response');
select lives_ok($$select public.unlink_game_from_world('e6000000-0000-4000-8000-000000000001')$$,
 'existing unlink RPC succeeds');
select is((select world_id from public.games where id='e6000000-0000-4000-8000-000000000001'),
 null::uuid,'unlink clears game world');
select lives_ok($$select public.link_game_to_world('e6000000-0000-4000-8000-000000000001',
 pg_temp.existing_world_id('setting'))$$,'relink before existing world deletion succeeds');

-- Configuration/entries pre-existed as a data contract even though category
-- editing was not mounted in the old UI. Preserve their read and delete behavior.
select public.mutate_world_configuration(pg_temp.existing_world_id('populated'),
 jsonb_build_object('type','update_category','id',pg_temp.existing_category_id('populated'),
 'changes',jsonb_build_object('name','Stored places')));
insert into public.world_players(world_id,user_id,role) values
 (pg_temp.existing_world_id('populated'),'e1000000-0000-4000-8000-000000000002','viewer');
insert into public.world_entries(id,world_id,category_id,name,author_id,read_permissions) values
 ('e5000000-0000-4000-8000-000000000001',pg_temp.existing_world_id('populated'),
 pg_temp.existing_category_id('populated'),'Shared entry',auth.uid(),'all_players'),
 ('e5000000-0000-4000-8000-000000000002',pg_temp.existing_world_id('populated'),
 pg_temp.existing_category_id('populated'),'Private entry',auth.uid(),'only_author');
insert into public.world_entry_field_values(entry_id,field_definition_id,world_id,value) values
 ('e5000000-0000-4000-8000-000000000001',pg_temp.existing_field_id('populated','locationType'),
 pg_temp.existing_world_id('populated'),'"Settlement"');
insert into public.world_entry_field_values(entry_id,field_definition_id,world_id,content) values
 ('e5000000-0000-4000-8000-000000000001',pg_temp.existing_field_id('populated','description'),
 pg_temp.existing_world_id('populated'),'\x010203');
select is((select count(*) from public.world_entries where world_id=pg_temp.existing_world_id('populated')),
 2::bigint,'owner can read shared and private entries');
select is((select count(*) from public.world_entry_field_values where world_id=pg_temp.existing_world_id('populated')),
 2::bigint,'owner can read public and GM field values');

select set_config('request.jwt.claim.sub','e1000000-0000-4000-8000-000000000002',true);
select is((select count(*) from public.worlds where id=pg_temp.existing_world_id('setting')),
 1::bigint,'existing linked game player can read world');
select is(public.world_role(pg_temp.existing_world_id('setting'),auth.uid()),'player',
 'existing role RPC retains linked player role');
select is((select count(*) from public.worlds where id=pg_temp.existing_world_id('populated')),
 1::bigint,'explicit viewer can read a shared world');
select is((select count(*) from public.world_entries where world_id=pg_temp.existing_world_id('populated')),
 1::bigint,'viewer reads shared entries while private entries stay hidden');
select is((select count(*) from public.world_entry_field_values where world_id=pg_temp.existing_world_id('populated')),
 1::bigint,'viewer reads public values while GM values stay hidden');
select throws_ok($$select public.unlink_game_from_world('e6000000-0000-4000-8000-000000000001')$$,
 'P0001','Must be a guide of the game to unlink it from a world','player cannot unlink the game');
select set_config('request.jwt.claim.sub','e1000000-0000-4000-8000-000000000003',true);
select is((select count(*) from public.worlds where id in (select id from existing_workflow_worlds)),
 0::bigint,'unshared worlds stay hidden from outsiders');
select is((select count(*) from public.world_entries where world_id=pg_temp.existing_world_id('populated')),
 0::bigint,'outsiders cannot read shared or private entries');

select set_config('request.jwt.claim.sub','e1000000-0000-4000-8000-000000000001',true);
select lives_ok($$delete from public.worlds where id=pg_temp.existing_world_id('setting')$$,
 'existing UI deletes inherited world with a linked game');
select is((select count(*) from public.worlds where id=pg_temp.existing_world_id('setting')),
 0::bigint,'existing deletion removes world');
select is((select world_id from public.games where id='e6000000-0000-4000-8000-000000000001'),
 null::uuid,'world deletion still unlinks games');
select lives_ok($$delete from public.worlds where id=pg_temp.existing_world_id('populated')$$,
 'existing UI deletes world with stored categories entries and values');
select is((select count(*) from public.world_entries where world_id=pg_temp.existing_world_id('populated')),
 0::bigint,'populated world deletion still cascades entries');
select is((select count(*) from public.world_entry_field_values where world_id=pg_temp.existing_world_id('populated')),
 0::bigint,'populated world deletion still cascades field values');
reset role;
select * from finish();
rollback;
