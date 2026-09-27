# World categories (W4)

W4 adds editable category and field definitions to the shared world panel,
initial templates, conditional field configuration, and an oracle picker.
Implementation accepted on 2026-09-26; review and final verification are tracked
with the change, not certified by this document. Entry editing is W5.

## Configuration inheritance

Default configurations live in TypeScript. An uncustomized world reads the
current defaults for its setting without storing category or field-definition
rows. Corrections to those defaults reach uncustomized worlds on deployment.

The first category/field configuration edit copies the entire effective
configuration and applies the edit in one database transaction. Later edits
update that independent copy. Entry creation and entry/value edits do not fork
configuration. Deleting every custom category leaves a deliberately empty
world; it does not restore defaults. There is no historical template-version
system or new version number for user edits. The JSON rule schema version is
separate from configuration inheritance.

## Architecture

| Area | Implementation |
| --- | --- |
| Static manifests and world-scoped UUIDv5 identities | [worldTemplates.ts](../src/lib/worldTemplates.ts), [shared helpers](../src/lib/worldTemplates/shared.ts), [Forge](../src/lib/worldTemplates/forge.ts), [other settings](../src/lib/worldTemplates/otherSettings.ts) |
| Pure rule evaluation and type compatibility | [worldFieldRules.ts](../src/lib/worldFieldRules.ts) |
| Package loading, merged choices, stored roll target | [worldOracleCatalog.ts](../src/lib/worldOracleCatalog.ts) |
| Atomic configuration mutation boundary | [worldConfiguration.repository.ts](../src/repositories/worldConfiguration.repository.ts) |
| Shared category/field management | [WorldCategoryManager.tsx](../src/components/worlds/categories/WorldCategoryManager.tsx), [WorldCategoryFields.tsx](../src/components/worlds/categories/WorldCategoryFields.tsx) |
| Generated trusted defaults | [catalog generator](../supabase/tests/generate-static-world-catalog.mjs), [initial catalog migration](../supabase/migrations/20260926010000_world_static_catalog.sql), [simplified catalog release](../supabase/migrations/20260927010000_world_static_catalog.sql) |
| Database validation and atomic operations | [W4 migration](../supabase/migrations/20260926000000_world_category_templates.sql), [inheritance migration](../supabase/migrations/20260926020000_world_configuration_inheritance.sql) |

Custom definitions and all values remain separate database rows. Inherited
definitions are built from code. Both use the same definition contract. Default
category and field IDs are deterministic UUIDv5 values derived from the world
UUID and stable template keys. Materialization preserves those IDs, so existing
values and conditional references survive the first configuration edit.
Labels can repeat. Template keys such as `locationType` are stable import handles.
Add Field always generates a new UUID and
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

## Configuration editor

The world panel shows category tabs. **Configure** opens category and field
settings; **Add category** is available alongside it. Category and field drag
handles support pointer and keyboard ordering. Entry lists and editing remain W5.

Category icons use the Game Icons collection and theme-aware color shades.
Field settings group basic details, fallback behavior, and conditional overrides.
Internal UUIDs and keys are hidden; duplicate labels use readable subtype or
field-type descriptions. Every entry has intrinsic rich-text Notes, displayed
as a muted built-in row rather than an editable field definition.

GM-only targets may use GM-only text, number, and tag condition sources. Rich-text
and oracle-text content is a Yjs document, so it is not currently a condition
source. Public targets cannot depend on GM data.

## Initial templates

Every choice provides **Locations, NPCs, Lore**, including Blank. No template includes
Truths. Locations support hierarchy, maps, and bonds; NPCs support bonds; Lore
has no capability flags. Locations use Location Type as subtitle. Extra GM Notes
fields are omitted; entry Notes remain intrinsic. Lore has Tags.

Most bound fields are `oracleText`; Pronouns, Location Type, Region, Species,
Difficulty, and Planet Class are plain text. Forge Description is public
`oracleText`, shared by Planet and Star. Forge Derelict
Location is also plain text with a binding so its stored value can drive Type.

| Setting | Initial Locations fields | Initial NPC fields |
| --- | --- | --- |
| Blank (`null`) | Location Type, Tags; no bindings | Pronouns, Tags; no bindings |
| Ironlands (`world:classic/ironlands`) | Location Type; GM Description, Trouble, Location Features | Pronouns, Species; GM Descriptor, Role, Goal |
| Forge (`world:starforged/forge`) | Location Type, subtype-dependent fields below | Pronouns, Callsign, Difficulty; GM First Look, Role, Disposition, Goal, Revealed Aspect |
| Sundered Isles (`world:sundered_isles/sundered_isles`) | Location Type, Area Region, site-dependent fields below | Pronouns; GM First Look, Role, Disposition, Goal |
| Santa Maria (`world:elegy/santa_maria`) | Location Type, Tags; GM Description | Pronouns, Tags; GM Traits, Occupation, Goal, Disposition |

