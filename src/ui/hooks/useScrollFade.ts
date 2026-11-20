import { RefObject, useEffect } from "react";

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
