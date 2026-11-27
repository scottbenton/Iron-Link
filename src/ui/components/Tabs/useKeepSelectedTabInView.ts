import { RefObject, useEffect } from "react";

import { scrollChildIntoView } from "../../hooks/useScrollSelectedIntoView";

/**
 * Scrolls a tab strip to its selected tab whenever the selection changes,
 * however it changed (a click, the keyboard, or the value set from outside).
 */
export function useKeepSelectedTabInView(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const strip = ref.current;
    if (!strip) return;
    const reveal = (smooth: boolean) => {
      const tab = strip.querySelector<HTMLElement>(
        "[role=tab][aria-selected=true]",
      );
      if (tab) scrollChildIntoView(strip, tab, smooth);
    };
    reveal(false);
    if (typeof MutationObserver === "undefined") return;
    const observer = new MutationObserver((records) => {
      if (
        records.some(
          (record) =>
            (record.target as HTMLElement).getAttribute?.("aria-selected") ===
            "true",
        )
      ) {
        reveal(true);
      }
    });
    observer.observe(strip, {
      subtree: true,
      attributes: true,
      attributeFilter: ["aria-selected"],
    });
    return () => observer.disconnect();
  }, [ref]);
}
