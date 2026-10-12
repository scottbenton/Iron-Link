-- Parent links: same world and category, no self or descendant parents, only
-- in nesting categories, and nesting cannot be turned off under nested entries.
-- Every fixture is rolled back.
begin;
create extension if not exists pgtap with schema extensions;
set search_path = public,extensions;
select no_plan();

insert into auth.users(id) values ('a7100000-0000-4000-8000-000000000001');
create temporary table parent_worlds(key text primary key,id uuid);
grant all on parent_worlds to authenticated;
create function pg_temp.world_id(p_key text) returns uuid language sql as $$
  select id from parent_worlds where key=p_key $$;
create function pg_temp.category_id(p_key text,p_category text) returns uuid language sql as $$
  select extensions.uuid_generate_v5(pg_temp.world_id(p_key),'category:'||p_category) $$;
create function pg_temp.entry(p_n integer) returns uuid language sql as $$
  select ('a7500000-0000-4000-8000-'||lpad(p_n::text,12,'0'))::uuid $$;
create function pg_temp.set_parent(p_child integer,p_parent integer) returns void language sql as $$
  update public.world_entries set parent_entry_id=pg_temp.entry(p_parent) where id=pg_temp.entry(p_child) $$;
-- Reports the SQLSTATE, hint and message so each case pins the error the app maps.
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

select ok(not has_function_privilege('authenticated','public.world_entry_check_parent()','EXECUTE')
  and not has_function_privilege('authenticated','public.world_category_check_hierarchy()','EXECUTE'),
  'parent guards are not exposed to clients');

set local role authenticated;
select set_config('request.jwt.claim.sub','a7100000-0000-4000-8000-000000000001',true);
insert into parent_worlds values ('main',public.create_world('Parents')),('other',public.create_world('Elsewhere'));

-- Blank worlds inherit Locations (nesting) and NPCs (no nesting).
insert into public.world_entries(id,world_id,category_id,name,author_id,read_permissions)
  select pg_temp.entry(n),pg_temp.world_id(w),pg_temp.category_id(w,c),name,auth.uid(),'all_players'
  from (values (1,'main','locations','Region'),(2,'main','locations','Area'),(3,'main','locations','Site'),
    (4,'main','locations','Loose'),(5,'main','npcs','Captain'),(6,'main','npcs','Crew'),
    (7,'other','locations','Faraway')) v(n,w,c,name);

select is(pg_temp.outcome(format($$insert into public.world_entries(id,world_id,category_id,name,author_id,parent_entry_id)
  values (%L,%L,%L,'Nested on create',auth.uid(),%L)$$,pg_temp.entry(8),pg_temp.world_id('main'),
  pg_temp.category_id('main','locations'),pg_temp.entry(1))),'ok','an entry can be created inside a parent');
select is(pg_temp.outcome('select pg_temp.set_parent(2,1)'),'ok','an entry can move inside another');
select is(pg_temp.outcome('select pg_temp.set_parent(3,2)'),'ok','nesting can go several levels deep');
select is(pg_temp.outcome('select pg_temp.set_parent(3,1)'),'ok','an entry can move to a different parent');
select is(pg_temp.outcome('select pg_temp.set_parent(3,2)'),'ok','an entry can move back below a sibling');
select is((select parent_entry_id from public.world_entries where id=pg_temp.entry(3)),pg_temp.entry(2),
  'the latest move is stored');
select is(pg_temp.outcome($$update public.world_entries set name='Renamed region' where id=pg_temp.entry(1)$$),'ok',
  'edits that leave the parent alone are unaffected');

select is(pg_temp.outcome('select pg_temp.set_parent(1,1)'),
  '23514 invalid_parent An entry cannot be its own parent','an entry cannot be its own parent');
select is(pg_temp.outcome('select pg_temp.set_parent(1,2)'),
  '23514 invalid_parent An entry cannot be placed inside one of its descendants',
  'an entry cannot move inside its child');
select is(pg_temp.outcome('select pg_temp.set_parent(1,3)'),
  '23514 invalid_parent An entry cannot be placed inside one of its descendants',
  'an entry cannot move inside a deeper descendant');
select is(pg_temp.outcome('select pg_temp.set_parent(4,5)'),
  '23514 invalid_parent Parent entry must be in the same world and category',
  'a parent must be in the same category');
select is(pg_temp.outcome('select pg_temp.set_parent(4,7)'),
  '23514 invalid_parent Parent entry must be in the same world and category',
  'a parent must be in the same world');
select is(pg_temp.outcome(format($$insert into public.world_entries(world_id,category_id,name,author_id,parent_entry_id)
  values (%L,%L,'Misplaced',auth.uid(),%L)$$,pg_temp.world_id('main'),pg_temp.category_id('main','locations'),
  pg_temp.entry(5))),'23514 invalid_parent Parent entry must be in the same world and category',
  'a new entry is checked like a move');
