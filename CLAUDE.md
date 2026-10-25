# Iron-Link

Notes for anyone (person or agent) changing this repo. `CONTRIBUTING.md`
covers setup, data flow and folder layout; this file holds the conventions
that are easy to miss. When you learn a new one, add a line here.

## User-facing copy

- Never end a menu item or button label with an ellipsis ("…" or "..."),
  including in-progress button states ("Creating World", not "Creating
  World..."). A loading status that is not a control may keep one.
- Checkboxes, never switches, for on/off settings in forms.

## Checks

- Type-check: `npx tsc -b` (what `npm run build` runs).
- Lint: `npx eslint .`; format: `npx prettier --check .`.
- Unit tests: `npx vitest run`. Suites that import the Supabase client need
  `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` set (a gitignored
  `.env.local` with placeholder values is enough).
- Database tests: `npm run test:db` (pgTAP under `supabase/tests/`).
- After changing a world template migration, regenerate
  `supabase/world-defaults.json` and `.md` with
  `npm run generate:world-defaults`.

## Worlds

- A world is guided (`world_is_guided`, `useWorldIsGuided`) when a linked
  game is guided or a member is a player or viewer. Guide-only controls
  (Share, Guide only wells, lock icons) appear only in guided worlds.
- Non-customized worlds read `world_templates` live, so a template migration
  reaches them at once; customized worlds hold copied field definitions and
  are not changed by it.
- A field whose oracle comes from an ancestor's value (Population from the
  nearest Sector's Region) shows editors a note naming the parent it needs
  when none fits (`getWorldFieldParentRequirements`); the wording is built
  from the rules, so templates need no copy for it.
- Long text fields are no longer offered for new fields; existing ones keep
  working.
