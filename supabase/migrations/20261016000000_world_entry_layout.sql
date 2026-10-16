-- Entry pages lay fields out by width. A Text field takes a whole row when its
-- configuration sets fullWidth, which only Text fields may do. The shared
-- templates turn it on for Text fields whose oracles have long results: any
-- result longer than about 30 characters, which wraps in a third of an entry
-- page, plus every NPC Goal. New fields leave it off.
--
-- Guide-only fields get their own section on an entry page in a guided world:
-- one that a guided game uses, or that has a player or viewer member.
-- world_is_guided replaces world_has_restricted_members, which missed a guided
-- game whose players had not joined yet.
begin;

create or replace function public.world_configuration_validate_field(p_configuration jsonb, p_type text) returns void
language plpgsql set search_path = '' as $$
declare r jsonb; c jsonb; linked boolean;
begin
  if p_configuration is null or jsonb_typeof(p_configuration) <> 'object'
    or not (p_configuration ?& array['version','suggestions','helpText','visible','rules'])
    or p_configuration - array['version','suggestions','helpText','visible','rules','targetCategoryId',
      'multiple','allowOther','fullWidth'] <> '{}'::jsonb
    or p_configuration->'version' <> '1'::jsonb
    or jsonb_typeof(p_configuration->'suggestions') <> 'array'
    or jsonb_typeof(p_configuration->'rules') <> 'array'
    or jsonb_typeof(p_configuration->'helpText') <> 'string'
    or length(p_configuration->>'helpText') > 4000
    or jsonb_typeof(p_configuration->'visible') <> 'boolean'
    or octet_length(p_configuration::text) > 262144 then
    raise exception 'Invalid field configuration';
  end if;
  if p_type is null or p_type not in ('text','richText','select') then
    raise exception 'Invalid field type';
  end if;
  if p_type = 'select' then
    if jsonb_typeof(p_configuration->'multiple') is distinct from 'boolean'
      or jsonb_typeof(p_configuration->'allowOther') is distinct from 'boolean' then
      raise exception 'Select fields require multiple and allowOther flags';
    end if;
  elsif p_configuration ?| array['multiple','allowOther'] then
    raise exception 'Only select fields may set multiple or allowOther';
  end if;
  if p_configuration ? 'fullWidth' and (p_type <> 'text'
    or jsonb_typeof(p_configuration->'fullWidth') <> 'boolean') then
    raise exception 'Only text fields may set fullWidth';
  end if;
  linked := p_configuration ? 'targetCategoryId';
  if linked then
    if p_type <> 'select' then raise exception 'Only select fields may target a category'; end if;
    if jsonb_typeof(p_configuration->'targetCategoryId') <> 'string' then
      raise exception 'Reference fields require a target category';
    end if;
    perform (p_configuration->>'targetCategoryId')::uuid;
    if (p_configuration->>'allowOther')::boolean then
      raise exception 'Linked entry fields cannot allow other values';
    end if;
  end if;
  -- Suggestions are the options of a list select; other types have none.
  if jsonb_array_length(p_configuration->'suggestions') > 100
    or jsonb_array_length(p_configuration->'rules') > 64
    or ((p_type <> 'select' or linked) and p_configuration->'suggestions' <> '[]'::jsonb)
    or exists (select 1 from jsonb_array_elements(p_configuration->'suggestions') s
      where jsonb_typeof(s) <> 'string' or length(s #>> '{}') > 1000) then
    raise exception 'Invalid field suggestions or rule count';
  end if;
  if exists (select 1 from jsonb_array_elements_text(p_configuration->'suggestions') s where trim(s) = '')
    or (select count(distinct s) from jsonb_array_elements(p_configuration->'suggestions') s)
      <> jsonb_array_length(p_configuration->'suggestions') then
    raise exception 'Options must be unique and nonblank';
  end if;
  for r in select * from jsonb_array_elements(p_configuration->'rules') loop
    if jsonb_typeof(r) <> 'object' or not (r ? 'conditions')
      or r - array['conditions','visible','label','helpText','binding'] <> '{}'::jsonb
      or jsonb_typeof(r->'conditions') <> 'array'
      or (r ? 'visible' and jsonb_typeof(r->'visible') <> 'boolean')
      or (r ? 'label' and (jsonb_typeof(r->'label') <> 'string' or length(r->>'label') not between 1 and 200))
      or (r ? 'helpText' and (jsonb_typeof(r->'helpText') <> 'string' or length(r->>'helpText') > 4000)) then
      raise exception 'Invalid field rule';
    end if;
    if jsonb_array_length(r->'conditions') not between 1 and 16 then
      raise exception 'Rules require between 1 and 16 conditions';
    end if;
    perform public.world_configuration_validate_binding(r->'binding');
    if r ? 'binding' and r->'binding' <> 'null'::jsonb then
      if p_type = 'richText' then raise exception 'Rich text fields cannot use oracle bindings'; end if;
      if linked then raise exception 'Category reference fields cannot use oracle bindings'; end if;
    end if;
    for c in select * from jsonb_array_elements(r->'conditions') loop
      if jsonb_typeof(c) <> 'object' or not (c ?& array['source','fieldId','operator'])
        or c - array['source','fieldId','operator','value','ancestor'] <> '{}'::jsonb
        or coalesce(c->>'source','') not in ('entry','ancestor')
        or coalesce(c->>'operator','') not in ('equals','notEquals','contains','notContains','isEmpty','isNotEmpty')
        or jsonb_typeof(c->'fieldId') <> 'string'
        or (c ? 'value' and (jsonb_typeof(c->'value') <> 'string' or length(c->>'value') > 1000))
        or (c->>'operator' in ('equals','notEquals','contains','notContains') and not (c ? 'value')) then
        raise exception 'Invalid field condition';
      end if;
      perform (c->>'fieldId')::uuid;
      if c->>'source' = 'ancestor' then
        if not (c ? 'ancestor') or jsonb_typeof(c->'ancestor') <> 'object'
          or not ((c->'ancestor') ?& array['fieldId','value'])
          or (c->'ancestor') - array['fieldId','value'] <> '{}'::jsonb
          or jsonb_typeof(c->'ancestor'->'fieldId') <> 'string'
          or jsonb_typeof(c->'ancestor'->'value') <> 'string'
          or length(c->'ancestor'->>'value') > 1000 then
          raise exception 'Invalid ancestor selector';
        end if;
        perform (c->'ancestor'->>'fieldId')::uuid;
      elsif c ? 'ancestor' then
        raise exception 'Entry conditions cannot select an ancestor';
      end if;
    end loop;
  end loop;
end $$;

create temporary table full_width_template_fields(setting_key text,category_key text,field_key text) on commit drop;
insert into full_width_template_fields values
  ('world:starforged/forge','locations','sectorTrouble'),
  ('world:starforged/forge','locations','starDescription'),
  ('world:starforged/forge','locations','planetFeature'),
  ('world:starforged/forge','locations','settlementFirstLook'),
  ('world:starforged/forge','locations','vaultScale'),
  ('world:starforged/forge','locations','vaultInnerFirstLook'),
  ('world:starforged/forge','locations','vaultInnerFeature'),
  ('world:starforged/forge','locations','vaultInnerPeril'),
  ('world:starforged/forge','locations','vaultInnerOpportunity'),
  ('world:starforged/forge','locations','vaultSanctumPurpose'),
  ('world:starforged/forge','locations','vaultSanctumFeature'),
  ('world:starforged/forge','locations','vaultSanctumPeril'),
  ('world:starforged/forge','locations','vaultSanctumOpportunity'),
  ('world:starforged/forge','npcs','goal'),
  ('world:starforged/forge','factions','projects'),
  ('world:starforged/forge','factions','quirks'),
  ('world:starforged/forge','factions','rumors'),
  ('world:sundered_isles/sundered_isles','locations','islandOffshoreObservations'),
  ('world:sundered_isles/sundered_isles','locations','settlementFirstLook'),
  ('world:sundered_isles/sundered_isles','locations','settlementDetails'),
  ('world:sundered_isles/sundered_isles','locations','caveThreshold'),
  ('world:sundered_isles/sundered_isles','npcs','goal'),
  ('world:sundered_isles/sundered_isles','factions','chronicles'),
  ('world:sundered_isles/sundered_isles','factions','leadership'),
  ('world:sundered_isles/sundered_isles','factions','touchstones'),
  ('world:sundered_isles/sundered_isles','factions','role'),
  ('world:sundered_isles/sundered_isles','factions','methods'),
  ('world:sundered_isles/sundered_isles','factions','secrets'),
  ('world:sundered_isles/sundered_isles','factions','tactics'),
  ('world:sundered_isles/sundered_isles','factions','vulnerabilities'),
  ('world:sundered_isles/sundered_isles','factions','cursedAspects'),
  ('world:classic/ironlands','npcs','goal'),
  ('world:elegy/santa_maria','npcs','goal');

do $$
begin
  if exists (select 1 from full_width_template_fields f where not exists (
    select 1 from public.world_templates t,
      jsonb_array_elements(t.configuration->'categories') c,
      jsonb_array_elements(c->'fields') d
    where t.setting_key = f.setting_key and c->>'key' = f.category_key
      and d->>'key' = f.field_key and d->>'type' = 'text')) then
    raise exception 'A full width template field is missing';
  end if;
end $$;

-- Only inherited worlds read the templates; customized worlds keep their own
-- copies, which start without the option.
update public.world_templates t set configuration = jsonb_set(t.configuration,'{categories}',(
  select jsonb_agg(jsonb_set(c.value,'{fields}',coalesce((
    select jsonb_agg(case when exists (
        select 1 from full_width_template_fields w
        where w.setting_key = t.setting_key and w.category_key = c.value->>'key'
          and w.field_key = f.value->>'key')
      then jsonb_set(f.value,'{configuration,fullWidth}','true'::jsonb)
      else f.value end order by f.position)
    from jsonb_array_elements(c.value->'fields') with ordinality f(value,position)
  ),'[]'::jsonb)) order by c.position)
  from jsonb_array_elements(t.configuration->'categories') with ordinality c(value,position)))
where t.setting_key in (select setting_key from full_width_template_fields);

drop function public.world_has_restricted_members(uuid);
create function public.world_is_guided(p_world_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select public.world_role(p_world_id, auth.uid()) <> 'none' and (
    exists (select 1 from public.games g
      where g.world_id = p_world_id and g.game_type = 'guided')
    or exists (
      select 1 from (
        select wp.user_id from public.world_players wp where wp.world_id = p_world_id
        union
        select gp.user_id from public.game_players gp
          join public.games g on g.id = gp.game_id where g.world_id = p_world_id
      ) member
      where public.world_role(p_world_id, member.user_id) in ('player','viewer')));
$$;
revoke execute on function public.world_is_guided(uuid) from public;
revoke execute on function public.world_is_guided(uuid) from anon;
grant execute on function public.world_is_guided(uuid) to authenticated;
grant execute on function public.world_is_guided(uuid) to service_role;
commit;
