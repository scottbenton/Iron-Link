import { useLayoutEffect, useRef } from "react";

/** Marks the strip's edges that have more of the row beyond them. */
export function useActionToolbarScrollFade(enabled: boolean) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const scroller = scrollerRef.current;
    const row = rowRef.current;
    if (!enabled || !scroller || !row) return;

    const update = () => {
      // Within a pixel of an edge counts as at it: scroll positions can be
      // fractional while widths are whole. abs() covers right-to-left.
      const scrollStart = Math.abs(scroller.scrollLeft);
      const hasStart = scrollStart > 1;
      const hasEnd =
        scrollStart + scroller.clientWidth < scroller.scrollWidth - 1;
      scroller.toggleAttribute("data-fade-start", hasStart);
      scroller.toggleAttribute("data-fade-end", hasEnd);
    };

    update();
    scroller.addEventListener("scroll", update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(scroller);
    observer.observe(row);
    return () => {
      scroller.removeEventListener("scroll", update);
      observer.disconnect();
      scroller.removeAttribute("data-fade-start");
      scroller.removeAttribute("data-fade-end");
    };
  }, [enabled]);

  return { scrollerRef, rowRef };
}
