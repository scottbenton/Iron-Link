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

## Games

- Clients cannot add other people to a game. A client adds only its own first
  row to a game it just created (`games.created_by`). Everyone else joins
  through the service-role `add-player-to-game-invite` edge function.
- Only a Guide of the game changes roles or `game_type`. Triggers enforce this
  and stand aside for roles that bypass RLS, so a SECURITY DEFINER function
  that writes `game_players` or `games` must check authorisation itself.

## Worlds

- A world is guided (`world_is_guided`, `useWorldIsGuided`) when a linked
  game is guided or a member is a player or viewer. Guide-only controls
  (Share, Guide only wells, lock icons) appear only in guided worlds.
- Non-customized worlds read `world_templates` live, so a template migration
  reaches them at once; customized worlds hold copied field definitions and
  are not changed by it.
- Entry field values save through `useWorldFieldDraft`: a change shows at
  once and saves after a 1s pause, and keeps showing until the stored value
  matches it, because realtime echoes of an earlier save can arrive late.
- A field whose oracle comes from an ancestor's value (Population from the
  nearest Sector's Region) shows editors a note naming the parent it needs
  when none fits (`getWorldFieldParentRequirements`); the wording is built
  from the rules, so templates need no copy for it.
- A world entry is either Guide prep (`only_guides` read and edit) or shared
  with everyone (`all_players` read and edit, so players can add notes).
  Only Guides choose, and only in guided worlds; a trigger refuses permission
  changes from anyone else. Older author-scoped entries read as shared.
- Long text fields are no longer offered for new fields; existing ones keep
  working.
- World Notes (headed "Overview" on the world home) are Yjs bytes in
  `worlds.notes_content`, left out of world list queries. Guides edit them but
  may not update `worlds`, so every save goes through the
  `update_world_notes_if_unchanged` RPC, versioned by `notes_updated_at`.
- A world entry mention stores only the entry id (`kind: "worldEntry"`,
  `label: null`); its name is read live from the entries store, so renames
  show at once and an unreadable entry shows "Unavailable entry".

## Rich text

- Live editing rooms are locked by room keys (`room_keys` per note, entry and
  world, `guide_room_keys` per game and world, readable only by readers or Guides).
  Give `RtcRichTextEditor` a `roomKeySource`; never use an id as a room password.
- Rich text saves merge rather than overwrite: the editor takes a
  `RichTextContentStore` and saves through `saveMergedRichText`, guarded by the
  row's `updated_at`. A new rich text column needs a versioned row and a store.

## Notes

- Note and folder RLS follows the app's `getPermissions` (`notes.store.ts`)
  through the `note_permission_allows_read|edit|manage` helpers, and the
  `notes_guard_update`/`note_folders_guard_update` triggers check which columns
  each editor may change. Change both sides together.

## Character sheets

- Sheet edit controls check `useCanEditCharacter` (backed by
  `getCharacterAccess`, which mirrors the database's `can_edit_character()`),
  not ownership. Only Edit access and Delete use `useIsOwnerOfCharacter`.
