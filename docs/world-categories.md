# World categories (W4)

W4 adds editable category and field definitions to the shared world panel,
initial templates, conditional field configuration, and an oracle picker.
Implementation accepted on 2026-09-26; review and final verification are tracked
with the change, not certified by this document. Entry editing is W5.

## Architecture

| Area | Implementation |
| --- | --- |
| Template manifests and UUID allocation | [worldTemplates.ts](../src/lib/worldTemplates.ts), [shared helpers](../src/lib/worldTemplates/shared.ts), [Forge](../src/lib/worldTemplates/forge.ts), [other settings](../src/lib/worldTemplates/otherSettings.ts) |
| Pure rule evaluation and type compatibility | [worldFieldRules.ts](../src/lib/worldFieldRules.ts) |
| Package loading, merged choices, stored roll target | [worldOracleCatalog.ts](../src/lib/worldOracleCatalog.ts) |
| Creation and seeding RPC boundary | [service](../src/services/worldTemplates.service.ts), [repository](../src/repositories/worldTemplates.repository.ts) |
| Lazy legacy-world backfill | [useWorldTemplateBackfill.ts](../src/hooks/worlds/useWorldTemplateBackfill.ts) |
| Shared category/field management | [WorldCategoryManager.tsx](../src/components/worlds/categories/WorldCategoryManager.tsx), [WorldCategoryFields.tsx](../src/components/worlds/categories/WorldCategoryFields.tsx) |
| Database validation and atomic operations | [W4 migration](../supabase/migrations/20260926000000_world_category_templates.sql) |

Definitions and values remain separate database rows. Values reference the
immutable definition UUID; labels can repeat. Seed keys such as `locationType`
are stable import handles. Add Field always generates a new UUID and
`field_<uuid-without-hyphens>` key, including after deletion or with a duplicate
label. Renaming does not change identity or reconnect old data.

A `richText` ↔ `oracleText` type change preserves the Yjs content, UUID, key,
and condition references. Other type changes are blocked while values exist;
the editor offers **Create new field**. With no values, an otherwise valid
change can retain identity. Toggling text suggestions is not a type change.

### Rules

`configuration` is versioned JSON: version 1 stores `suggestions`, `helpText`,
base `visible`, and ordered `rules`. Older definitions normalize to an empty
rule list while retaining their fixed binding.

The first rule whose conditions all match wins. It may override visibility,
label, help text, and oracle binding. Omitted properties inherit the base;
explicit `binding: null` removes the roll button. UUID, key, type, and GM
visibility cannot vary by rule. Hidden fields keep their stored values.

Conditions use the current entry or its nearest ancestor matching a text field
value. Comparisons are `equals`, `notEquals`, `isEmpty`, and `isNotEmpty`.
Equality requires text; emptiness supports text, tags, and numbers. Missing
ancestors never match, and traversal stops on missing entries or cycles.
The visual rule editor exposes conditions, ordering, overrides, and fallback.
Text suggestions allow both picking a suggestion and entering any custom value.

Database checks keep references within a category and reject incompatible
condition sources. A target that depends on GM-only source data must also be
GM-only. A source cannot be deleted while another definition references it.
Existing GM-value mirroring/RLS continues to protect stored values.

## Initial templates

Every choice seeds **Locations, NPCs, Lore**, including Blank. No template seeds
Truths. Locations support hierarchy, maps, and bonds; NPCs support bonds; Lore
has no capability flags. Locations use Location Type as subtitle. All categories
include GM Notes (`richText`, GM-only); Lore always has Tags and GM Notes.

Most bound fields are `oracleText`; Pronouns, Location Type, Region, Species,
Difficulty, Planet Class, and Planet Description are plain text. Forge Derelict
Location is also plain text with a binding so its stored value can drive Type.

