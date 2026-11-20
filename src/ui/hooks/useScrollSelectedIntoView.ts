import { RefObject, useLayoutEffect } from "react";

/**
 * Scrolls a strip so `child` is fully in view, without scrolling the page
 * (unlike `scrollIntoView`). Leaves room for the faded edge.
 */
export function scrollChildIntoView(
  strip: HTMLElement,
  child: HTMLElement,
  smooth: boolean,
) {
  const margin = 24;
  const stripRect = strip.getBoundingClientRect();
  const childRect = child.getBoundingClientRect();
  let delta = 0;
  if (childRect.left < stripRect.left + margin) {
    delta = childRect.left - stripRect.left - margin;
  } else if (childRect.right > stripRect.right - margin) {
    delta = childRect.right - stripRect.right + margin;
  }
  if (delta === 0) return;
  const reduceMotion =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  strip.scrollBy({
    left: delta,
    behavior: smooth && !reduceMotion ? "smooth" : "auto",
  });
}

/**
 * Scrolls the strip to the element that matches `selector` whenever `key`
 * changes: the current page tab or the open note.
 */
export function useScrollSelectedIntoView(
  ref: RefObject<HTMLElement | null>,
  selector: string,
  key: unknown,
) {
  useLayoutEffect(() => {
    const strip = ref.current;
    const child = strip?.querySelector<HTMLElement>(selector);
    if (strip && child) scrollChildIntoView(strip, child, true);
  }, [ref, selector, key]);
}
