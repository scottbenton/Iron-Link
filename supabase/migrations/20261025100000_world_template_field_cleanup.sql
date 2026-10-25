-- Shared template cleanup. Only inherited worlds read world_templates;
-- customized worlds hold their own copies and are not touched here.
--
-- * No template field is full width any more; every field takes the normal
--   width.
-- * Fields a world would roll once per relationship or curse, rather than once
--   per faction, are removed: faction Relationships (the oracle asks for
--   another faction first) in Starforged and Sundered Isles, and Sundered
--   Isles' Cursed and Cursed Aspects. Removing a field from a template deletes
--   its values in inherited worlds, as deleting a field in the editor does.
-- * NPCs lead with Pronouns; Starforged NPCs then take Callsign, Difficulty and
--   Location.
begin;

create temporary table removed_template_fields(setting_key text,category_key text,field_key text) on commit drop;
insert into removed_template_fields values
  ('world:starforged/forge','factions','relationships'),
  ('world:sundered_isles/sundered_isles','factions','relationships'),
  ('world:sundered_isles/sundered_isles','factions','cursed'),
  ('world:sundered_isles/sundered_isles','factions','cursedAspects');

-- Listed fields lead their category in this order; the rest follow in their
-- existing order.
create temporary table leading_template_fields(setting_key text,category_key text,field_key text,position int) on commit drop;
insert into leading_template_fields values
  ('world:starforged/forge','npcs','pronouns',0),
  ('world:starforged/forge','npcs','callsign',1),
  ('world:starforged/forge','npcs','difficulty',2),
  ('world:starforged/forge','npcs','location',3),
  ('world:sundered_isles/sundered_isles','npcs','pronouns',0),
  ('world:elegy/santa_maria','npcs','pronouns',0),
  ('blank','npcs','pronouns',0);

do $$
begin
  if exists (select 1 from (select setting_key, category_key, field_key from removed_template_fields
      union all select setting_key, category_key, field_key from leading_template_fields) f
    where not exists (
      select 1 from public.world_templates t,
        jsonb_array_elements(t.configuration->'categories') c,
        jsonb_array_elements(c->'fields') d
      where t.setting_key = f.setting_key and c->>'key' = f.category_key and d->>'key' = f.field_key)) then
    raise exception 'A template field named by this migration is missing';
  end if;
end $$;

-- Inherited field IDs are world-scoped UUIDv5 values (get_world_template).
delete from public.world_entry_field_values v
  using public.worlds w, removed_template_fields r
  where v.world_id = w.id and not w.configuration_customized and w.setting_key = r.setting_key
    and v.field_definition_id = extensions.uuid_generate_v5(w.id,'field:' || r.category_key || ':' || r.field_key);

update public.world_templates t set configuration = jsonb_set(t.configuration,'{categories}',coalesce((
  select jsonb_agg(jsonb_set(c.value,'{fields}',coalesce((
    select jsonb_agg(jsonb_set(o.field,'{sort_order}',to_jsonb(o.rank - 1)) order by o.rank)
    from (
      select f.value #- '{configuration,fullWidth}' as field,
        row_number() over (order by coalesce(l.position, 2147483647),
          (f.value->>'sort_order')::int, f.position) as rank
      from jsonb_array_elements(c.value->'fields') with ordinality f(value,position)
      left join leading_template_fields l on l.setting_key = t.setting_key
        and l.category_key = c.value->>'key' and l.field_key = f.value->>'key'
      where not exists (select 1 from removed_template_fields r
        where r.setting_key = t.setting_key and r.category_key = c.value->>'key'
          and r.field_key = f.value->>'key')
    ) o
  ),'[]'::jsonb)) order by c.position)
  from jsonb_array_elements(t.configuration->'categories') with ordinality c(value,position)
),'[]'::jsonb));

-- The faction type's help text pointed at the removed Cursed field.
update public.world_templates t set configuration = jsonb_set(t.configuration,'{categories}',(
  select jsonb_agg(case when c.value->>'key' = 'factions' then jsonb_set(c.value,'{fields}',(
      select jsonb_agg(case when f.value->>'key' = 'factionType'
        then jsonb_set(f.value,'{configuration,helpText}','"On a cursed result, choose The Cursed."'::jsonb)
        else f.value end order by f.position)
      from jsonb_array_elements(c.value->'fields') with ordinality f(value,position)))
    else c.value end order by c.position)
  from jsonb_array_elements(t.configuration->'categories') with ordinality c(value,position)))
where t.setting_key = 'world:sundered_isles/sundered_isles';

-- Nothing may still point at a removed field: subtitles and rule conditions
-- must name a field of their own category.
do $$
begin
  if exists (select 1 from public.world_templates t,
      jsonb_array_elements(t.configuration->'categories') c
    where c->'subtitle_field_definition_id' <> 'null'::jsonb and not exists (
      select 1 from jsonb_array_elements(c->'fields') d where d->>'id' = c->>'subtitle_field_definition_id'))
    or exists (select 1 from public.world_templates t,
      jsonb_array_elements(t.configuration->'categories') c,
      jsonb_array_elements(c->'fields') d,
      jsonb_array_elements(d->'configuration'->'rules') r,
      jsonb_array_elements(r->'conditions') k
    where not exists (select 1 from jsonb_array_elements(c->'fields') x where x->>'id' = k->>'fieldId'))
    or exists (select 1 from public.world_templates t,
      jsonb_array_elements(t.configuration->'categories') c,
      jsonb_array_elements(c->'fields') d
    where d->'configuration' ? 'fullWidth') then
    raise exception 'Template cleanup left a dangling reference or a full width field';
  end if;
end $$;
commit;
