import { useEffect, useRef } from "react";
import { useLocation } from "react-router";

import { shouldMoveFocusOnRouteChange } from "lib/routeFocus.lib";

// How long to wait for a page that is still loading to render its h1.
const HEADING_WAIT_MS = 3000;

function findPageHeading(main: HTMLElement) {
  return Array.from(main.querySelectorAll<HTMLElement>("h1")).find(
    (heading) => !heading.closest("[hidden]"),
  );
}

function focusHeading(heading: HTMLElement) {
  if (!heading.hasAttribute("tabindex")) {
    heading.setAttribute("tabindex", "-1");
    // Lets App.css drop the focus ring on a heading that is only focused
    // here, never by Tab.
    heading.setAttribute("data-route-focus", "");
  }
  heading.focus({ preventScroll: true });
}

// Moves focus to the page's h1, or to <main> until the h1 renders, so a
// screen reader reads where it has arrived. Returns a cleanup that stops
// waiting for the h1.
export function focusPageStart(main: HTMLElement): () => void {
  const heading = findPageHeading(main);
  if (heading) {
    focusHeading(heading);
    return () => {};
  }

  main.focus({ preventScroll: true });
  const observer = new MutationObserver(() => {
    // The reader has moved on; leave focus where they put it.
    if (document.activeElement !== main) {
      stop();
      return;
    }
    const found = findPageHeading(main);
    if (found) {
      stop();
      focusHeading(found);
    }
  });
  const timeout = window.setTimeout(() => stop(), HEADING_WAIT_MS);
  function stop() {
    observer.disconnect();
    window.clearTimeout(timeout);
  }
  observer.observe(main, { childList: true, subtree: true });
  return stop;
}

// After client-side navigation (never the first load), moves focus to the
// new page's start: on a new page, or within a page when the control that
// had focus went away. Search and hash changes (open notes, dialogs) are not
// navigation here.
export function useFocusPageOnNavigate(mainId: string) {
  const { pathname } = useLocation();
  const previousPathname = useRef<string | null>(null);

  useEffect(() => {
    const previous = previousPathname.current;
    previousPathname.current = pathname;
    if (previous === null) return;

    const active = document.activeElement;
    const focusLost = !active || active === document.body;
    if (!shouldMoveFocusOnRouteChange(previous, pathname, focusLost)) return;

    const main = document.getElementById(mainId);
    if (!main) return;
    return focusPageStart(main);
  }, [pathname, mainId]);
}
