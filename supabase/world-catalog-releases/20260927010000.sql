-- Preserve data before retiring shared field identities. This prelude and the
-- catalog replacement MUST execute in one transaction. World entry/value guards
-- acquire RowShare locks on worlds, so this lock serializes their writes too.
-- The generator wraps this prelude, replacement, and visibility refresh in one
-- explicit transaction for the Supabase migration runner.
lock table public.worlds in access exclusive mode;

do $preserve$
declare w public.worlds; template jsonb; category jsonb; definition jsonb;
begin
  for w in select * from public.worlds where not configuration_customized loop
    template := public.w4_static_world_template(w.id,w.setting_key);
    if not exists (
      select 1 from jsonb_array_elements(template->'categories') c,
        lateral jsonb_array_elements(c->'fields') f,
        public.world_entry_field_values v
      where v.world_id = w.id and v.field_definition_id = (f->>'id')::uuid
        and (
          f->>'key' = 'gmNotes'
          or (w.setting_key = 'world:starforged/forge' and f->>'key' in (
            'planetDescription','vaultLocation','vaultOuterFirstLook'))
          or (w.setting_key = 'world:sundered_isles/sundered_isles' and f->>'key' in (
            'shipwreckLocation','ruinLocation','shipwreckFirstLook','ruinFirstLook',
            'shipwreckDetails','settlementSize'))
        )
    ) then continue; end if;

    -- The source is the OLD trusted catalog, never a client manifest. Keep the
    -- complete old configuration and all value identities/storage/privacy. The
    -- category trigger records the permanent customization receipt. No actor
    -- impersonation, trigger bypass, or new privileged endpoint is introduced.
    -- Browser-only playset replacement resolutions cannot be recovered here:
    -- keep raw trusted bindings; editors can reselect pending divergences.
    for category in select value from jsonb_array_elements(template->'categories') loop
      insert into public.world_categories
        (id,world_id,name,icon,sort_order,supports_hierarchy,supports_map,supports_bonds)
      values ((category->>'id')::uuid,w.id,category->>'name',nullif(category->'icon','null'::jsonb),
        (category->>'sort_order')::integer,(category->>'supports_hierarchy')::boolean,
        (category->>'supports_map')::boolean,(category->>'supports_bonds')::boolean);
      -- Install every identity before validating conditions and subtitle links.
      for definition in select value from jsonb_array_elements(category->'fields') loop
        insert into public.world_field_definitions
          (id,world_id,category_id,key,label,type,binding,gm_only,sort_order)
        values ((definition->>'id')::uuid,w.id,(category->>'id')::uuid,definition->>'key',
          definition->>'label',definition->>'type',nullif(definition->'binding','null'::jsonb),
          (definition->>'gm_only')::boolean,(definition->>'sort_order')::integer);
      end loop;
      for definition in select value from jsonb_array_elements(category->'fields') loop
        update public.world_field_definitions set configuration = definition->'configuration'
          where id = (definition->>'id')::uuid;
      end loop;
      update public.world_categories
        set subtitle_field_definition_id = (category->>'subtitle_field_definition_id')::uuid
        where id = (category->>'id')::uuid;
    end loop;
  end loop;
end $preserve$;
