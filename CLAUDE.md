# Iron-Link

Notes for anyone (person or agent) changing this repo. `CONTRIBUTING.md`
covers setup, data flow and folder layout; this file holds the conventions
that are easy to miss. When you learn a new one, add a line here.

## UI library

- `src/ui` files hold one component or one hook each, with contexts and
  generic hooks in their own files; the rules are in `src/ui/README.md`.

## User-facing copy

- `src/ui` text goes through `t()` with a `ui.` key and its English default;
  the rules are in `src/ui/README.md`, and lint flags JSX text there.

- Never end a menu item or button label with an ellipsis ("…" or "..."),
  including in-progress button states ("Creating World", not "Creating
  World..."). A loading status that is not a control may keep one.
- Checkboxes, never switches, for on/off settings in forms.
- Inputs with a submit button are a real form, so Enter submits: a dialog
  passes `getDialogFormSlotProps(onSubmit)` (`lib/dialogForm.lib.ts`) to
  `slotProps`, which makes its paper the form without changing its layout,
  and its main button is `type="submit"`. The handler calls
  `preventDefault` and, where it tracks loading, ignores a submit while one
  is in flight.

## Layout and input

- Screen width decides layout (`useIsBreakpoint`, `useIsMobile`); never
  call `useMediaQuery` with a breakpoint by hand. Touch decides control
  size and gestures (44px targets, long press): `useIsTouchDevice`
  (`pointer: coarse`), so a tablet gets the wide layout sized for fingers.
- In `src/ui`, phone width is below 600px (`useIsMobile` from
  `src/ui/hooks`, the CSS's `smDown`); from 600 to 900px pages get the wide
  layout with sidebars on a rail that open as flyouts and can't be pinned.
  The app's own `useIsMobile` stays at 900px until its screens move over.

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
  (`getRouteFocusKey`: a game's tabs, an entry's Details, Places and Map)
  keep focus unless the focused control went away.
- Sortable lists pass dnd-kit `accessibility` announcements that use item
  names; the defaults read ids.
- Announce one message per action: a second `setAnnouncement` in the same
  tick replaces the first. Rolls announce `getRollAnnouncement`, built from
  `getRollSummary` (`lib/rollSummary.lib.ts`), which roll cards also read;
  a caller with more to say (a clock's progress) rolls with
  `{ announce: false }` and folds the summary into its own message.
- Roll cards hide their visual parts and read the summary laid over the
  card. They dismiss only through their named button, never a tap on the
  card. Dialogs render the recent roll cards through `DialogExtrasContext`
  (from `DialogTitleWithCloseButton`); `useIsActiveRollCardHost` lets only
  the newest place show them.
- Snackbars read their message through the live region (dialogs hide the
  snackbar container); the alert itself is not live. Errors persist.
- Filters announce their result count with `useAnnounceSearchResults`.

## Deploys

- Cloudflare Pages deploys come from the `deploy` job in
  `.github/workflows/ci.yaml` (Direct Upload with wrangler), after unit
  tests, lint and database tests pass; Cloudflare's own Git builds are off.
  Build variables live in the `production` and `preview` GitHub environments.
- Storybook deploys from `.github/workflows/storybook.yaml` on every branch
  push to its own Pages project (`iron-link-storybook`), one preview address
  per branch; the project's production branch, set in Cloudflare, gets the
  main address. It needs no Supabase variables and comments on nothing.
- A tab left open across a deploy asks for chunks that are gone (Cloudflare
  Pages answers with index.html). `installStaleChunkReload` reloads once on
  Vite's `vite:preloadError`, whatever the browser's wording, with a 10s
  guard so a chunk missing from the new build shows the crash page instead of
  looping. Error boundaries render nothing while `isStaleChunkReloadPending()`;
  never match chunk-error message strings.

## Checks

- Type-check: `npx tsc -b` (what `npm run build` runs).
- Lint: `npx eslint .`; format: `npx prettier --check .`.
- Unit tests: `npm test` (`npm run test:watch` to watch). Suites that import
  the Supabase client need `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
  set (a gitignored `.env.local` with placeholder values is enough).
- GitHub Actions (`.github/workflows/ci.yaml`) runs unit tests, lint, a
  Prettier check (`npm run format` fixes it) and database tests on every PR
  and on main. The Cloudflare Pages build only type-checks and builds, so
  keep tests out of `npm run build`.
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

- World paths are built only by `getWorldViewPath` and read only by
  `parseWorldViewPath` (`worldNavigation.ts`); one `/worlds/:worldId/*`
  route renders `WorldPage`, and a path the parser rejects is a 404.
- A world destination looks the same on the Worlds page and in a Notes tab
  (breadcrumbs over the grey action strip); `WorldLayout` only sets where
  heading levels start. The page is `WorldPageLayout`: Reference docks beside
  the world while the page's own width has room (`getWorldReferencePlacement`);
  otherwise a Reference button at the end of the breadcrumb row
  (`WorldViewHeaderActionContext`) opens it over the world. Never a full-height
  strip. Phones get World and Reference tabs. Its oracles come from the world catalog, loaded into the
  shared rules store with `getWorldReferenceRules`, so rolls there go to a
  roll card with no game log.
- An entry's Notes take the main column with its fields in a side panel when
  the entry's container is wide enough (a container query, so a game's
  narrower Notes column keeps them stacked).
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
- An entry's image is stored whole (the full-size view shows the upload) and
  its icon shows the part chosen in `WorldEntryImageDialog`:
  `image_position_x|y` and `image_scale`, a character portrait's crop shape
  (`lib/imageCrop.lib.ts`, which clamps it, and the shared `ImageCropper`).
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
- Hovering an entry mention (or focusing it from the keyboard) shows
  `WorldEntryHoverCard`: picture, name, category and the first few filled-in
  fields this reader can see. It reads only the loaded stores, never the
  entry's Notes, so it costs no request. Touch gets no card.
- Field bindings follow the rules in play, customized worlds included
  (`resolveFieldDefinitions`): inside a game the world's oracle catalog uses
  that game's own playset (`useListenToGameWorld` passes it), and on the
  world page every linked game's combined. Only a binding marked `exact`
  ignores replacements. `WorldGameRulesNotice` tells a game when its rules
  roll some field differently from the combined rules.

## Maps

- An entry's map is a `world_maps` row (grid chosen at creation: `hex_pointy`,
  `hex_flat`, `square` or `none`); painted cells live in 16x16 chunks in
  `world_map_chunks`, keyed "x,y" in the grid's own coordinates (axial for
  hexes). Paint only through `paint_world_map_cells`, which merges cells, never
  by writing a chunk's `cells` whole (clearing to `{}` is the one exception).
- Pins (`world_map_pins`) are child entries at a position in map units (a CSS
  pixel at the default cell size), snapped to a cell when drawn. A pin is only
  readable with its entry, and moving the child elsewhere removes its pin.

## Truths

- A world keeps one `world_truths` row per Datasworn truth id: an option id
  (plus a Starforged sub-table row id) or a written description. Choices
  outlive setting changes and rules updates; the screen shows the current
  setting's truths, and an id that no longer resolves reads as not chosen.
- A written truth's quest starter is Guide-only, in
  `world_truth_quest_starters`, written only through `set_world_custom_truth`
  and dropped when an option replaces the written truth. Datasworn quest
  starters and unchosen options come from rules data and show only to Guides.
- PostgREST's upsert sets every column it was sent, the conflict key too, so
  a table written by client upserts needs UPDATE on its key columns; keep a
  key fixed with a trigger (`world_truths_keep_key`), not by withholding the
  grant. Write pgTAP upserts the same way.
- Truths come from the setting's own package (`getWorldTruthsPackageId`), so
  the Sundered Isles shows its own, not Starforged's. Iron Fellowship and
  Crew Link truths (`newTruths`, keyed by dictionary key with option and
  sub-table indexes) map through `mapLegacyWorldTruths`, which never drops a
  written truth.

## Bonds

- The game's rules decide what a character has with a world entry: an
  Ironlands bond is a `world_entry_bonds` row (the row is the bond); a
  Starforged connection is a `world_entry_connections` row holding `rank`,
  `completed_ticks` 0 to 40 and `bonded`. A connection is one character's
  (`character_id`) or the whole party's (`character_id` null: every character
  of `game_id`, including later ones). Per entry and game there is either one
  party connection or at most one per character, never both; sharing and
  keeping for one character are updates of `character_id`. Rows only exist in
  a category with bonds, for a game linked to the entry's world; turning bonds
  off, unlinking a game or moving a character keeps them, so readers filter
  by the world's linked games.
- Bonds and connections are read with their entry and written by people who
  can edit the character and read the entry, never by the Guide for someone
  else's sheet. A party connection is changed by anyone who can edit a
  character of its game (`can_edit_world_entry_connection`).
- Bonds show only inside a game (the route's `useGameIdOptional`, so a
  game's Notes tab), with that game's characters and rules
  (`getWorldBondMechanics`); the world page shows a note instead. Bond
  changes go through `useWorldBondActions`, which also moves the character's
  Bonds track and offers Undo in a snackbar.
- On the character sheet, Ironlands bonds (`CharacterWorldBonds`) and
  connections (`CharacterConnections`, with Show Bonded and Add) sit under
  the Tracks tab's tracks in a `CollapsibleTrackSection`: a header bar like
  the tracks' own that toggles as a whole, open at first only with fewer
  than three to show. Add picks an NPC of a bonds category or
  creates one, shared with everyone. Every connection has an NPC.

## Rich text

- Live editing rooms are locked by room keys (`room_keys` per note, entry and
  world, `guide_room_keys` per game and world, readable only by readers or Guides).
  Give `RtcRichTextEditor` a `roomKeySource`; never use an id as a room password.
- Rich text saves merge rather than overwrite: the editor takes a
  `RichTextContentStore` and saves through `saveMergedRichText`, guarded by the
  row's `updated_at`. A new rich text column needs a versioned row and a store.

- Note images resize only through `ImageResizeHandles`, square `<button>`s on
  the corners, the bottom one on the moving edge also the keyboard's slider
  (sizing rules in `lib/noteImageResize.lib.ts`). Controls in
  a node view are buttons because Tiptap stops a button's events from reaching
  ProseMirror; a div's pointer and key events would select or drag the node.
  The `<img>` is never draggable, or the browser drops a copy of it.

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
