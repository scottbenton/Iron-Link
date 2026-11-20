import { css } from "styled-system/css";

/**
 * The layout reads its width from the app shell, a size container named
 * `shell`, not from the window: on the page the two are the same width, and
 * in a story or a docs page a narrow frame shows the phone layout.
 *
 * Panda cannot take these keys from a constant, so components write them out:
 * - wide: `@container shell (min-width: 600px)` (sm, the rail and sidebars)
 * - phone: `@container shell (max-width: 599.98px)` (the bottom bar, tabs)
 * - md: `@container shell (min-width: 900px)` (wider page insets)
 *
 * The 600px edge is the library's `useIsMobile()` (smaller than sm), so a
 * component that takes a `compact` prop agrees with the shell around it.
 */
export const SHELL_CONTAINER_NAME = "shell";

/** The id of `<main>`, which the skip link and route focus move to. */
export const MAIN_CONTENT_ID = "main-content";

/**
 * Makes an element the `shell` container. AppShell has it; use it to frame
 * a layout component on its own, such as a NavBar in a story.
 */
export const shellContainer = css({
  containerType: "inline-size",
  containerName: "shell",
});

/** A page's side inset: 16px on phones, 24px from 600px, 32px from 900px. */
export const pageInset = css({
  paddingInline: "4",
  "@container shell (min-width: 600px)": { paddingInline: "6" },
  "@container shell (min-width: 900px)": { paddingInline: "8" },
});

/** Shown only on phones (below 600px of shell). */
export const phoneOnly = css({
  "@container shell (min-width: 600px)": { display: "none!" },
});

/** Shown only on wide screens (600px of shell and up). */
export const wideOnly = css({
  "@container shell (max-width: 599.98px)": { display: "none!" },
});
