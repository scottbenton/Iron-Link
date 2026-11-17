# Iron-Link

Notes for anyone (person or agent) changing this repo. `CONTRIBUTING.md`
covers setup, data flow and folder layout; this file holds the conventions
that are easy to miss. When you learn a new one, add a line here.

## User-facing copy

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
  Styles size for fingers in CSS with `TOUCH_DEVICE_MEDIA_QUERY` and
  `TOUCH_TARGET_SIZE` (`hooks/useIsTouchDevice.ts`) as an `sx` key, so the
  first render is already the right size.
- On phones a game page's sections (Sheet or Overview, Notes, Moves,
  Oracles, Log) are chosen in `GameBottomNav`, so the Reference panel shows
  no tab strip there. The game log counts as read only while it is on screen
  (`isGameLogVisible`: its tab is chosen and `isReferencePanelVisible`).
- The nav rail and `GameBottomNav` share one item look, `NavRailItemView`
  (gradient ring on the selected pill, on the rail's grey.900 surface);
  style nav items there, never per bar.
- The rotating gradient is `GradientRing`: a layer filling its positioned
  parent (optional `ringWidth` masks out the middle) whose centred square
  covers any shape as it turns; `GradientBox` fills a box with it.

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
  card. Dialogs render the recent roll stack through `DialogExtrasContext`
  (from `DialogTitleWithCloseButton`); `useIsActiveRollCardHost` lets only
  the newest place show it.
- Recent rolls (up to `MAX_RECENT_ROLLS`) show as a stack
  (`RollSnackbarSection`): the newest card in full with `clampContent` (long
  results fold behind Show all) and the edges of up to two older cards behind
  it. On phones the edges are empty `aria-hidden` boxes and an "N rolls"
  handle opens `RecentRollsDialog`. That dialog lists every roll, claims the
  roll card host while open and gives its title a null `DialogExtrasContext`,
  so no stack shows over it; Clear all also closes it, and focus falls back
  to the page start (`focusPageStart`) when its opener went with the rolls.
  It renders outside the dock, whose element changes as rolls come and go.
  Wider screens use `ExpandableRollStack` instead: the last three rolls as
  real cards, the older two `aria-hidden` and `inert` behind the newest until
  the pointer is over the stack or focus is inside it, when they rise into
  full cards (transform and opacity only, none under reduced motion, so the
  dock's layout height stays the collapsed one). Its Visit the log button,
  below the stack on the page's own host in a game, selects the Reference
  panel's Game log tab and focuses it (`getReferenceTabId`). The dock sits
  above the phone bottom nav while `isGameBottomNavVisible` (set by
  `GameBottomNav`), at the window's bottom otherwise, and bottom right at
  360px on wider screens (`useRollDockPosition`).
- Snackbars read their message through the live region (dialogs hide the
  snackbar container); the alert itself is not live. Errors persist.
- Filters announce their result count with `useAnnounceSearchResults`.

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

- World paths are built only by `getWorldViewPath` and read only by
  `parseWorldViewPath` (`worldNavigation.ts`); one `/worlds/:worldId/*`
  route renders `WorldPage`, and a path the parser rejects is a 404.
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

## Maps

- An entry's map is a `world_maps` row (grid chosen at creation: `hex_pointy`,
  `hex_flat`, `square` or `none`); painted cells live in 16x16 chunks in
  `world_map_chunks`, keyed "x,y" in the grid's own coordinates (axial for
  hexes). Paint only through `paint_world_map_cells`, which merges cells, never
  by writing a chunk's `cells` whole (clearing to `{}` is the one exception).
- Pins (`world_map_pins`) are child entries at a position in map units (a CSS
  pixel at the default cell size), snapped to a cell when drawn. A pin is only
  readable with its entry, and moving the child elsewhere removes its pin.

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
- On phones (`useIsMobile`) the tab strip is `MobileNoteTabsHeader`: the open
  item's name and a count box opening `OpenNotesSheet` (open items, each with
  a sibling Close button, plus New note and All notes). There a note's
  formatting toolbar shows only while its editor has focus, renders in place
  after the breadcrumbs (`MobileKeyboardToolbar` `inPlace`, so it is read
  before the text) and ends with Done editing, which Escape in the text
  matches; the note's actions menu sits in its breadcrumb strip instead.
- Note and folder RLS follows the app's `getPermissions` (`notes.store.ts`)
  through the `note_permission_allows_read|edit|manage` helpers, and the
  `notes_guard_update`/`note_folders_guard_update` triggers check which columns
  each editor may change. Change both sides together.

## Character sheets

- Sheet edit controls check `useCanEditCharacter` (backed by
  `getCharacterAccess`, which mirrors the database's `can_edit_character()`),
  not ownership. Only Edit access and Delete use `useIsOwnerOfCharacter`.
- Stats and meter values are `RollButton`s (`components/datasworn/RollButton`):
  a dark raised button named for its action ("Roll Edge, +2"), with the
  theme's gradient ring on hover, keyboard focus and briefly after a press.
  The ring is a `GradientRing` outline around the whole button, dark edge
  included, so nothing inside can cover it; a press moves the face down onto
  its edge (transform only). `Stat` and `ConditionMeter` use it, so move roll options
  match the sheet.
- Initiative is the `InitiativeStatusChip` on wide screens and an
  `InitiativeSegmentedControl` radio group at the top of the Overview tab on
  phones; both read their colours from `getInitiativeStatusFill` (Out of
  combat a neutral grey) and their labels from `useInitiativeStatusText`,
  which follows the ruleset.
- A panel's own view switcher (the sheet's Overview, Assets and Tracks) is
  the same centred `StyledTabs` as Moves, Oracles and Log on wide screens. On
  phones, where it stands alone, it passes `size="large"`: the same style,
  with 48px tabs and larger labels filling the width.

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
