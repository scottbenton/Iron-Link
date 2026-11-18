import { RefObject, useEffect, useLayoutEffect } from "react";

import { css } from "styled-system/css";

/**
 * A horizontal strip that scrolls without a scrollbar and fades its edges
 * while there is more to see on that side. Pair it with `useScrollFade`,
 * which writes `data-overflow-start` and `data-overflow-end`.
 */
export const scrollStripStyles = css({
  "--fade-start": "0px",
  "--fade-end": "0px",
  overflowX: "auto",
  overflowY: "hidden",
  scrollbarWidth: "none",
  "&::-webkit-scrollbar": { display: "none" },
  maskImage:
    "linear-gradient(to right, transparent 0, black var(--fade-start), black calc(100% - var(--fade-end)), transparent 100%)",
  "&[data-overflow-start]": { "--fade-start": "24px" },
  "&[data-overflow-end]": { "--fade-end": "24px" },
});

/** Keeps a strip's overflow attributes current as it scrolls and resizes. */
export function useScrollFade(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const update = () => {
      const max = element.scrollWidth - element.clientWidth;
      const scrolled = Math.abs(element.scrollLeft);
      element.toggleAttribute("data-overflow-start", scrolled > 1);
      element.toggleAttribute("data-overflow-end", max - scrolled > 1);
    };
    update();

    element.addEventListener("scroll", update, { passive: true });
    const resizeObserver =
      typeof ResizeObserver === "undefined" ? null : new ResizeObserver(update);
    resizeObserver?.observe(element);
    // Tabs coming and going, or being renamed, change the content width.
    const mutationObserver =
      typeof MutationObserver === "undefined"
        ? null
        : new MutationObserver(update);
    mutationObserver?.observe(element, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    return () => {
      element.removeEventListener("scroll", update);
      resizeObserver?.disconnect();
      mutationObserver?.disconnect();
    };
  }, [ref]);
}

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
