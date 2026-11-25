# Iron Link

Rules for anyone, person or agent, changing this repo (`CLAUDE.md` is a
symlink here). `CONTRIBUTING.md` covers setup, data flow and folder layout.

## Adding to this file

Every agent session reads all of this, so keep it short. Add a line only for
a rule that passes all three tests:

- Ignoring it would plausibly cause a bug, a security hole, a failed CI run
  or a broken convention.
- The code, types, tests or file names don't already make it obvious.
- It applies beyond the one feature it was written for.

Don't describe the feature you just built. Prefer enforcing a rule (lint,
test, type), and put a rule that matters to one file in a comment there. If
your change makes a line here wrong, fix or delete it in the same PR. Keep
the file under 150 lines; to add one past that, cut a weaker one.

## Checks

- Type-check `npx tsc -b`, lint `npx eslint .`, format
  `npx prettier --check .` (`npm run format` fixes both), unit tests
  `npm test`, database tests `npm run test:db` (pgTAP in `supabase/tests/`).
- Suites that import the Supabase client need `VITE_SUPABASE_URL` and
  `VITE_SUPABASE_ANON_KEY` set; a gitignored `.env.local` with placeholder
  values is enough.
- CI (`.github/workflows/ci.yaml`) runs those checks, then deploys to
  Cloudflare Pages; Cloudflare's Git builds are off and build variables live
  in GitHub environments.
- After changing a world template migration, run
  `npm run generate:world-defaults`, then `generate:bundled-game-icons`.

## Permissions and data

- Clients never add other people to a game; everyone but its creator joins
  through the `add-player-to-game-invite` edge function.
- Only a Guide changes roles or `game_type`. The triggers that enforce this
  stand aside for roles that bypass RLS, so a SECURITY DEFINER function that
  writes `game_players` or `games` must check authorization itself.
- Note and folder RLS mirrors `getPermissions` (`notes.store.ts`), and
  `can_edit_character()` mirrors `getCharacterAccess`. Change both sides
  together. Sheet edit controls check `useCanEditCharacter`, not ownership.
- World entries are Guide prep (`only_guides`) or shared (`all_players`);
  only Guides choose, and a trigger refuses anyone else's change.
  Guide-only controls show only in guided worlds (`useWorldIsGuided`).
- Guides may not update `worlds`, so world Notes save through the
  `update_world_notes_if_unchanged` RPC. Guide-only truth quest starters are
  written only through `set_world_custom_truth`.
- PostgREST's upsert sets every column it was sent, the conflict key too, so
  a client-upserted table needs UPDATE on its key columns. Keep a key fixed
  with a trigger (`world_truths_keep_key`), not by withholding the grant.
- Non-customized worlds read `world_templates` live, so a template migration
  reaches them at once. Inherited field IDs are UUIDv5 of the field's key, so
  renaming a key moves inherited values to the new ID in the same migration,
  before the template update.

## Rich text

- Live editing rooms are locked by room keys: give `RtcRichTextEditor` a
  `roomKeySource`, and never use an id as a room password.
- Saves merge rather than overwrite (`saveMergedRichText`, guarded by the
  row's `updated_at`), so a new rich text column needs a versioned row and a
  `RichTextContentStore`.
- Guide-only secrets never go in a document players can read: they live in
  `rich_text_secrets` and the private `guide_images` bucket, and a
  `guide-image:` src never enters shared text.
- Controls inside a Tiptap node view are `<button>`s, because Tiptap stops a
  button's events from reaching ProseMirror. Pass the editor a stable
  `Toolbar` component; one made each render remounts and swallows clicks.

## Routing and pages

- World paths are built only by `getWorldViewPath` and read only by
  `parseWorldViewPath`.
- `/reference` is open to signed out visitors (`openPathPrefixes`). It loads
  bundled rules packages only, never the database, and saves nothing.
  Reference URLs are Datasworn ids, so a renamed id breaks old links.
- Error boundaries render nothing while `isStaleChunkReloadPending()`
  (a reload after a deploy). Never match chunk-error message text.

## UI conventions

- No ellipsis ("…" or "...") at the end of a menu item or button label,
  including in-progress states ("Creating World"). A loading status that
  isn't a control may keep one.
- Checkboxes, never switches, for on/off settings in forms.
- Inputs with a submit button are a real form, so Enter submits: a dialog
  passes `getDialogFormSlotProps(onSubmit)` (`lib/dialogForm.lib.ts`) to
  `slotProps`, its main button is `type="submit"`, and the handler ignores a
  submit while one is in flight.
- Screen width decides layout (`useIsBreakpoint`, `useIsMobile`); never call
  `useMediaQuery` with a breakpoint by hand. Touch decides control size
  (44px targets) and gestures: `useIsTouchDevice`.
- Rules wording follows the game: Ironsworn says Debilities, the others
  Impacts; tracks are Legacy Tracks when every track is a legacy.
- World entry field editors save through `useWorldFieldDraft`.

## Accessibility

- Announce through `useSetAnnouncement`, one message per action: a second
  call in the same tick replaces the first. Rolls announce
  `getRollAnnouncement`; a caller with more to say rolls with
  `{ announce: false }` and folds `getRollSummary` into its own message.
- One h1 per page, and headings nest by section. Typography's `variant` sets
  the look and `component` the element, so a label that only looks like a
  heading (track titles, empty states, anything in a button) takes a
  non-heading `component`. World headings read their element from
  `useHeadingComponent(level)`.
- Pages name the browser tab with `useDocumentTitle`. Filters announce
  their result count with `useAnnounceSearchResults`.
- Sortable lists pass dnd-kit `accessibility` announcements that use item
  names; the defaults read ids.
