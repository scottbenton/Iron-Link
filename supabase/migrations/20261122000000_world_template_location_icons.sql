-- Locations icons from the world defaults review (#403, #384). A globe read as
-- space in settings whose places are towns and ruins: Blank and Santa Maria
-- use the Material map, Ironlands a waymarker. Forge and Sundered Isles keep
-- theirs.
--
-- The Forge Location field shown for both Planets and Stars was keyed
-- starDescription; it is now description. Inherited field IDs are
-- world-scoped UUIDv5 values of the key (get_world_template), so inherited
-- worlds' values move to the new ID. Rules and subtitles refer to the
-- template's own field id, which does not change.
--
-- Only inherited worlds read world_templates; customized worlds hold their
-- own copies and are not touched here.
begin;

do $$
begin
  if not exists (select 1 from public.world_templates t,
      jsonb_array_elements(t.configuration->'categories') c,
      jsonb_array_elements(c->'fields') d
    where t.setting_key = 'world:starforged/forge' and c->>'key' = 'locations' and d->>'key' = 'starDescription') then
    raise exception 'Forge Locations starDescription field is missing';
  end if;
  if exists (select 1 from public.world_templates t,
      jsonb_array_elements(t.configuration->'categories') c,
      jsonb_array_elements(c->'fields') d
    where t.setting_key = 'world:starforged/forge' and c->>'key' = 'locations' and d->>'key' = 'description') then
    raise exception 'Forge Locations already has a description field';
  end if;
  if (select count(*) from public.world_templates t,
      jsonb_array_elements(t.configuration->'categories') c
    where t.setting_key in ('blank','world:elegy/santa_maria','world:classic/ironlands')
      and c->>'key' = 'locations') <> 3 then
    raise exception 'A Locations category named by this migration is missing';
  end if;
end $$;

update public.world_templates t set configuration = jsonb_set(t.configuration,'{categories}',(
  select jsonb_agg(case when c.value->>'key' = 'locations' then jsonb_set(c.value,'{icon}',
      case t.setting_key when 'world:classic/ironlands'
        then '{"key":"GiDirectionSigns","color":"green"}'::jsonb
        else '{"key":"mui:Map","color":"green"}'::jsonb end)
    else c.value end order by c.position)
  from jsonb_array_elements(t.configuration->'categories') with ordinality c(value,position)))
where t.setting_key in ('blank','world:elegy/santa_maria','world:classic/ironlands');

-- Values move to the new ID first, as one key change: the template update
-- re-checks every inherited value against the renamed field. The value
-- trigger would refuse the new ID before the rename, and has nothing else to
-- derive for a text value, so it stands aside for this statement only.
alter table public.world_entry_field_values disable trigger world_entry_field_values_derive_parents;
update public.world_entry_field_values v
  set field_definition_id = extensions.uuid_generate_v5(w.id,'field:locations:description')
  from public.worlds w
  where v.world_id = w.id and not w.configuration_customized
    and w.setting_key = 'world:starforged/forge'
    and v.field_definition_id = extensions.uuid_generate_v5(w.id,'field:locations:starDescription');
alter table public.world_entry_field_values enable trigger world_entry_field_values_derive_parents;

update public.world_templates t set configuration = jsonb_set(t.configuration,'{categories}',(
  select jsonb_agg(case when c.value->>'key' = 'locations' then jsonb_set(c.value,'{fields}',(
      select jsonb_agg(case when f.value->>'key' = 'starDescription'
        then jsonb_set(f.value,'{key}','"description"'::jsonb) else f.value end order by f.position)
      from jsonb_array_elements(c.value->'fields') with ordinality f(value,position)))
    else c.value end order by c.position)
  from jsonb_array_elements(t.configuration->'categories') with ordinality c(value,position)))
where t.setting_key = 'world:starforged/forge';

commit;