select is(pg_temp.outcome('select pg_temp.set_parent(6,5)'),
  '23514 invalid_parent This category does not support nested entries',
  'entries cannot nest in a category without nesting');
select is((select count(*) from public.world_entries where id=pg_temp.entry(1) and parent_entry_id is null),1::bigint,
  'rejected moves leave the entry where it was');

select is((public.get_world_category_counts(pg_temp.world_id('main'),pg_temp.category_id('main','locations'))->>'nestedEntryCount')::integer,
  3,'category counts report nested entries');
select is((public.get_world_category_counts(pg_temp.world_id('main'),pg_temp.category_id('main','npcs'))->>'nestedEntryCount')::integer,
  0,'categories without nested entries report none');

-- Nesting toggles through configuration mutations, which customize the world.
select public.mutate_world_configuration(pg_temp.world_id('main'),jsonb_build_object('type','update_category',
  'id',pg_temp.category_id('main','locations'),'changes',jsonb_build_object('name','Places')));
select is(pg_temp.outcome(format($$select public.mutate_world_configuration(%L,jsonb_build_object('type','update_category',
  'id',%L::uuid,'changes',jsonb_build_object('supports_hierarchy',false)))$$,
  pg_temp.world_id('main'),pg_temp.category_id('main','locations'))),
  '23514 nested_entries_exist Move nested entries to the top level before turning off nesting',
  'nesting cannot be turned off while entries are nested');
select is(pg_temp.outcome('select pg_temp.set_parent(4,1)'),'ok','customized nesting categories still accept parents');

-- Deleting a parent moves its children to the top level.
delete from public.world_entries where id=pg_temp.entry(2);
select is((select parent_entry_id from public.world_entries where id=pg_temp.entry(3)),null::uuid,
  'deleting a parent moves its children to the top level');

update public.world_entries set parent_entry_id=null where world_id=pg_temp.world_id('main');
select is(pg_temp.outcome(format($$select public.mutate_world_configuration(%L,jsonb_build_object('type','update_category',
  'id',%L::uuid,'changes',jsonb_build_object('supports_hierarchy',false)))$$,
  pg_temp.world_id('main'),pg_temp.category_id('main','locations'))),'ok',
  'nesting can be turned off once no entries are nested');
select is(pg_temp.outcome('select pg_temp.set_parent(3,1)'),
  '23514 invalid_parent This category does not support nested entries',
  'customized categories without nesting reject parents');
select is(pg_temp.outcome(format($$select public.mutate_world_configuration(%L,jsonb_build_object('type','update_category',
  'id',%L::uuid,'changes',jsonb_build_object('supports_hierarchy',true)))$$,
  pg_temp.world_id('main'),pg_temp.category_id('main','locations'))),'ok','nesting can always be turned on');
select is(pg_temp.outcome('select pg_temp.set_parent(3,1)'),'ok','turning nesting back on allows parents again');
reset role;

-- Direct category writes are guarded too.
select is(pg_temp.outcome(format($$update public.world_categories set supports_hierarchy=false where id=%L$$,
  pg_temp.category_id('main','locations'))),
  '23514 nested_entries_exist Move nested entries to the top level before turning off nesting',
  'direct category updates cannot turn off nesting under nested entries');

-- Constraints back up the trigger, and the ancestor walk survives existing loops.
alter table public.world_entries disable trigger world_entries_check_parent;
select is(split_part(pg_temp.outcome('select pg_temp.set_parent(4,4)'),' ',1),'23514',
  'the self-parent check constraint rejects without the trigger');
select is(split_part(pg_temp.outcome('select pg_temp.set_parent(4,7)'),' ',1),'23503',
  'the composite foreign key rejects cross-world parents without the trigger');
select is(split_part(pg_temp.outcome('select pg_temp.set_parent(4,5)'),' ',1),'23503',
  'the composite foreign key rejects cross-category parents without the trigger');
select pg_temp.set_parent(1,3);
alter table public.world_entries enable trigger world_entries_check_parent;
select is(pg_temp.outcome('select pg_temp.set_parent(4,1)'),'ok',
  'checking a parent inside an existing loop terminates');
select is(pg_temp.outcome('select pg_temp.set_parent(1,4)'),
  '23514 invalid_parent An entry cannot be placed inside one of its descendants',
  'a loop through existing bad data is still detected');

select is(pg_temp.outcome(format('delete from public.worlds where id=%L',pg_temp.world_id('main'))),'ok',
  'worlds with nested entries can still be deleted');
select is((select count(*) from public.world_entries where world_id=pg_temp.world_id('main')),0::bigint,
  'world deletion removes nested entries');

select * from finish();
rollback;
