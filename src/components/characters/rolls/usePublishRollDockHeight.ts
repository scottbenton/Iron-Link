import { useEffect } from "react";

// The custom property on the root element that holds the roll dock's rendered
// height ("0px" with no rolls), so the snackbars can sit above it.
export const ROLL_DOCK_HEIGHT_PROPERTY = "--roll-dock-height";

/**
 * Publishes `element`'s rendered height as `--roll-dock-height` on the root
 * element while `isPublishing`, following it with a ResizeObserver, and puts
 * it back to 0 when it stops. Only the roll card host showing the stack
 * publishes, so a hidden one never overwrites it.
 */
export function usePublishRollDockHeight(
  element: HTMLElement | null,
  isPublishing: boolean,
) {
  useEffect(() => {
    if (!element || !isPublishing) return;
    const root = document.documentElement;
    const write = () => {
      const height = Math.ceil(element.getBoundingClientRect().height);
      root.style.setProperty(ROLL_DOCK_HEIGHT_PROPERTY, `${height}px`);
    };
    write();
    let observer: ResizeObserver | undefined;
    if (typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(write);
      observer.observe(element);
    }
    return () => {
      observer?.disconnect();
      root.style.setProperty(ROLL_DOCK_HEIGHT_PROPERTY, "0px");
    };
  }, [element, isPublishing]);
}
