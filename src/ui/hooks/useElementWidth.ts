import { useCallback, useEffect, useRef, useState } from "react";

/**
 * An element's own content width, kept current with a ResizeObserver, for
 * layouts that follow the room a component has rather than the window (a
 * nav rail or a docked panel takes width from the page alone). Pass the
 * returned ref callback to the element; it works for elements that mount
 * later, such as a dialog's body. Undefined until the element is measured.
 */
export function useElementWidth<T extends HTMLElement = HTMLDivElement>() {
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
