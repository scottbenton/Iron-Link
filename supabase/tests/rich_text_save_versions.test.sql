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

select * from finish();
rollback;
