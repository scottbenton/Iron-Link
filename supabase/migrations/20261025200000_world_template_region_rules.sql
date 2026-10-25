-- Starforged location tidy-up. Only inherited worlds read world_templates;
-- customized worlds hold their own copies and are not touched here.
--
-- * Planetside and Non-Planetary Settlements had identical fields and
--   oracles, and each settlement's Location already rolls where it sits, so
--   they are one Settlement type. Inherited worlds' entries of either type
--   become Settlements.
-- * The settlement rules for "Orbital Settlement" are removed. It was never
--   one of the Location Type options, and its rules only repeated the others.
-- * Starforged's Region explains, as Sundered Isles' already does, that the
--   entries under a Sector roll from its Region.
begin;

-- Inherited field IDs are world-scoped UUIDv5 values (get_world_template).
update public.world_entry_field_values v set value = '"Settlement"'::jsonb
  from public.worlds w
  where v.world_id = w.id and not w.configuration_customized
    and w.setting_key = 'world:starforged/forge'
    and v.field_definition_id = extensions.uuid_generate_v5(w.id,'field:locations:locationType')
    and v.value in ('"Planetside Settlement"'::jsonb, '"Non-Planetary Settlement"'::jsonb);

update public.world_templates t set configuration = jsonb_set(t.configuration,'{categories}',(
  select jsonb_agg(case when c.value->>'key' = 'locations' then jsonb_set(c.value,'{fields}',(
      select jsonb_agg(case
        when f.value->>'key' = 'region' then jsonb_set(f.value,'{configuration,helpText}',
          '"Terminus, Outlands, Expanse or Void. Descendants use their nearest Sector''s Region."'::jsonb)
        when f.value->>'key' = 'locationType' then jsonb_set(f.value,'{configuration,suggestions}',
          '["Sector","Planet","Settlement","Star","Derelict","Vault"]'::jsonb)
        else jsonb_set(f.value,'{configuration,rules}',coalesce((
          -- Planetside rules become the Settlement rules; the duplicates go.
          select jsonb_agg(jsonb_set(r.value,'{conditions}',(
              select jsonb_agg(case when k.value->>'source' = 'entry'
                  and k.value->>'value' = 'Planetside Settlement'
                then jsonb_set(k.value,'{value}','"Settlement"'::jsonb) else k.value end
                order by k.position)
              from jsonb_array_elements(r.value->'conditions') with ordinality k(value,position)))
            order by r.position)
          from jsonb_array_elements(f.value->'configuration'->'rules') with ordinality r(value,position)
          where not exists (select 1 from jsonb_array_elements(r.value->'conditions') k
            where k->>'source' = 'entry'
              and k->>'value' in ('Orbital Settlement','Non-Planetary Settlement'))),'[]'::jsonb))
        end order by f.position)
      from jsonb_array_elements(c.value->'fields') with ordinality f(value,position)))
    else c.value end order by c.position)
  from jsonb_array_elements(t.configuration->'categories') with ordinality c(value,position)))
where t.setting_key = 'world:starforged/forge';

do $$
begin
  if exists (select 1 from public.world_templates t,
      jsonb_array_elements(t.configuration->'categories') c,
      jsonb_array_elements(c->'fields') d,
      jsonb_array_elements(d->'configuration'->'rules') r,
      jsonb_array_elements(r->'conditions') k
    where k->>'value' in ('Orbital Settlement','Planetside Settlement','Non-Planetary Settlement'))
    or not exists (select 1 from public.world_templates t,
      jsonb_array_elements(t.configuration->'categories') c,
      jsonb_array_elements(c->'fields') d
    where t.setting_key = 'world:starforged/forge' and c->>'key' = 'locations'
      and d->>'key' = 'region' and d->'configuration'->>'helpText' <> '') then
    raise exception 'Starforged location tidy-up did not apply';
  end if;
end $$;
commit;