| Setting | Initial Locations fields | Initial NPC fields |
| --- | --- | --- |
| Blank (`null`) | Location Type, Tags, GM Notes; no bindings | Pronouns, Tags, GM Notes; no bindings |
| Ironlands (`world:classic/ironlands`) | Location Type; GM Description, Trouble, Location Features; GM Notes | Pronouns, Species; GM Descriptor, Role, Goal; GM Notes |
| Forge (`world:starforged/forge`) | Location Type, subtype-dependent fields below, GM Notes | Pronouns, Callsign, Difficulty; GM First Look, Role, Disposition, Goal, Revealed Aspect; GM Notes |
| Sundered Isles (`world:sundered_isles/sundered_isles`) | Location Type, Area Region, site-dependent fields below, GM Notes | Pronouns; GM First Look, Role, Disposition, Goal; GM Notes |
| Santa Maria (`world:elegy/santa_maria`) | Location Type, Tags; GM Description; GM Notes | Pronouns, Tags; GM Traits, Occupation, Goal, Disposition; GM Notes |

Ironlands suggests Settlement, Tower, Ruin, Camp. Species suggests Human, Elf,
Giant, Varou, Troll. The three location bindings are classic place descriptor,
settlement trouble, and place location; NPC bindings are classic character
descriptor/role/goal. Delve Disposition and Activity are omitted. Blank and
Santa Maria invent no Location Type suggestions. Elegy Description binds to
`oracle_rollable:elegy/text/generic`; NPC fields bind to the corresponding
`elegy/character/{traits,occupation,goal,disposition}` oracles.

### Forge

All subtypes are suggestions on the same Location Type field in one category.
Location Type, Region, Planet Class, Planet Description, and Star Description
are public; other location fields in this table are GM-only.

| Location Type | Fields and oracle behavior |
| --- | --- |
| Sector | Region (Terminus, Outlands, Expanse, Void); Sector Trouble |
| Planet | Planet Class; Description; Feature, Atmosphere, Life, Observed From Space keyed by class; Settlements keyed by class and nearest Sector Region |
| Planetside Settlement / Orbital Settlement | Location, First Look, Initial Contact, Authority, Projects, Trouble; Population keyed by nearest Sector Region |
| Star | Description (`starforged/space/stellar_object`) |
| Derelict | Location (Planetside, Orbital, Deep Space suggestions); Type keyed by Location; Condition, Outer First Look, Inner First Look |
| Vault | Location, Scale, Form, Shape, Material, Outer First Look; Interior First Look, Feature, Peril, Opportunity; Sanctum Purpose, Feature, Peril, Opportunity |

Planet Class suggests Desert, Furnace, Grave, Ice, Jovian, Jungle, Ocean, Rocky,
Shattered, Tainted, and Vital, each suffixed with “World”. Difficulty suggests Troublesome, Dangerous,
Formidable, Extreme, Epic. Vault's label is **Outer First Look**. Without a
recognized class/region, including Void, applicable fields remain editable and
unbound where no valid oracle exists. NPC Disposition uses
`starforged/character/initial_disposition`; Callsign is public and bound.

### Sundered Isles

Location Type has exactly six suggestions: **Area, Island, Settlement,
Shipwreck, Cave, Ruin**. Region is public text shown only on Area and suggests
Myriads, Margins, Reaches (Central, Outer, Remote Seas). Descendants use the
nearest Area's Region, including nested Areas. Site-specific fields are GM-only.

| Location Type | Initial fields |
| --- | --- |
| Area | Region |
| Island | Size, Terrain, Offshore Observations, Vitality |
| Settlement | Location, First Look, Details, Size |
| Shipwreck | Location, First Look, Details |
| Cave | Cave Type, Threshold, Lurking Threat |
| Ruin | Location, First Look, Condition |

Island Vitality and Settlement Size select Myriads/Margins/Reaches oracle
variants; missing Area context leaves them editable without a roll button.
NPC Role and Goal use the plural paths `character/roles` and `character/goals`.
The standalone package scope includes **Starforged plus Sundered Isles**.

