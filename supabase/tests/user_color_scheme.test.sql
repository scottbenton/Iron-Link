-- A person's Everywhere theme is theirs to set: they change their own users
-- row's color_scheme and nobody else's. Every fixture is rolled back.
begin;
create extension if not exists pgtap with schema extensions;
set search_path = public,extensions;
select plan(4);

-- 1 the person, 2 someone else. The auth trigger creates their users rows.
insert into auth.users(id)
  select ('c8000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid from generate_series(1,2) n;

select is(
  (select color_scheme from public.users
    where id='c8000000-0000-4000-8000-000000000001'),
  null,
  'a new person starts on Default'
);

set local role authenticated;
select set_config('request.jwt.claim.sub','c8000000-0000-4000-8000-000000000001',true);

update public.users set color_scheme='myriad'
  where id='c8000000-0000-4000-8000-000000000001';
update public.users set color_scheme='myriad'
  where id='c8000000-0000-4000-8000-000000000002';

reset role;

select is(
  (select color_scheme from public.users
    where id='c8000000-0000-4000-8000-000000000001'),
  'myriad',
  'a person sets their own theme'
);
select is(
  (select color_scheme from public.users
    where id='c8000000-0000-4000-8000-000000000002'),
  null,
  'a person cannot set someone else''s theme'
);

set local role authenticated;
select set_config('request.jwt.claim.sub','c8000000-0000-4000-8000-000000000001',true);
update public.users set color_scheme=null
  where id='c8000000-0000-4000-8000-000000000001';
reset role;

select is(
  (select color_scheme from public.users
    where id='c8000000-0000-4000-8000-000000000001'),
  null,
  'setting it back to null returns to Default'
);

select * from finish();
rollback;
