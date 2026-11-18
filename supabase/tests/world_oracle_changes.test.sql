-- Oracle target changes in shared worlds: saved roll targets move only by
-- compare-and-set, each move is recorded once, keeping the old oracle pins it
-- without a record, the save dialog's choices land with the link, unlink or
-- playset change that caused them, and each game dismisses its own banner.
-- Every fixture is rolled back.
begin;
create extension if not exists pgtap with schema extensions;
set search_path = public,extensions;
select no_plan();

-- 1 owner, 2 world editor, 3 co-op member (a Guide of an unguided game),
-- 4 Guide of a guided game, 5 player of that game, 6 outsider who guides a
-- game of their own and edits the world.
insert into auth.users(id)
  select ('e3100000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid from generate_series(1,6) n;
create temporary table oc_worlds(key text primary key,id uuid);
grant all on oc_worlds to authenticated;
create function pg_temp.u(p_n integer) returns uuid language sql as $$
  select ('e3100000-0000-4000-8000-'||lpad(p_n::text,12,'0'))::uuid $$;
create function pg_temp.as_user(p_n integer) returns void language sql as $$
  select set_config('request.jwt.claim.sub',pg_temp.u(p_n)::text,true) $$;
create function pg_temp.w(p_key text default 'main') returns uuid language sql as $$
  select id from oc_worlds where key=p_key $$;
create function pg_temp.game(p_n integer) returns uuid language sql as $$
  select ('e3500000-0000-4000-8000-'||lpad(p_n::text,12,'0'))::uuid $$;
create function pg_temp.category() returns uuid language sql as $$
  select 'e3600000-0000-4000-8000-000000000001'::uuid $$;
create function pg_temp.kind_field() returns uuid language sql as $$
  select 'e3600000-0000-4000-8000-000000000002'::uuid $$;
create function pg_temp.field() returns uuid language sql as $$
  select 'e3600000-0000-4000-8000-000000000003'::uuid $$;
create function pg_temp.oracle(p_name text) returns text language sql as $$
  select 'oracle_rollable:'||p_name $$;
create function pg_temp.binding(p_name text) returns jsonb language sql as $$
  select jsonb_build_object('packageId',split_part(p_name,'/',1),'oracleId',pg_temp.oracle(p_name),
    'resolvedOracleId',pg_temp.oracle(p_name)) $$;
create function pg_temp.change(p_previous text,p_next text,p_rule integer default null,p_keep boolean default null)
  returns jsonb language sql as $$
  select jsonb_build_object('fieldId',pg_temp.field(),'ruleIndex',p_rule,
    'previousOracleId',pg_temp.oracle(p_previous),'nextOracleId',pg_temp.oracle(p_next))
    || case when p_keep is null then '{}'::jsonb else jsonb_build_object('keep',p_keep) end $$;
create function pg_temp.record(p_previous text,p_next text,p_rule integer default null) returns integer
  language sql as $$
  select public.record_world_oracle_changes(pg_temp.w(),jsonb_build_array(pg_temp.change(p_previous,p_next,p_rule)),
    public.get_world_playsets(pg_temp.w())) $$;
create function pg_temp.rolls(p_rule integer default null) returns text language sql security definer as $$
  select replace(coalesce(case when p_rule is null then binding
      else configuration->'rules'->p_rule->'binding' end->>'resolvedOracleId','none'),'oracle_rollable:','')
    ||case when (case when p_rule is null then binding
      else configuration->'rules'->p_rule->'binding' end->>'exact')::boolean then ' (exact)' else '' end
  from public.world_field_definitions where id=pg_temp.field() $$;
create function pg_temp.changes() returns text language sql security definer as $$
  select coalesce(string_agg(coalesce(rule_index::text,'field')||': '
      ||replace(previous_oracle_id,'oracle_rollable:','')||' -> '||replace(next_oracle_id,'oracle_rollable:','')
      ||coalesce(' by '||(select name from public.games g where g.id=source_game_id),''),
    ', ' order by coalesce(rule_index,-1)),'')
  from public.world_oracle_changes where world_id=pg_temp.w() $$;
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

select ok(not has_table_privilege('authenticated','public.world_oracle_changes','INSERT')
  and not has_table_privilege('authenticated','public.world_oracle_changes','UPDATE')
  and not has_table_privilege('authenticated','public.world_oracle_changes','DELETE'),
  'clients only read oracle changes');
select ok(not has_table_privilege('authenticated','public.world_oracle_change_dismissals','INSERT')
  and not has_table_privilege('authenticated','public.world_oracle_change_dismissals','UPDATE'),
  'clients only read dismissals');
select ok(not has_function_privilege('authenticated','public.world_oracle_apply_changes(uuid,uuid,jsonb)','EXECUTE'),
  'the compare-and-set is not exposed to clients');
select ok(not has_function_privilege('anon','public.record_world_oracle_changes(uuid,jsonb,jsonb)','EXECUTE')
  and not has_function_privilege('anon','public.update_game_rules(uuid,jsonb,jsonb,jsonb,jsonb)','EXECUTE')
  and not has_function_privilege('anon','public.link_game_to_world(uuid,uuid,jsonb)','EXECUTE')
  and not has_function_privilege('anon','public.unlink_game_from_world(uuid,jsonb)','EXECUTE'),
  'signed out visitors cannot change oracle targets');
select hasnt_function('public','link_game_to_world',array['uuid','uuid'],'the two-argument link is replaced');
select hasnt_function('public','unlink_game_from_world',array['uuid'],'the one-argument unlink is replaced');

-- Fixtures: a customized world with one bound field whose rule has its own
-- binding, linked to a co-op game and a guided game. Game 3 belongs to user 6.
set local role authenticated;
select pg_temp.as_user(1);
insert into oc_worlds values ('main',public.create_world('Oracles')),('other',public.create_world('Other'));
select public.mutate_world_configuration(pg_temp.w(),jsonb_build_object('type','create_category',
  'category',jsonb_build_object('id',pg_temp.category(),'name','Places')));
select public.mutate_world_configuration(pg_temp.w(),jsonb_build_object('type','create_field',
  'category_id',pg_temp.category(),'field',jsonb_build_object('id',pg_temp.kind_field(),'key','kind',
    'label','Kind','type','text','configuration',jsonb_build_object('version',1,'suggestions','[]'::jsonb,
      'helpText','','visible',true,'rules','[]'::jsonb),'sort_order',0)));
select public.mutate_world_configuration(pg_temp.w(),jsonb_build_object('type','create_field',
  'category_id',pg_temp.category(),'field',jsonb_build_object('id',pg_temp.field(),'key','name',
    'label','Name','type','text','binding',pg_temp.binding('starforged/name'),
    'configuration',jsonb_build_object('version',1,'suggestions','[]'::jsonb,'helpText','','visible',true,
      'rules',jsonb_build_array(jsonb_build_object(
        'conditions',jsonb_build_array(jsonb_build_object('source','entry','fieldId',pg_temp.kind_field(),
          'operator','equals','value','Vault')),
        'binding',pg_temp.binding('starforged/vault')))),'sort_order',1)));
reset role;
insert into public.games(id,name,game_type,world_id,rulesets) values
  (pg_temp.game(1),'Co-op','co-op',pg_temp.w(),'{"starforged":true}'),
  (pg_temp.game(2),'Guided','guided',pg_temp.w(),'{"starforged":true}'),
  (pg_temp.game(3),'Newcomer','solo',null,'{"starforged":true}');
insert into public.game_players(game_id,user_id,role) values
  (pg_temp.game(1),pg_temp.u(3),'guide'),(pg_temp.game(2),pg_temp.u(4),'guide'),
  (pg_temp.game(2),pg_temp.u(5),'player'),(pg_temp.game(3),pg_temp.u(6),'guide');
insert into public.world_players(world_id,user_id,role) values
  (pg_temp.w(),pg_temp.u(2),'editor'),(pg_temp.w(),pg_temp.u(6),'editor');

select is(pg_temp.rolls()||' / '||pg_temp.rolls(0),'starforged/name / starforged/vault','fixture rolls');

-- Recording what a reader found.
set local role authenticated;
select pg_temp.as_user(5);
select is(pg_temp.outcome($$select pg_temp.record('starforged/name','starsmith/name')$$),
  '42501 Only world editors and Guides can record oracle changes','players do not record');
select pg_temp.as_user(4);
select is(pg_temp.record('starforged/name','starsmith/name'),1,'a Guide records a moved target');
reset role;
select is(pg_temp.rolls(),'starsmith/name','the field rolls the new target');
select is(pg_temp.changes(),'field: starforged/name -> starsmith/name','the change is recorded without a game');

-- Concurrent readers send the same change; the second finds it done.
set local role authenticated;
select pg_temp.as_user(2);
select is(pg_temp.record('starforged/name','starsmith/name'),0,'a repeated change writes nothing');
reset role;
select is((select count(*) from public.world_oracle_changes),1::bigint,'the change is recorded exactly once');

-- A stale reader can't overwrite a newer transition.
set local role authenticated;
select pg_temp.as_user(2);
select is(pg_temp.record('starforged/name','other/name'),0,'a change from a stale target is skipped');
reset role;
select is(pg_temp.rolls(),'starsmith/name','the newer target stays');

-- A reader whose playsets are out of date records nothing.
set local role authenticated;
select pg_temp.as_user(2);
select is(public.record_world_oracle_changes(pg_temp.w(),jsonb_build_array(pg_temp.change('starsmith/name','starforged/name')),
  '[]'::jsonb),0,'changes worked out from other playsets are not recorded');
reset role;
select is(pg_temp.rolls(),'starsmith/name','and move nothing');

-- Nothing moves when the target doesn't.
set local role authenticated;
select pg_temp.as_user(2);
select is(pg_temp.record('starsmith/name','starsmith/name'),0,'a change to the same target is not one');
select is(pg_temp.outcome($$select public.record_world_oracle_changes(pg_temp.w(),
  jsonb_build_array(pg_temp.change('starsmith/name','starforged/name',null,true)),public.get_world_playsets(pg_temp.w()))$$),
  'P0001 Invalid oracle change','readers cannot pin targets');
select is(pg_temp.outcome($$select public.record_world_oracle_changes(pg_temp.w(),
  jsonb_build_array(pg_temp.change('starsmith/name','x/y') || '{"extra":1}'),public.get_world_playsets(pg_temp.w()))$$),
  'P0001 Invalid oracle change','unknown keys are refused');
reset role;
select is(pg_temp.changes(),'field: starforged/name -> starsmith/name','nothing new is recorded');

-- A second move merges into the open change and shows again; moving back
-- removes it.
create temporary table oc_seq as select seq from public.world_oracle_changes;
set local role authenticated;
select pg_temp.as_user(2);
select is(pg_temp.record('starsmith/name','other/name'),1,'a second move applies');
reset role;
select is(pg_temp.changes(),'field: starforged/name -> other/name','it merges into the open change');
select ok((select seq from public.world_oracle_changes) > (select seq from oc_seq),'a merged change takes a later number');
set local role authenticated;
select pg_temp.as_user(2);
select is(pg_temp.record('other/name','starforged/name'),1,'moving back applies');
reset role;
select is(pg_temp.changes(),'','moving back to the first target leaves nothing to review');

-- Rule bindings move on their own.
set local role authenticated;
select pg_temp.as_user(2);
select is(pg_temp.record('starforged/vault','starsmith/vault',0),1,'a rule binding moves');
reset role;
select is(pg_temp.rolls()||' / '||pg_temp.rolls(0),'starforged/name / starsmith/vault','only the rule rolls a new target');
select is(pg_temp.changes(),'0: starforged/vault -> starsmith/vault','the rule change is recorded');

-- Editing a binding by hand settles its change; other edits don't.
set local role authenticated;
select pg_temp.as_user(1);
select public.mutate_world_configuration(pg_temp.w(),jsonb_build_object('type','update_field',
  'id',pg_temp.field(),'changes',jsonb_build_object('label','Place name')));
reset role;
select is(pg_temp.changes(),'0: starforged/vault -> starsmith/vault','a label edit keeps the change open');
set local role authenticated;
select pg_temp.as_user(1);
select public.mutate_world_configuration(pg_temp.w(),jsonb_build_object('type','update_field',
  'id',pg_temp.field(),'changes',jsonb_build_object('configuration',
    (select jsonb_set(configuration,'{rules,0,binding}',pg_temp.binding('starforged/cave'))
      from public.world_field_definitions where id=pg_temp.field()))));
reset role;
select is(pg_temp.changes(),'','choosing another oracle settles the change');

-- The field menu's fixes.
set local role authenticated;
select pg_temp.as_user(2);
select pg_temp.record('starforged/name','starsmith/name');
select ok(public.resolve_world_oracle_change((select id from public.world_oracle_changes),false),
  'following the playsets settles a change');
reset role;
select is(pg_temp.rolls()||' | '||pg_temp.changes(),'starsmith/name | ','and keeps the new target');
set local role authenticated;
select pg_temp.as_user(2);
select pg_temp.record('starsmith/name','other/name');
select pg_temp.as_user(5);
select ok(not public.resolve_world_oracle_change((select id from public.world_oracle_changes where true limit 1),false),
  'players cannot settle changes');
select pg_temp.as_user(2);
select ok(public.resolve_world_oracle_change((select id from public.world_oracle_changes),true),
  'always rolling the old oracle settles a change');
reset role;
select is(pg_temp.rolls()||' | '||pg_temp.changes(),'starsmith/name (exact) | ','and pins the old target');
select is((select binding->>'packageId' from public.world_field_definitions where id=pg_temp.field()),'starsmith',
  'the pin names the old target''s package');

-- Players don't read changes; editors and Guides do.
select public.world_oracle_apply_changes(pg_temp.w(),null,jsonb_build_array(pg_temp.change('starforged/cave','starsmith/cave',0)));
set local role authenticated;
select pg_temp.as_user(5);
select is((select count(*) from public.world_oracle_changes),0::bigint,'players read no changes');
select pg_temp.as_user(4);
select is((select count(*) from public.world_oracle_changes),1::bigint,'Guides read changes');
reset role;

-- A playset change saves the rules and the choices together.
set local role authenticated;
select pg_temp.as_user(3);
select lives_ok($$select public.update_game_rules(pg_temp.game(1),'{"starforged":true}','{"starforged":{"starsmith":true}}','{}',
  jsonb_build_array(pg_temp.change('starsmith/cave','other/cave',0,true)))$$,
  'a Guide saves rules with a choice');
reset role;
select is((select expansions->'starforged'->>'starsmith' from public.games where id=pg_temp.game(1)),'true','the rules are saved');
select is(pg_temp.rolls(0),'starsmith/cave (exact)','keeping the old oracle pins it');
select is(pg_temp.changes(),'0: starforged/cave -> starsmith/cave','and records nothing new');
set local role authenticated;
select pg_temp.as_user(5);
select is(pg_temp.outcome($$select public.update_game_rules(pg_temp.game(2),'{"ironsworn":true}','{}','{}',
  jsonb_build_array(pg_temp.change('starsmith/name','other/name')))$$),
  '42501 Only world editors and Guides can choose oracle changes','players cannot choose for the world');
select lives_ok($$select public.update_game_rules(pg_temp.game(2),'{"starforged":true}','{}','{"excludes":{}}')$$,
  'players still save rules without choices, as the games table allows');
select pg_temp.as_user(6);
select is(pg_temp.outcome($$select public.update_game_rules(pg_temp.game(2),'{"ironsworn":true}','{}','{}')$$),
  '42501 Only players in the game can change its rules','outsiders cannot save rules');
reset role;

-- Linking records its choices for the game that made them, in both worlds a
-- change of world touches.
update public.world_field_definitions set binding=pg_temp.binding('starforged/name') where id=pg_temp.field();
set local role authenticated;
select pg_temp.as_user(6);
select is(pg_temp.outcome($$select public.link_game_to_world(pg_temp.game(3),pg_temp.w(),
  jsonb_build_array(pg_temp.change('starforged/name','starsmith/name')))$$),
  'P0001 Invalid oracle changes','each choice names its world');
select is(public.link_game_to_world(pg_temp.game(3),pg_temp.w(),
  jsonb_build_array(pg_temp.change('starforged/name','starsmith/name')||jsonb_build_object('worldId',pg_temp.w()))),
  '{"appliedOracleChanges": 1}'::jsonb,'linking applies its choices');
reset role;
select is((select world_id from public.games where id=pg_temp.game(3)),pg_temp.w(),'the game is linked');
select is(pg_temp.changes(),'field: starforged/name -> starsmith/name by Newcomer, 0: starforged/cave -> starsmith/cave',
  'the change names the game that chose it');
set local role authenticated;
select pg_temp.as_user(6);
select is(pg_temp.outcome($$select public.link_game_to_world(pg_temp.game(3),pg_temp.w('other'),
  jsonb_build_array(pg_temp.change('starsmith/name','starforged/name')||jsonb_build_object('worldId',pg_temp.w('other'))))$$),
  'P0001 Must be an owner or editor of the world to link a game to it','linking still needs rights on the new world');
reset role;
insert into public.world_players(world_id,user_id,role) values (pg_temp.w('other'),pg_temp.u(6),'editor');
set local role authenticated;
select pg_temp.as_user(6);
select is(public.link_game_to_world(pg_temp.game(3),pg_temp.w('other'),
  jsonb_build_array(pg_temp.change('starsmith/name','starforged/name',null,true)||jsonb_build_object('worldId',pg_temp.w()))),
  '{"appliedOracleChanges": 1}'::jsonb,'moving to another world applies choices for the world it leaves');
reset role;
select is(pg_temp.rolls(),'starsmith/name (exact)','the world left behind keeps its old oracle');

-- Unlinking applies choices before the game leaves.
update public.games set world_id=pg_temp.w() where id=pg_temp.game(3);
update public.world_field_definitions set binding=pg_temp.binding('starsmith/name') where id=pg_temp.field();
delete from public.world_oracle_changes;
set local role authenticated;
select pg_temp.as_user(4);
select lives_ok($$select public.unlink_game_from_world(pg_temp.game(2),
  jsonb_build_array(pg_temp.change('starsmith/name','starforged/name')))$$,'a Guide unlinks with a choice');
reset role;
select is((select world_id from public.games where id=pg_temp.game(2)),null,'the game is unlinked');
select is(pg_temp.changes(),'field: starsmith/name -> starforged/name by Guided','and its choice is recorded');
update public.games set world_id=pg_temp.w() where id=pg_temp.game(2);

-- Dismissing the banner is per game and never moves backwards.
set local role authenticated;
select pg_temp.as_user(5);
select is(pg_temp.outcome($$select public.dismiss_world_oracle_changes(pg_temp.game(2),10)$$),
  '42501 Only world editors and Guides in the game can dismiss oracle changes','players cannot dismiss');
select pg_temp.as_user(6);
select is(pg_temp.outcome($$select public.dismiss_world_oracle_changes(pg_temp.game(2),10)$$),
  '42501 Only world editors and Guides in the game can dismiss oracle changes','world editors outside the game cannot dismiss for it');
select pg_temp.as_user(4);
select public.dismiss_world_oracle_changes(pg_temp.game(2),10);
select public.dismiss_world_oracle_changes(pg_temp.game(2),5);
select is((select dismissed_seq from public.world_oracle_change_dismissals where game_id=pg_temp.game(2)),10::bigint,
  'a dismissal keeps the furthest point');
select pg_temp.as_user(5);
select is((select count(*) from public.world_oracle_change_dismissals),1::bigint,'the game''s players read its dismissal');
select pg_temp.as_user(3);
select is((select count(*) from public.world_oracle_change_dismissals),0::bigint,'other games'' people do not');
reset role;

-- Deleting a field takes its changes with it.
delete from public.world_field_definitions where id=pg_temp.field();
select is(pg_temp.changes(),'','a deleted field leaves no changes');

select * from finish();
rollback;
