import { useSyncExternalStore } from "react";

/** Matches the `smDown` condition (below the 600px `sm` breakpoint). */
const PHONE_QUERY = "(max-width: 599.98px)";

function subscribe(onChange: () => void) {
  if (typeof window === "undefined" || !window.matchMedia) return () => {};
  const query = window.matchMedia(PHONE_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function getSnapshot() {
  return typeof window !== "undefined" && !!window.matchMedia
    ? window.matchMedia(PHONE_QUERY).matches
    : false;
}

/**
 * Whether the screen is phone width. The drawer needs it in JavaScript as
 * well as CSS, because the swipe direction that dismisses it is a prop.
 */
export function useIsPhone() {
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
