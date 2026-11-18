# Iron Link UI library

The redesign's component library: Base UI for behaviour, Panda CSS for
styles, Sonner for toasts, Phosphor for icons. It lives beside MUI while
screens move over one at a time, so Panda's preflight is off and nothing here
styles bare elements.

Run `npm run storybook` to browse it. `npm run prepare` (also run by
`npm install`) generates `src/styled-system`, which is gitignored.

## Layout

```
src/ui/
  theme/        tokens, colour schemes, applyUITheme
  styles/       the entry stylesheet (import once)
  primitives/   layout: Box, Stack, HStack, Flex, Grid, Container, ...
  components/   general components (Button, Dialog, Menu, Field, Tabs, ...)
  game/         Iron Link's own pieces (stats, tracks, rolls, assets, ...)
  layout/       app chrome (nav bar, rail, sidebar, page header, ...)
  docs/         Storybook pages (MDX)
  stories/      shared story fixtures (Datasworn data, sample characters)
```

Each component is a folder: `Name/Name.tsx`, `Name/Name.stories.tsx`,
`Name/index.ts` re-exporting it. Import as `ui/components/Button`.

## Styling

- Style with `css()`, `cva()` or `sva()` from `styled-system/css`, and merge
  a caller's `className` with `cx`. Every component takes `className`.
- Screens and stories lay out with `ui/primitives` (`Box`, `Stack`,
  `HStack`, `VStack`, `Flex`, `Grid`, `GridItem`, `Container`, `Center`,
  `Spacer`), which take style props. They replace MUI's `Box`, `Stack`,
  `Grid` and `Container`.
- Code outside `src/ui` never imports Panda (`styled-system/*`); ESLint
  refuses it. That keeps the styling system replaceable inside `src/ui`.
- Panda reads style props only from `ui/primitives` and
  `styled-system/jsx`, by name, at build time. Import primitives under their
  own names, and give style props literal values (a ternary of literals is
  fine): a value computed at runtime has no CSS behind it.
- Use tokens, never raw values: `bg.surface`, `fg.muted`, `border.default`,
  `accent.solid`, `radii md`, `spacing 4`. The token list is
  `theme/tokens.ts`; the Foundations pages show them. Do not edit
  `panda.config.ts` or `theme/` from a component; say what you need instead.
- Inside a CSS value use `token(colors.border.subtle)`; for a custom
  property's value use `{colors.bg.surface}`.
- Gradients are not colours: write `background: "token(gradients.ring)"`.
  A bare `background: "gradients.ring"` compiles to invalid CSS with no
  error, and the browser drops it.
- Never override a property by merging two classes that both set it
  (`cx(base, override)`): Panda's stylesheet order decides which wins, not
  the order in `cx`. Use a `cva` variant or compound variant instead.
- Conditions: `_hover`, `_focusVisible`, `_pressed` (`:active` or
  `[data-pressed]`), `_dark`, `_open`, `_current` (aria-current, selected),
  `_disabled`, `_startingStyle`/`_endingStyle` (Base UI transitions),
  `_hoverable` (`@media (hover: hover)`), `_touch` (`pointer: coarse`),
  `_reducedMotion`, breakpoints `sm` 600, `md` 900, `lg` 1200 and `smDown` etc.

## The look: tactile flat

- Two separate signals. A ledge (a solid bottom edge drawn with
  `box-shadow: 0 var(--border-widths-ledge) 0 <edge colour>`) means you can
  press it: buttons, chips, selectable cards stand on a 2px ledge. A shadow
  means it floats above the page, and its depth says how high: menus,
  popovers, select lists and toasts use `shadows.popover`, dialogs the
  deeper `shadows.dialog`. Floating things get a 1px border and a shadow,
  never a ledge. Static cards, alerts and panels are flat. Drawers fixed to
  a screen edge use `shadows.float`.
- A press sinks the element `var(--spacing-sink)` (1px) onto its ledge over
  `durations.instant`. Hover changes colour only (`--spacing-lift` is 0
  unless the page opts in). Reduced motion zeroes both.
- Things without a ledge (tabs, menu items, toolbar buttons, list rows) never
  move; they answer press with `overlay.pressed`.
- Fields are inset: `bg.field` with `shadows.field`, a 1px
  `border.control` border, accent border and focus ring on focus.
- The gradient ring (`gradients.ring`) marks roll and oracle buttons and the
  current page tab. Stat cards show it only on hover, press and keyboard
  focus (see `game/StatCard`).
- Motion: CSS transitions for hover and press; Base UI's
  `data-starting-style`/`data-ending-style` for enter and exit. Enter with
  `easings.out` over `durations.normal`, exit faster with `easings.in`.
  Every movement respects reduced motion.
- Radii: controls `md` (8px), cards `lg` (12px), dialogs `xl` (16px), chips
  `full`. Touch targets are 44px under `_touch`.
- Type: `fonts.heading` (condensed) for titles, labels and numbers;
  `fonts.body` for everything else. Use `Text` with a `variant`; `as` picks
  the element separately.

## Iron Link conventions (from CLAUDE.md)

- No ellipsis at the end of a button or menu item label, loading states
  included ("Creating World").
- Checkboxes, never switches, for on/off settings in forms.
- A dialog with inputs and a submit button is a form, so Enter submits:
  pass `onSubmit` to `Dialog` and give the main button `type="submit"`.
- Announcements go through `useAnnounce()`; one message per action. A modal
  dialog makes the page inert, so `Dialog` renders its own live region and
  `useDialogAnnounce()` reaches it.
- One h1 per page and headings nest; a label that only looks like a heading
  keeps a non-heading element (`<Text variant="h3" as="span">`).
- Roll cards dismiss only through their named button, never a tap on the
  card. Error toasts persist; in this library no toast dismisses itself.
- Icon-only buttons are `IconButton` with a `label` (its name and tooltip).
- Components never call services; data comes in through props and hooks
  outside the library. Nothing in `src/ui` imports from the app.
- Strings in components are props with English defaults, so the app can pass
  translated text.

## Stories

- Every component gets stories: a playground with controls, then one story
  per meaningful state. Use real Iron Link content (Datasworn moves, assets,
  oracles from `stories/fixtures`), not lorem ipsum.
- Check stories in light and dark mode and a few colour schemes from the
  toolbar, and keep the a11y panel clean.
