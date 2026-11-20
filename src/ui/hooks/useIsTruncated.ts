import { useLayoutEffect, useState } from "react";

/** Whether the element's text is cut short, kept up to date on resize. */
export function useIsTruncated(elementRef: { current: HTMLElement | null }) {
  const [truncated, setTruncated] = useState(false);
  useLayoutEffect(() => {
    const element = elementRef.current;
    if (!element) return;
    const measure = () =>
      setTruncated(element.scrollWidth > element.clientWidth + 1);
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [elementRef]);
  return truncated;
}