Ironlands suggests Settlement, Tower, Ruin, Camp. Species suggests Human, Elf,
Giant, Varou, Troll. The three location bindings are classic place descriptor,
settlement trouble, and place location; NPC bindings are classic character
descriptor/role/goal. Delve Disposition and Activity are omitted. Blank and
Santa Maria invent no Location Type suggestions. Elegy Description binds to
`oracle_rollable:elegy/text/generic`; NPC fields bind to the corresponding
`elegy/character/{traits,occupation,goal,disposition}` oracles.

### Forge

All subtypes are suggestions on the same Location Type field in one category.
Location Type, Region, Planet Class, and the shared Description
are public; other location fields in this table are GM-only.

| Location Type | Fields and oracle behavior |
| --- | --- |
| Sector | Region (Terminus, Outlands, Expanse, Void); Sector Trouble |
| Planet | Planet Class; Description; Feature, Atmosphere, Life, Observed From Space keyed by class; Settlements keyed by class and nearest Sector Region |
| Planetside Settlement / Orbital Settlement | Location, First Look, Initial Contact, Authority, Projects, Trouble; Population keyed by nearest Sector Region |
| Star | Description (`starforged/space/stellar_object`) |
| Derelict | Location (Planetside, Orbital, Deep Space suggestions); Type keyed by Location; Condition, Outer First Look, Inner First Look |
| Vault | Location, Scale, Form, Shape, Material, Outer First Look; Interior First Look, Feature, Peril, Opportunity; Sanctum Purpose, Feature, Peril, Opportunity |

Description uses the existing `starDescription` identity and OracleText storage:
Planet has no roll binding; Star uses the stellar-object oracle. Location shares
`settlementLocation` between settlements and Vault; Outer First Look shares
`derelictOuterFirstLook` between Derelict and Vault. Each shared field selects
its oracle through Location Type conditions. Derelict Location stays separate
because it is a scalar condition source.

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

Location, First Look, Details, and Size each use one definition across their
applicable site types, with conditional oracle bindings. Retained keys are
`settlementLocation`, `settlementFirstLook`, `settlementDetails`, and `islandSize`.
Island Vitality and Settlement Size select Myriads/Margins/Reaches oracle
variants; missing Area context leaves them editable without a roll button.
NPC Role and Goal use the plural paths `character/roles` and `character/goals`.
The standalone package scope includes **Starforged plus Sundered Isles**.

## Oracle selection and divergence

The picker defaults to the world's effective playset: the union of linked-game
playsets, or setting packages plus existing binding packages when standalone.
Inherited defaults follow the current effective playset. The catalog applies
replacements and surfaces deterministic replacement collisions. The picker
presents a searchable collection tree, merging expansion enhancements into
their base collections rather than listing separate package sections.
**All packages** expands choices to currently registered packages. Selecting an
outside package does not modify game curation. **Exact** permits the original
oracle despite replacement rules. Private homebrew read grants remain H work.

At the first configuration edit, every effective base/rule binding is copied
with its package, concrete oracle ID, and `resolvedOracleId`. Customized worlds
pin these targets. Unrelated edits preserve them; rebinding deliberately changes
them. Uncustomized worlds continue resolving current defaults and playsets.
`getFrozenWorldOracleBinding` loads the stored target and reports pending
divergence from current resolution. W5 rolls use the effective binding: the
current inherited target for default configuration, or this helper's stored
target for customized configuration. Missing targets remain editable and visibly
broken; never silently choose another oracle. W9 owns actor previews, durable game-log notices, and
concurrency-protected transitions to a changed target.

## Permissions, deletion, and persistence

Readers can inspect configuration, including defaults before any member edits
it. Owner/editor/guide can add and edit categories and fields. Only owner/editor
can delete. Populated category deletion is blocked in both UI and database;
empty-category deletion confirms the field-definition cascade. Field deletion
counts values and confirms their cascade, while referenced source fields require
removing references first. A future populated-category workflow must clean up
stored images/maps.

World creation uses `create_world` without inserting default definitions.
`mutate_world_configuration` locks the world, materializes all effective defaults
if necessary, and applies the requested configuration mutation atomically. A
failed edit rolls back the fork as well. Concurrent first edits cannot create
duplicate default rows or overwrite an already customized configuration.
`configuration_customized` distinguishes inheritance from an intentionally empty
custom configuration; its state is derived from the durable receipt.

