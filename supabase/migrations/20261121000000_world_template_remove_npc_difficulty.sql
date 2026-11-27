-- Starforged NPCs lose their Difficulty field. By the rules a connection's
-- rank is chosen when a character makes the connection and belongs to that
-- relationship, so it lives only on world_entry_connections.rank; the NPC
-- itself carries none.
--
-- Only inherited worlds read world_templates; customized worlds hold their
-- own copy of the field and are not touched here. Removing a field from a
-- template deletes its values in inherited worlds, as deleting a field in the
-- editor does.
begin;

do $$
begin
  if not exists (select 1 from public.world_templates t,
      jsonb_array_elements(t.configuration->'categories') c,
      jsonb_array_elements(c->'fields') d
    where t.setting_key = 'world:starforged/forge' and c->>'key' = 'npcs' and d->>'key' = 'difficulty') then
    raise exception 'Starforged NPC Difficulty field is missing';
  end if;
end $$;

-- Inherited field IDs are world-scoped UUIDv5 values (get_world_template).
delete from public.world_entry_field_values v
  using public.worlds w
  where v.world_id = w.id and not w.configuration_customized
    and w.setting_key = 'world:starforged/forge'
    and v.field_definition_id = extensions.uuid_generate_v5(w.id,'field:npcs:difficulty');

update public.world_templates t set configuration = jsonb_set(t.configuration,'{categories}',(
  select jsonb_agg(case when c.value->>'key' = 'npcs' then jsonb_set(c.value,'{fields}',coalesce((
      select jsonb_agg(jsonb_set(f.value,'{sort_order}',to_jsonb(f.rank - 1)) order by f.rank)
      from (
        select d.value, row_number() over (order by (d.value->>'sort_order')::int, d.position) as rank
        from jsonb_array_elements(c.value->'fields') with ordinality d(value,position)
        where d.value->>'key' <> 'difficulty'
      ) f
    ),'[]'::jsonb))
    else c.value end order by c.position)
  from jsonb_array_elements(t.configuration->'categories') with ordinality c(value,position)))
where t.setting_key = 'world:starforged/forge';

-- Nothing may still point at the removed field.
do $$
begin
  if exists (select 1 from public.world_templates t,
      jsonb_array_elements(t.configuration->'categories') c
    where t.setting_key = 'world:starforged/forge' and (
      (c->'subtitle_field_definition_id' <> 'null'::jsonb and not exists (
        select 1 from jsonb_array_elements(c->'fields') d where d->>'id' = c->>'subtitle_field_definition_id'))
      or exists (select 1 from jsonb_array_elements(c->'fields') d,
          jsonb_array_elements(d->'configuration'->'rules') r,
          jsonb_array_elements(r->'conditions') k
        where not exists (select 1 from jsonb_array_elements(c->'fields') x where x->>'id' = k->>'fieldId')))) then
    raise exception 'Removing NPC Difficulty left a dangling reference';
  end if;
end $$;
commit;
