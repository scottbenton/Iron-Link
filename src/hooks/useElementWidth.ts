import { useCallback, useEffect, useRef, useState } from "react";

// The element's own content width, kept up to date with a ResizeObserver, for
// layouts that depend on the room a page has rather than on the window (a nav
// rail or a docked panel takes width from the page alone). Undefined until the
// element is measured.
export function useElementWidth<T extends HTMLElement>() {
  const [width, setWidth] = useState<number>();
  const observer = useRef<ResizeObserver | null>(null);

  const ref = useCallback((element: T | null) => {
    observer.current?.disconnect();
    observer.current = null;
    if (!element) return;
    setWidth(element.getBoundingClientRect().width);
    if (typeof ResizeObserver === "undefined") return;
    observer.current = new ResizeObserver((entries) => {
      const entry = entries[entries.length - 1];
      if (entry) setWidth(entry.contentRect.width);
    });
    observer.current.observe(element);
  }, []);

  useEffect(() => () => observer.current?.disconnect(), []);

  return [ref, width] as const;
}
