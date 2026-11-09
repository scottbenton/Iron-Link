# Iron-Link

Notes for anyone (person or agent) changing this repo. `CONTRIBUTING.md`
covers setup, data flow and folder layout; this file holds the conventions
that are easy to miss. When you learn a new one, add a line here.

## User-facing copy

- Never end a menu item or button label with an ellipsis ("…" or "..."),
  including in-progress button states ("Creating World", not "Creating
  World..."). A loading status that is not a control may keep one.
- Checkboxes, never switches, for on/off settings in forms.

## Accessibility

- Screen reader announcements go through `useSetAnnouncement`. Live regions
  read `useLiveRegionText`, which clears and rewrites the text so a repeated
  message is read again. A modal dialog hides the page's region, so
  `DialogTitleWithCloseButton` renders its own `LiveRegion`. Only its
  heading is the `DialogTitle` (whose id names the dialog); its buttons sit
  beside it, so the dialog's name is the title alone.
- One h1 per page, and headings nest by section: Typography's `variant` sets
  the look, `component` the element. A label that only looks like a heading
  (track and clock titles, empty state titles, anything inside a button)
  takes a non-heading `component`. On the game page the h1 is `NavBar`'s
  page title (screen reader only on wide screens) and each column has an h2.
- World headings are written for the world's own page and read their
  element from `useHeadingComponent(level)`; in a game's Notes tab
  `WorldPanel` adds a `HeadingOffset` of 2, and a dialog inside it wraps
  itself in `<HeadingOffset reset>`.
- Pages name the browser tab with `useDocumentTitle` ("{page} | Iron Link");
  `HeadProvider` renders no `<title>`.
- After navigation `useFocusPageOnNavigate` (in `BaseLayout`) focuses the
  page's h1, or `<main>` until it renders. Paths that are one page
  (`getRouteFocusKey`: a game's tabs, an entry's Places) keep focus unless
  the focused control went away.
- Sortable lists pass dnd-kit `accessibility` announcements that use item
  names; the defaults read ids.

## Deploys

- A tab left open across a deploy asks for chunks that are gone (Cloudflare
  Pages answers with index.html). `installStaleChunkReload` reloads once on
  Vite's `vite:preloadError`, whatever the browser's wording, with a 10s
  guard so a chunk missing from the new build shows the crash page instead of
  looping. Error boundaries render nothing while `isStaleChunkReloadPending()`;
  never match chunk-error message strings.

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
- There are no Long text fields: Notes is the only rich text on an entry, and
  field types are `text` and `select` (values are plain JSON, no `content`).
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

- Guide-only secrets never go in a document players can read. Each note,
  entry Notes or world Notes keeps its secrets in one companion Yjs document,
  a `rich_text_secrets` row created by the first save, read only by Guides who
  can read the surface (`rich_text_secrets_allowed`) and written only by those
  who can also edit it (`rich_text_secrets_writable`). Blocks are
  anchored by Yjs relative positions stored in the companion (spike #252);
  the shared document holds nothing about them. Images in secrets go in the
  private `guide_images` bucket and are shown through signed URLs. A
  `guide-image:` src never enters shared text: `GuideImagePasteGuard` strips
  it from pastes and drops, and the editor stores a public copy through
  `RtcRichTextEditor`'s `uploadImage` (left out with a message without one).
- A Guide's editor gets secrets by passing `secrets` to `RtcRichTextEditor`
  (`components/RichTextEditor/secrets/`): each block is a widget holding its
  own editor, run by `SecretsController`, read-only (no anchor rewrites,
  inserts or deletes) when the surface's editor is. Players' editors get no secrets
  extension. Undo goes through the controller's `UndoCoordinator`, never a
  block editor's own, and a block node's image `src` is `guide-image:<path>`,
  never a URL. Pass the editor a stable `Toolbar` component; one created on
  each render remounts the toolbar and swallows clicks.
- Guides who turn on the "secrets" advanced feature get Insert secret on
  every surface they edit in a guided game or world (existing secrets show
  either way), so secrets can be prepared before sharing; a block notes "Shared
  only with you/Guides so far" until players can read it. Solo and co-op
  games get no secrets; a world that isn't guided still shows its existing
  ones (`noteSecrets.ts`, `worldNotesSecrets.ts`).

## Notes

- A Notes tab's close button is a sibling of its tab (`NoteTab`), never
  inside it. MUI Tabs' arrow keys walk the strip's direct children, which
  are the wrappers, so `NoteTab` handles arrows, Home and End itself.
- Note and folder RLS follows the app's `getPermissions` (`notes.store.ts`)
  through the `note_permission_allows_read|edit|manage` helpers, and the
  `notes_guard_update`/`note_folders_guard_update` triggers check which columns
  each editor may change. Change both sides together.

## Character sheets

- Sheet edit controls check `useCanEditCharacter` (backed by
  `getCharacterAccess`, which mirrors the database's `can_edit_character()`),
  not ownership. Only Edit access and Delete use `useIsOwnerOfCharacter`.

## Reference

- `/reference` is open to signed out visitors: paths under `openPathPrefixes`
  pass `isOpenPath`. It loads bundled rules packages only, never the database,
  and saves nothing; its settings are per device in localStorage.
- Reference URLs are Datasworn ids (`getReferenceItemHref`), so a renamed id
  breaks old links. Rules text links go through `DataswornLinkHandlerProvider`,
  which opens reference pages there and the Datasworn dialog everywhere else.
- The reference lists are the game's `MoveTree`/`OracleTree` in link mode
  (`linkMode`, `_helpers/treeLinkMode.ts`): items are links, the open item's
  collections start open. Without `linkMode` they behave as in a game.
- A hidden whole-package source is not loaded (`getLoadedPackageIds`), because
  Starsmith merges into Starforged's oracle collections once loaded. The open
  item's package always loads, so a link to a hidden item still opens.
- Rules naming follows the game: Ironsworn says Debilities, the others
  Impacts; tracks are Legacy Tracks when every track is a legacy.
