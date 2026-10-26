-- World Notes replace worlds.description (#255).
--
-- A world's Notes are a collaborative rich text document stored as Yjs bytes
-- on the world, like an entry's Notes on world_entries.notes_content. The old
-- plain text description becomes the first paragraph of the Notes, then the
-- column is dropped. Owners, editors and Guides edit the Notes; the worlds
-- update policy stays owner/editor only, so Guides write them through
-- update_world_notes() and cannot rename the world or change its setting.
begin;

alter table public.worlds add column notes_content bytea;

-- Yjs v1 update encoding, enough to write one Tiptap paragraph: the editor's
-- root fragment is "default", a paragraph is an XmlElement holding an XmlText,
-- and the text is a string item. Only used by this migration.
create function pg_temp.yjs_var_uint(p_value bigint) returns bytea
language plpgsql immutable as $$
declare
  result bytea := ''::bytea;
  remaining bigint := p_value;
begin
  while remaining > 127 loop
    result := result || set_byte('\x00'::bytea, 0, ((remaining & 127) | 128)::int);
    remaining := remaining >> 7;
  end loop;
  return result || set_byte('\x00'::bytea, 0, remaining::int);
end $$;

create function pg_temp.yjs_var_string(p_value text) returns bytea
language sql immutable as $$
  select pg_temp.yjs_var_uint(octet_length(convert_to(p_value, 'UTF8')))
    || convert_to(p_value, 'UTF8')
$$;

create function pg_temp.yjs_paragraph_document(p_text text) returns bytea
language sql immutable as $$
  with ids(client) as (select 1::bigint)
  select
    -- One client, writing three structs from clock 0.
    pg_temp.yjs_var_uint(1) || pg_temp.yjs_var_uint(3)
    || pg_temp.yjs_var_uint(client) || pg_temp.yjs_var_uint(0)
    -- Clock 0: a paragraph XmlElement in the root type "default".
    || '\x07'::bytea || pg_temp.yjs_var_uint(1) || pg_temp.yjs_var_string('default')
    || pg_temp.yjs_var_uint(3) || pg_temp.yjs_var_string('paragraph')
    -- Clock 1: an XmlText inside the paragraph.
    || '\x07'::bytea || pg_temp.yjs_var_uint(0)
    || pg_temp.yjs_var_uint(client) || pg_temp.yjs_var_uint(0)
    || pg_temp.yjs_var_uint(6)
    -- Clock 2: the text, inside the XmlText.
    || '\x04'::bytea || pg_temp.yjs_var_uint(0)
    || pg_temp.yjs_var_uint(client) || pg_temp.yjs_var_uint(1)
    || pg_temp.yjs_var_string(p_text)
    -- An empty delete set.
    || pg_temp.yjs_var_uint(0)
  from ids
$$;

update public.worlds
  set notes_content = pg_temp.yjs_paragraph_document(btrim(description))
  where btrim(coalesce(description, '')) <> '';

alter table public.worlds drop column description;

-- create_world() no longer takes a description.
drop function public.create_world(text, text, text);

create function public.create_world(
    p_name text,
    p_setting_key text default null
)
 returns uuid
 language plpgsql
 security definer
 set search_path to ''
as $function$
declare
    v_uid uuid := auth.uid();
    v_world_id uuid;
begin
    if v_uid is null then
        raise exception 'Must be authenticated to create a world';
    end if;

    insert into public.worlds (name, setting_key, created_by)
    values (p_name, p_setting_key, v_uid)
    returning id into v_world_id;

    insert into public.world_players (world_id, user_id, role)
    values (v_world_id, v_uid, 'owner');

    return v_world_id;
end;
$function$;

revoke execute on function public.create_world(text, text) from public;
revoke execute on function public.create_world(text, text) from anon;
grant execute on function public.create_world(text, text) to authenticated;
grant execute on function public.create_world(text, text) to service_role;

-- Owners, editors and Guides save a world's Notes. Players and viewers read
-- them through the worlds select policy.
create function public.update_world_notes(p_world_id uuid, p_notes_content bytea)
 returns void
 language plpgsql
 security definer
 set search_path to ''
as $function$
begin
    if auth.uid() is null
       or public.world_role(p_world_id, auth.uid()) not in ('owner', 'editor', 'guide') then
        raise exception 'Only world editors and Guides can edit world notes'
          using errcode = '42501';
    end if;

    update public.worlds set notes_content = p_notes_content where id = p_world_id;
end;
$function$;

revoke execute on function public.update_world_notes(uuid, bytea) from public;
revoke execute on function public.update_world_notes(uuid, bytea) from anon;
grant execute on function public.update_world_notes(uuid, bytea) to authenticated;
grant execute on function public.update_world_notes(uuid, bytea) to service_role;

commit;
