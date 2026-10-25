-- Starforged location tidy-up. Only inherited worlds read world_templates;
-- customized worlds hold their own copies and are not touched here.
--
-- * Starforged's Region explains, as Sundered Isles' already does, that the
--   entries under a Sector roll from its Region.
-- * The settlement rules for "Orbital Settlement" are removed. It is not one
--   of the Location Type options, and its rules only repeated those of
--   Non-Planetary Settlement.
begin;

update public.world_templates t set configuration = jsonb_set(t.configuration,'{categories}',(
  select jsonb_agg(case when c.value->>'key' = 'locations' then jsonb_set(c.value,'{fields}',(
      select jsonb_agg(case
        when f.value->>'key' = 'region' then jsonb_set(f.value,'{configuration,helpText}',
          '"Terminus, Outlands, Expanse or Void. Descendants use their nearest Sector''s Region."'::jsonb)
        else jsonb_set(f.value,'{configuration,rules}',coalesce((
          select jsonb_agg(r.value order by r.position)
          from jsonb_array_elements(f.value->'configuration'->'rules') with ordinality r(value,position)
          where not exists (select 1 from jsonb_array_elements(r.value->'conditions') k
            where k->>'source' = 'entry' and k->>'value' = 'Orbital Settlement')),'[]'::jsonb))
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
    where k->>'value' = 'Orbital Settlement')
    or not exists (select 1 from public.world_templates t,
      jsonb_array_elements(t.configuration->'categories') c,
      jsonb_array_elements(c->'fields') d
    where t.setting_key = 'world:starforged/forge' and c->>'key' = 'locations'
      and d->>'key' = 'region' and d->'configuration'->>'helpText' <> '') then
    raise exception 'Starforged location tidy-up did not apply';
  end if;
end $$;
commit;