## Oracle selection and divergence

The picker defaults to the world's effective playset: the union of linked-game
playsets, or setting packages plus existing binding packages when standalone.
Creation from a game uses that game's playset to pin initial bindings. The
catalog applies replacements and surfaces deterministic replacement collisions.
**All packages** expands choices to currently registered packages. Selecting an
outside package does not modify game curation. **Exact** permits the original
oracle despite replacement rules. Private homebrew read grants remain H work.

Each base/rule binding stores its own package, concrete oracle ID, and
`resolvedOracleId`. Unrelated edits preserve it; rebinding deliberately changes
it. `getFrozenWorldOracleBinding` loads the stored target and reports pending
divergence from current resolution. W5 rolls must use this helper's stored
target. Missing targets remain editable and visibly broken; never silently
choose another oracle. W9 owns actor previews, durable game-log notices, and
concurrency-protected transitions to a changed target.

## Permissions, deletion, and seeding

Readers can inspect configuration. Owner/editor/guide can add and edit
categories and fields. Only owner/editor can delete. Populated category deletion
is blocked in both UI and database; empty-category deletion confirms the
field-definition cascade. Field deletion counts values and confirms their
cascade, while referenced source fields require removing references first.
A future populated-category workflow must clean up stored images/maps.

`create_world_with_template` creates the world and inserts its manifest in one
transaction. Invalid manifests roll back creation. `seed_world_template` locks
the world before checking/seeding, preventing concurrent duplicate seeds.
Definitions are installed before rules so forward references can be validated.
Subtitle fields and entry values must belong to the correct category/world.

Existing worlds with zero categories and no receipt are backfilled lazily when
an **owner/editor/guide visits**. Read-only visitors cannot initiate seeding and
may see an empty world until an authorized visitor opens it. Failures expose a
retry. Durable `world_template_receipts` protect previously seeded/customized
worlds even if every category is later deliberately deleted. Receipts are also
recorded for existing category-bearing worlds and new custom categories.
Neither a later template version nor a setting change reapplies defaults.

## Rollout and verification

**Apply the W4 migration before deploying the client.** The new client requires
the configuration column and new RPCs. The existing `create_world` RPC remains
available to older clients; such empty worlds follow lazy backfill on a later
authorized visit. Do not reset a shared/production database to apply migrations.

Run these checks from the repository root; this is a verification checklist,
not a claim that this checkout has passed all checks:

```sh
npm run tsc
npx eslint . --quiet
npx vitest run src/lib/__tests__/worldTemplates.test.ts src/lib/__tests__/worldFieldRules.test.ts src/lib/__tests__/worldOracleCatalog.test.ts src/components/worlds/categories/__tests__
supabase test db
```

Database tests require a local Supabase instance with the migrations applied.
[SQL coverage](../supabase/tests/world_category_templates.test.sql) exercises
atomic creation/backfill, receipts, permissions, validation, field identity,
value/category boundaries, deletion guards, and reordering. The template test
checks every seed binding against installed Datasworn packages; rerun it when
changing defaults. Rule/catalog tests cover ancestor fallback, cycles, missing
targets, replacement collisions, exact selection, and frozen divergence. UI
tests cover permissions, confirmations, ordering, repeated labels, subtitles,
and type changes. Review standalone and in-game category surfaces as well.

## Follow-ups

- **W5:** entry list/filter/detail, scalar and Yjs value controls, suggestion
  controls, stored-target rolling, images, notes, and a simple parent Location
  selector. Validate same-world/category parents and cycles, and audit existing
  links before adding constraints. Decide entry-name rollers separately.
- **W6:** design Truths as a separate world feature with its own persistence
  and migration contract; no Truths category.
- **W7:** hierarchy/maps and type-specific icons; preserve W5's parent relation
  and the ability to change it when replacing the simple selector.
- **W8:** bonds and NPC connections/progress.
- **W9:** full divergence transitions, game logging, and second-screen behavior.
