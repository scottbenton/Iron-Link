-- World entries: entry and value permissions per role, inherited configuration
-- staying inherited while content changes, linked entry cleanup on delete,
-- values with hidden links staying out of reach of blind writes, content
-- writes sharing the world lock, and whether a world is guided. Every fixture
-- is rolled back.
begin;
create extension if not exists pgtap with schema extensions;
create extension if not exists pgrowlocks with schema extensions;
set search_path = public,extensions;
select no_plan();

-- 1 owner, 2 guide, 3 and 4 players, 5 outsider, 6 solo member,
-- 7 and 8 co-op members (8 also plays a guided game), 9 viewer,
-- 10 a player in one world only.
insert into auth.users(id)
  select ('d1000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid from generate_series(1,10) n;
create temporary table entry_worlds(key text primary key,id uuid);
grant all on entry_worlds to authenticated;
create function pg_temp.u(p_n integer) returns uuid language sql as $$
  select ('d1000000-0000-4000-8000-'||lpad(p_n::text,12,'0'))::uuid $$;
create function pg_temp.as_user(p_n integer) returns void language sql as $$
  select set_config('request.jwt.claim.sub',pg_temp.u(p_n)::text,true) $$;
create function pg_temp.w(p_key text) returns uuid language sql as $$
  select id from entry_worlds where key=p_key $$;
create function pg_temp.c(p_key text,p_category text) returns uuid language sql as $$
  select extensions.uuid_generate_v5(pg_temp.w(p_key),'category:'||p_category) $$;
create function pg_temp.f(p_key text,p_category text,p_field text) returns uuid language sql as $$
  select extensions.uuid_generate_v5(pg_temp.w(p_key),'field:'||p_category||':'||p_field) $$;
create function pg_temp.e(p_n integer) returns uuid language sql as $$
  select ('d3000000-0000-4000-8000-'||lpad(p_n::text,12,'0'))::uuid $$;
-- The multiple linked field added to the customized world.
create function pg_temp.visited() returns uuid language sql as $$ select 'd2000000-0000-4000-8000-000000000001'::uuid $$;
create function pg_temp.link(p_n integer) returns jsonb language sql as $$
  select to_jsonb(pg_temp.e(p_n)::text) $$;
create function pg_temp.add(p_n integer,p_world text,p_category text,p_name text,
  p_read text default 'all_players',p_edit text default 'all_players') returns void language sql as $$
  insert into public.world_entries(id,world_id,category_id,name,author_id,read_permissions,edit_permissions)
    values (pg_temp.e(p_n),pg_temp.w(p_world),pg_temp.c(p_world,p_category),p_name,auth.uid(),
      p_read::public.note_read_permissions,p_edit::public.note_edit_permissions) $$;
-- The value trigger derives world_id from the entry, so any world fills the column.
create function pg_temp.put(p_entry integer,p_field uuid,p_value jsonb) returns void language sql as $$
  insert into public.world_entry_field_values(entry_id,field_definition_id,world_id,value)
    select pg_temp.e(p_entry),p_field,w.id,p_value from entry_worlds w limit 1
  on conflict (entry_id,field_definition_id) do update set value=excluded.value $$;
create function pg_temp.stored(p_entry integer,p_field uuid) returns jsonb language sql as $$
  select value from public.world_entry_field_values
    where entry_id=pg_temp.e(p_entry) and field_definition_id=p_field $$;
create function pg_temp.value_count(p_entry integer,p_field uuid default null) returns bigint language sql as $$
  select count(*) from public.world_entry_field_values
    where entry_id=pg_temp.e(p_entry) and (p_field is null or field_definition_id=p_field) $$;
create function pg_temp.entry_count(p_entry integer) returns bigint language sql as $$
  select count(*) from public.world_entries where id=pg_temp.e(p_entry) $$;
-- Reports the SQLSTATE, hint and message so each case pins the error.
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
-- Runs a write, reports how many rows it touched, then undoes it.
create function pg_temp.blind(p_sql text) returns text language plpgsql as $$
declare v_rows bigint; v_state text; v_message text;
begin
  execute p_sql;
  get diagnostics v_rows = row_count;
  raise exception using errcode = 'P0099', message = v_rows::text;
exception
  when sqlstate 'P0099' then return 'rows '||sqlerrm;
  when others then
    get stacked diagnostics v_state = returned_sqlstate, v_message = message_text;
    return v_state||' '||v_message;
end $$;
grant execute on function pg_temp.blind(text) to authenticated;
-- Row lock modes this transaction holds on a world; call without a role.
create function pg_temp.world_locks(p_key text) returns text[] language sql as $$
  select coalesce((select l.modes from extensions.pgrowlocks('public.worlds') l
    join public.worlds w on w.ctid = l.locked_row where w.id = pg_temp.w(p_key)),'{}'::text[]) $$;

select ok(not has_function_privilege('authenticated','public.world_entry_remove_links()','EXECUTE')
  and not has_function_privilege('anon','public.world_entry_remove_links()','EXECUTE'),
  'link cleanup is not exposed to clients');
select ok(has_function_privilege('authenticated','public.world_is_guided(uuid)','EXECUTE')
  and not has_function_privilege('anon','public.world_is_guided(uuid)','EXECUTE'),
  'only signed-in clients can ask whether a world is guided');
select is(to_regprocedure('public.world_has_restricted_members(uuid)'),null::regprocedure,
  'world_is_guided replaces the restricted members check');
select is(to_regprocedure('public.world_configuration_guard_referenced_entry_delete()'),null::regprocedure,
  'the guard that refused deleting linked entries is gone');

set local role authenticated;
select pg_temp.as_user(1);
insert into entry_worlds values
  ('main',public.create_world('Entries','world:classic/ironlands')),
  ('links',public.create_world('Links')),
  ('standalone',public.create_world('Standalone')),
  ('solo',public.create_world('Solo')),
  ('coop',public.create_world('Co-op')),
  ('guide only',public.create_world('Guide only')),
  ('guided',public.create_world('Guided')),
  ('viewer',public.create_world('Viewer')),
  ('mixed',public.create_world('Mixed')),
  ('hidden',public.create_world('Hidden','world:classic/ironlands'));
reset role;

insert into public.games(id,name,game_type,world_id) values
  ('d5000000-0000-4000-8000-000000000001','Main guided','guided',pg_temp.w('main')),
  ('d5000000-0000-4000-8000-000000000002','Main solo','solo',pg_temp.w('main')),
  ('d5000000-0000-4000-8000-000000000003','Links guided','guided',pg_temp.w('links')),
  ('d5000000-0000-4000-8000-000000000004','Solo','solo',pg_temp.w('solo')),
  ('d5000000-0000-4000-8000-000000000005','Co-op','co-op',pg_temp.w('coop')),
  ('d5000000-0000-4000-8000-000000000006','Guide only','guided',pg_temp.w('guide only')),
  ('d5000000-0000-4000-8000-000000000007','Guided','guided',pg_temp.w('guided')),
  ('d5000000-0000-4000-8000-000000000008','Mixed guided','guided',pg_temp.w('mixed')),
  ('d5000000-0000-4000-8000-000000000009','Mixed co-op','co-op',pg_temp.w('mixed')),
  ('d5000000-0000-4000-8000-000000000010','Hidden guided','guided',pg_temp.w('hidden'));
-- Solo and co-op games store no guide row; their members are still Guides.
insert into public.game_players(game_id,user_id,role)
  select ('d5000000-0000-4000-8000-'||lpad(g::text,12,'0'))::uuid,pg_temp.u(p),r::public.player_role
  from (values (1,2,'guide'),(1,3,'player'),(1,4,'player'),(2,6,'player'),
    (3,2,'guide'),(3,3,'player'),(3,4,'player'),(4,6,'player'),(5,7,'player'),(5,8,'player'),
    (6,2,'guide'),(7,2,'guide'),(7,3,'player'),(8,2,'guide'),(8,8,'player'),(9,8,'player'),(9,7,'player'),
    (10,2,'guide'),(10,10,'player')) v(g,p,r);
insert into public.world_players(world_id,user_id,role) values (pg_temp.w('viewer'),pg_temp.u(9),'viewer');

-- Guided: a guided game uses the world, or someone's best role is below Guide.
set local role authenticated;
select pg_temp.as_user(1);
select is(public.world_is_guided(pg_temp.w('standalone')),false,'a world with only its owner is not guided');
select is(public.world_is_guided(pg_temp.w('solo')),false,'a world used by a solo game is not guided');
select is(public.world_is_guided(pg_temp.w('coop')),false,'a world used by a co-op game is not guided');
select is(public.world_is_guided(pg_temp.w('guide only')),true,'a guided game makes a world guided before its players join');
select is(public.world_is_guided(pg_temp.w('guided')),true,'a guided game with a player makes a world guided');
select is(public.world_is_guided(pg_temp.w('viewer')),true,'an explicit viewer makes a world guided');
select is(public.world_is_guided(pg_temp.w('mixed')),true,
  'a world used by a guided game is guided even when every player is also a Guide');
select pg_temp.as_user(3);
select is(public.world_is_guided(pg_temp.w('guided')),true,'members other than the owner can ask');
select pg_temp.as_user(5);
select is(public.world_is_guided(pg_temp.w('guided')),false,'callers outside the world learn nothing');
select pg_temp.as_user(8);
select is(public.world_is_guided(pg_temp.w('viewer')),false,'members of other worlds learn nothing');

-- Permissions in an inherited Ironlands world.
select pg_temp.as_user(3);
select is(public.world_role(pg_temp.w('main'),auth.uid()),'player','guided game players are players');
select pg_temp.as_user(6);
select is(public.world_role(pg_temp.w('main'),auth.uid()),'guide','solo game members are Guides');
select pg_temp.as_user(1);
select pg_temp.add(1,'main','npcs','Shared');
select pg_temp.as_user(2);
select pg_temp.add(2,'main','npcs','Secret','only_guides','only_guides');
select pg_temp.as_user(3);
select pg_temp.add(3,'main','npcs','Mine','all_players','guides_and_author');
select pg_temp.add(4,'main','locations','Village');
select pg_temp.add(5,'main','lore','Legend');

select pg_temp.as_user(2);
select is(pg_temp.outcome($$select pg_temp.put(1,pg_temp.f('main','npcs','descriptor'),'"Grim"')$$),'ok',
  'a guide writes Guide-only values');
select pg_temp.as_user(3);
select is(pg_temp.value_count(1,pg_temp.f('main','npcs','descriptor')),0::bigint,'a player cannot read Guide-only values');
select is(split_part(pg_temp.outcome($$select pg_temp.put(1,pg_temp.f('main','npcs','descriptor'),'"Cheerful"')$$),' ',1),
  '42501','a player cannot write Guide-only values');
select pg_temp.as_user(6);
select is(pg_temp.stored(1,pg_temp.f('main','npcs','descriptor')),'"Grim"'::jsonb,'a solo game member reads Guide-only values');
select is(pg_temp.outcome($$select pg_temp.put(1,pg_temp.f('main','npcs','descriptor'),'"Weary"')$$),'ok',
  'a solo game member writes Guide-only values');
select pg_temp.as_user(2);
select is(pg_temp.stored(1,pg_temp.f('main','npcs','descriptor')),'"Weary"'::jsonb,'a guide reads another Guide''s value');

select is(pg_temp.outcome($$select pg_temp.put(2,pg_temp.f('main','npcs','pronouns'),'"they"')$$),'ok',
  'a guide writes values on a Guide-only entry');
select pg_temp.as_user(3);
select is(pg_temp.entry_count(2),0::bigint,'a player cannot read a Guide-only entry');
select is(pg_temp.value_count(2),0::bigint,'a player cannot read values of a Guide-only entry');
select is(split_part(pg_temp.outcome($$select pg_temp.put(2,pg_temp.f('main','npcs','pronouns'),'"she"')$$),' ',1),
  '42501','a player cannot write values on a Guide-only entry');
select pg_temp.as_user(6);
select is(pg_temp.entry_count(2)+pg_temp.value_count(2),2::bigint,'a solo game member reads Guide-only entries and values');

select pg_temp.as_user(4);
update public.world_entries set name='Taken' where id=pg_temp.e(3);
select is((select name from public.world_entries where id=pg_temp.e(3)),'Mine',
  'another player cannot edit an entry limited to guides and its author');
select is(split_part(pg_temp.outcome($$select pg_temp.put(3,pg_temp.f('main','npcs','pronouns'),'"he"')$$),' ',1),
  '42501','another player cannot write its values');
select pg_temp.as_user(3);
select is(pg_temp.outcome($$update public.world_entries set name='Mine, renamed' where id=pg_temp.e(3)$$),'ok',
  'the author edits their entry');
select is(pg_temp.outcome($$select pg_temp.put(3,pg_temp.f('main','npcs','pronouns'),'"she"')$$),'ok',
  'the author writes its values');
select pg_temp.as_user(2);
select is(pg_temp.outcome($$select pg_temp.put(3,pg_temp.f('main','npcs','species'),'"Elf"')$$),'ok',
  'a guide writes values on an entry limited to guides and its author');

select pg_temp.as_user(4);
update public.world_entries set name='Shared, edited' where id=pg_temp.e(1);
select is(pg_temp.outcome($$select pg_temp.put(1,pg_temp.f('main','npcs','pronouns'),'"he"')$$),'ok',
  'any player writes values on an entry all players can edit');
select pg_temp.as_user(3);
select is((select name from public.world_entries where id=pg_temp.e(1)),'Shared, edited',
  'another player reads the edited name');
select is(pg_temp.stored(1,pg_temp.f('main','npcs','pronouns')),'"he"'::jsonb,'another player reads the edited value');

-- Content changes never customize an inherited configuration.
select is(pg_temp.outcome($$select pg_temp.put(3,pg_temp.f('main','npcs','location'),pg_temp.link(4))$$),'ok',
  'a player links an entry in an inherited world');
select is(pg_temp.outcome($$select pg_temp.put(4,pg_temp.f('main','locations','locationType'),'"Hamlet"')$$),'ok',
  'a player picks a list value in an inherited world');
select is(pg_temp.outcome($$select pg_temp.put(5,pg_temp.f('main','lore','tags'),'["Old","Dark"]')$$),'ok',
  'a player sets several list values in an inherited world');
select is(pg_temp.outcome($$select pg_temp.put(5,pg_temp.f('main','lore','tags'),'["Old"]')$$),'ok',
  'a player removes a list value in an inherited world');
select is(pg_temp.outcome($$select pg_temp.put(3,pg_temp.f('main','npcs','pronouns'),'null')$$),'ok',
  'a player clears a text value in an inherited world');
select is(pg_temp.outcome($$delete from public.world_entry_field_values
  where entry_id=pg_temp.e(5) and field_definition_id=pg_temp.f('main','lore','tags')$$),'ok',
  'a player deletes a list value in an inherited world');
select is(pg_temp.outcome($$delete from public.world_entries where id=pg_temp.e(4)$$),'ok',
  'a player deletes a linked entry in an inherited world');
select is(pg_temp.value_count(3,pg_temp.f('main','npcs','location')),0::bigint,
  'the link to it is removed in an inherited world');
reset role;
select is((select configuration_customized from public.worlds where id=pg_temp.w('main')),false,
  'entry and value changes leave the configuration inherited');
select is((select count(*) from public.world_categories where world_id=pg_temp.w('main'))
  +(select count(*) from public.world_field_definitions where world_id=pg_temp.w('main')),0::bigint,
  'entry and value changes store no categories or fields');

-- Link cleanup in a customized world with a multiple linked field.
set local role authenticated;
select pg_temp.as_user(1);
select public.mutate_world_configuration(pg_temp.w('links'),jsonb_build_object('type','create_field',
  'category_id',pg_temp.c('links','npcs'),'field',jsonb_build_object('id','d2000000-0000-4000-8000-000000000001',
    'key','visited','label','Visited','type','select','sort_order',10,
    'configuration',jsonb_build_object('version',1,'suggestions','[]'::jsonb,'helpText','','visible',true,
      'rules','[]'::jsonb,'targetCategoryId',pg_temp.c('links','locations'),'multiple',true,'allowOther',false))));
set constraints world_field_definitions_configuration_reference_after immediate;

select pg_temp.as_user(3);
select pg_temp.add(11,'links','locations','Doomed');
select pg_temp.put(11,pg_temp.f('links','locations','tags'),'["Ruin"]');
select pg_temp.as_user(1);
select pg_temp.add(12,'links','locations','Keep');
select pg_temp.add(22,'links','npcs','Wanderer');
select pg_temp.put(22,pg_temp.visited(),jsonb_build_array(pg_temp.e(11)));
select pg_temp.put(22,pg_temp.f('links','npcs','tags'),jsonb_build_array(pg_temp.e(11),'Friend'));
select pg_temp.add(23,'links','npcs','Guard');
select pg_temp.put(23,pg_temp.f('links','npcs','location'),pg_temp.link(12));
select pg_temp.put(23,pg_temp.visited(),jsonb_build_array(pg_temp.e(12)));
select pg_temp.as_user(2);
select pg_temp.add(13,'links','locations','Hideout','only_guides','only_guides');
select pg_temp.add(21,'links','npcs','Spy','only_guides','only_guides');
select pg_temp.put(21,pg_temp.f('links','npcs','location'),pg_temp.link(11));
select pg_temp.put(21,pg_temp.visited(),jsonb_build_array(pg_temp.e(11),pg_temp.e(13)));

select pg_temp.as_user(3);
select is(pg_temp.entry_count(21)+pg_temp.value_count(21),0::bigint,'the player cannot see the Guide-only entry linking to theirs');
select is(pg_temp.outcome($$delete from public.world_entries where id=pg_temp.e(11)$$),'ok',
  'a player deletes their entry while an entry they cannot see links to it');
select is(pg_temp.outcome($$select pg_temp.put(23,pg_temp.visited(),jsonb_build_array(pg_temp.e(12),pg_temp.e(13)))$$),
  'P0001 - Selected entry is unavailable in the target category','adding a link the player cannot read is still refused');
reset role;
select is(pg_temp.value_count(21,pg_temp.f('links','npcs','location')),0::bigint,'a single link to the deleted entry is removed');
select is(pg_temp.stored(21,pg_temp.visited()),jsonb_build_array(pg_temp.e(13)),
  'a multiple link drops the deleted entry and keeps the rest, even ones the deleter cannot read');
select is(pg_temp.value_count(22,pg_temp.visited()),0::bigint,'a multiple link left empty is removed');
select is(pg_temp.stored(22,pg_temp.f('links','npcs','tags')),jsonb_build_array(pg_temp.e(11),'Friend'),
  'list values that happen to match the deleted id are untouched');
select is(pg_temp.stored(23,pg_temp.f('links','npcs','location'))||pg_temp.stored(23,pg_temp.visited()),
  jsonb_build_array(pg_temp.e(12),pg_temp.e(12)),'links to other entries are untouched');
select is(pg_temp.value_count(11),0::bigint,'the deleted entry''s own values are removed');
select is((select configuration_customized from public.worlds where id=pg_temp.w('links')),true,
  'the multiple linked field customized this world');

set local role authenticated;
select pg_temp.as_user(2);
select is(pg_temp.stored(21,pg_temp.visited()),jsonb_build_array(pg_temp.e(13)),'the guide reads the cleaned link');
select is(pg_temp.outcome($$select pg_temp.put(21,pg_temp.visited(),'[]')$$),'ok','the guide can empty the remaining link');

-- One statement deleting several targets and an entry linking to them.
select pg_temp.as_user(1);
select pg_temp.add(14,'links','locations','Ford');
select pg_temp.add(15,'links','locations','Mill');
select pg_temp.add(24,'links','npcs','Miller');
select pg_temp.add(25,'links','npcs','Ferryman');
select pg_temp.put(24,pg_temp.visited(),jsonb_build_array(pg_temp.e(14),pg_temp.e(15),pg_temp.e(12)));
select pg_temp.put(24,pg_temp.f('links','npcs','location'),pg_temp.link(15));
select pg_temp.put(25,pg_temp.visited(),jsonb_build_array(pg_temp.e(14),pg_temp.e(15)));
select is(pg_temp.outcome($$delete from public.world_entries where id in (pg_temp.e(14),pg_temp.e(15),pg_temp.e(25))$$),'ok',
  'one statement deletes several linked entries and an entry linking to them');
select is(pg_temp.stored(24,pg_temp.visited()),jsonb_build_array(pg_temp.e(12)),'every deleted entry leaves the multiple link');
select is(pg_temp.value_count(24,pg_temp.f('links','npcs','location')),0::bigint,'the single link to a deleted entry is removed');

select is(pg_temp.outcome($$delete from public.worlds where id=pg_temp.w('links')$$),'ok',
  'a world with linked entries can still be deleted');
reset role;
select is((select count(*) from public.world_entries where world_id=pg_temp.w('links'))
  +(select count(*) from public.world_entry_field_values where world_id=pg_temp.w('links')),0::bigint,
  'world deletion removes its entries and values');

-- A writer must be able to read a value before updating or deleting it. A
-- write that reads no columns skips read policies, so without that a player
-- could tell which hidden entry a value links by whether rewriting it fails.
set local role authenticated;
select pg_temp.as_user(2);
select pg_temp.add(31,'hidden','locations','Camp');
select pg_temp.add(32,'hidden','locations','Lair','only_guides','only_guides');
select pg_temp.add(33,'hidden','locations','Vault','only_guides','only_guides');
select pg_temp.add(34,'hidden','npcs','Sentry');
select pg_temp.add(35,'hidden','npcs','Scout');
select pg_temp.put(34,pg_temp.f('hidden','npcs','location'),pg_temp.link(32));
select pg_temp.put(34,pg_temp.f('hidden','npcs','pronouns'),'"they"');
select pg_temp.as_user(10);
select is(pg_temp.value_count(34),1::bigint,'the player reads only the value without a hidden link');
select is(pg_temp.blind(format('update public.world_entry_field_values set value=%L',pg_temp.link(32))),'rows 1',
  'an update reading no columns passes over a value linking the hidden entry it names');
select is(pg_temp.blind(format('update public.world_entry_field_values set value=%L',pg_temp.link(33))),'rows 1',
  'and over it alike when naming a hidden entry it does not link, so the outcome reveals nothing');
select is(pg_temp.blind('delete from public.world_entry_field_values'),'rows 1',
  'a delete reading no columns passes over a value linking a hidden entry');
select is(split_part(pg_temp.outcome($$select pg_temp.put(34,pg_temp.f('hidden','npcs','location'),pg_temp.link(31))$$),' ',1),
  '42501','an upsert onto a value linking a hidden entry is refused');
select is(pg_temp.outcome($$select pg_temp.put(35,pg_temp.f('hidden','npcs','location'),pg_temp.link(33))$$),
  'P0001 - Selected entry is unavailable in the target category','a player still cannot link a hidden entry');
select pg_temp.put(35,pg_temp.f('hidden','npcs','location'),pg_temp.link(31));
select is(pg_temp.outcome($$delete from public.world_entry_field_values
  where entry_id=pg_temp.e(34) and field_definition_id=pg_temp.f('hidden','npcs','location')$$)
  ||pg_temp.outcome($$delete from public.world_entry_field_values where entry_id=pg_temp.e(35)$$),'okok',
  'filtered deletes remove only the readable value');
reset role;
select is(pg_temp.stored(34,pg_temp.f('hidden','npcs','location')),pg_temp.link(32),
  'the value linking a hidden entry is untouched');
select is(pg_temp.value_count(35),0::bigint,'the readable value was deleted');

-- Content writes, cleanup and parent moves only share the world lock, so they
-- never wait for one another; configuration changes still lock it exclusively.
set local role authenticated;
select pg_temp.as_user(2);
select pg_temp.put(34,pg_temp.f('hidden','npcs','pronouns'),'"she"');
update public.world_entries set name='Watch post' where id=pg_temp.e(31);
update public.world_entries set parent_entry_id=pg_temp.e(32) where id=pg_temp.e(33);
select is(pg_temp.outcome($$update public.world_entries set parent_entry_id=pg_temp.e(33) where id=pg_temp.e(32)$$),
  '23514 invalid_parent An entry cannot be placed inside one of its descendants','moves still refuse cycles');
delete from public.world_entries where id=pg_temp.e(32);
reset role;
select is(pg_temp.value_count(34,pg_temp.f('hidden','npcs','location')),0::bigint,'deleting the entry removed the link');
select ok(cardinality(pg_temp.world_locks('hidden'))>0
  and pg_temp.world_locks('hidden') <@ array['For Key Share','For Share'],
  'content writes, link cleanup and parent moves share the world lock');
set local role authenticated;
select pg_temp.as_user(1);
select public.mutate_world_configuration(pg_temp.w('hidden'),jsonb_build_object('type','create_field',
  'category_id',pg_temp.c('hidden','npcs'),'field',jsonb_build_object('id','d2000000-0000-4000-8000-000000000002',
    'key','haunts','label','Haunts','type','select','sort_order',10,
    'configuration',jsonb_build_object('version',1,'suggestions','[]'::jsonb,'helpText','','visible',true,
      'rules','[]'::jsonb,'targetCategoryId',pg_temp.c('hidden','locations'),'multiple',true,'allowOther',false))));
reset role;
select ok('For Update' = any(pg_temp.world_locks('hidden')),'configuration changes lock the world exclusively');

select * from finish();
rollback;
