import { useLayoutEffect, useState } from "react";

/**
 * Whether focus is inside `ref`'s element. Removing the focused element
 * sends no focusout, so it is also re-read whenever the element's content
 * changes: a toast closed with its own Dismiss button leaves the page only
 * after its exit, well after `recheckKey` (the toast list) has moved on, and
 * until then the stack stayed fanned out.
 */
export function useFocusWithin(
  ref: { current: HTMLElement | null },
  recheckKey: unknown,
) {
  const [focusWithin, setFocusWithin] = useState(false);
  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    const onFocusIn = () => setFocusWithin(true);
    const onFocusOut = (event: FocusEvent) => {
      const next = event.relatedTarget;
      if (next instanceof Node && element.contains(next)) return;
      setFocusWithin(false);
    };
    const observer = new MutationObserver(() => {
      if (!element.contains(document.activeElement)) setFocusWithin(false);
    });
    element.addEventListener("focusin", onFocusIn);
    element.addEventListener("focusout", onFocusOut);
    observer.observe(element, { childList: true, subtree: true });
    return () => {
      element.removeEventListener("focusin", onFocusIn);
      element.removeEventListener("focusout", onFocusOut);
      observer.disconnect();
    };
  }, [ref]);
  useLayoutEffect(() => {
    const element = ref.current;
    setFocusWithin(!!element && element.contains(document.activeElement));
  }, [ref, recheckKey]);
  return focusWithin;
}