Entry/value writes require authoritative category and field lookup even before
there are definition rows. A trusted SQL function catalog is generated from the
same TypeScript defaults. Database validation uses that catalog for inherited
worlds and stored definitions for customized worlds. It enforces category/world
membership and derives GM visibility from the effective definition. The catalog
is release code, not an administrator-editable global configuration table.

Existing materialized configurations and receipt-bearing worlds are preserved
as custom: migration does not guess whether their differences were user edits.
Previously empty worlds without a receipt inherit defaults immediately, including
for readers. There is no visit-triggered backfill. Later default changes never
overwrite custom rows.

## Rollout and verification

**Apply the W4 migrations, including the generated catalog and inheritance
migrations, before deploying the client.** The new client requires
the configuration column, inheritance state, trusted default catalog, and mutation
RPC. When changing defaults, regenerate the SQL catalog from TypeScript and ship
its migration alongside the app so validation and UI agree. Keep existing default
keys stable; type changes, removal, and GM-visibility changes require an explicit
data-compatibility review because values may already reference inherited fields.
Do not reset a shared/production database to apply migrations.

For future default changes, generate a **new** migration from the repository root:

```sh
node supabase/tests/generate-static-world-catalog.mjs --output 'supabase/migrations/<timestamp>_world_static_catalog.sql'
```

Replace `<timestamp>` with a new migration timestamp. Keep the
`_world_static_catalog.sql` suffix so the drift check discovers the latest catalog.
Do not overwrite an applied migration. If a release removes/retypes identities,
add its preservation prelude at `supabase/world-catalog-releases/<timestamp>.sql`.
The generator includes that file before replacing the catalog and refreshing
inherited value visibility. The entire generated migration must execute in one
transaction; standalone psql runs must use `--single-transaction`.

The 20260927010000 release removes GM Notes and merges equivalent conditional
fields. Before replacing the catalog, it holds an ACCESS EXCLUSIVE lock on worlds
(entry/value guards also acquire world locks) and copies the complete old trusted
configuration only for inherited worlds with values on retired identities.
Those worlds become independent custom configurations. Value UUIDs, scalar/Yjs
bytes, storage types, and GM privacy remain intact; no values are converted or
merged. Existing custom worlds and inherited worlds without affected values
remain unchanged. The old trusted catalog contains raw oracle bindings, not the
browser's current linked-playset replacement results. Safety-frozen worlds may
therefore show pending binding divergence and need deliberate oracle reselection.

`npm run check:world-defaults` verifies that the latest generated catalog
matches TypeScript; `npm run build` includes
this gate.

Run these checks from the repository root; this is a verification checklist,
not a claim that this checkout has passed all checks:

```sh
npm run tsc
npx eslint . --quiet
npm run check:world-defaults
npx vitest run src/lib/__tests__/worldTemplates.test.ts src/lib/__tests__/worldFieldRules.test.ts src/lib/__tests__/worldOracleCatalog.test.ts src/components/worlds/categories/__tests__
supabase test db
npm run build
```

The old-to-new catalog preservation regression lives outside normal test discovery
because it temporarily reinstalls the previous catalog. Run it against an isolated
migrated clone with a role that owns the catalog functions; all fixture changes
roll back. Use `-f` so its relative migration includes resolve correctly:

```sh
psql --dbname=<isolated-test-database> -v ON_ERROR_STOP=1 -f supabase/upgrade-tests/world_catalog_upgrade.sql
```

Database tests require a local Supabase instance with the migrations applied.
SQL verification should cover creation without materialization, atomic first-edit
forks and rollback, concurrency, receipts, permissions, validation before/after
fork, preserved field
identity and values, value/category boundaries, deletion guards, and reordering.
The template test checks every default binding against installed Datasworn
packages; rerun it when changing defaults. Rule/catalog tests cover ancestor
fallback, cycles, missing targets, replacement collisions, exact selection, and
frozen divergence. UI
tests cover permissions, confirmations, ordering, repeated labels, subtitles,
and type changes. Review standalone and in-game category surfaces as well.

## Follow-ups

- **W5:** entry list/filter/detail, scalar and Yjs value controls, suggestion
  controls, effective-binding rolling, images, notes, and a simple parent Location
  selector. Validate same-world/category parents and cycles, and audit existing
  links before adding constraints. Include oracle buttons for generating the
  intrinsic entry name, separate from field-value rollers.
- **W6:** design Truths as a separate world feature with its own persistence
  and migration contract; no Truths category.
- **W7:** hierarchy/maps and type-specific icons; preserve W5's parent relation
  and the ability to change it when replacing the simple selector.
- **W8:** bonds and NPC connections/progress.
- **W9:** full divergence transitions, game logging, and second-screen behavior.
