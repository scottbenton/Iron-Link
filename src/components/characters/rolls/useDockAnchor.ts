import { CSSProperties, RefObject, useLayoutEffect, useState } from "react";

/** The gap between the dock and the box it sits above, and to each side. */
const GAP = 12;
const INSET = 16;

/**
 * Where the docked rolls go: fixed just above the positioned box `anchor`
 * sits in (the bottom nav's), 16px in from each side. Read as custom
 * properties for the dock's own styles. `undefined` until measured.
 */
export function useDockAnchor(
  anchor: RefObject<HTMLElement | null>,
): CSSProperties | undefined {
  const [position, setPosition] = useState<CSSProperties>();

  useLayoutEffect(() => {
    const box = anchor.current?.parentElement;
    if (!box) return;
    const measure = () => {
      const rect = box.getBoundingClientRect();
      const viewport = document.documentElement;
      setPosition({
        "--dock-left": `${rect.left + INSET}px`,
        "--dock-right": `${viewport.clientWidth - rect.right + INSET}px`,
        "--dock-bottom": `${viewport.clientHeight - rect.top + GAP}px`,
      } as CSSProperties);
    };
    measure();
    window.addEventListener("resize", measure);
    window.visualViewport?.addEventListener("resize", measure);
    const observer =
      typeof ResizeObserver === "undefined"
        ? undefined
        : new ResizeObserver(measure);
    observer?.observe(box);
    return () => {
      window.removeEventListener("resize", measure);
      window.visualViewport?.removeEventListener("resize", measure);
      observer?.disconnect();
    };
  }, [anchor]);

  return position;
}
