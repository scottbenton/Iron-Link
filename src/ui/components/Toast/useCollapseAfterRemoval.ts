import { useEffect } from "react";

/**
 * Sonner collapses the fanned-out stack when the pointer leaves it, which
 * React reports from the element the pointer was last over. When that
 * element was a toast just dismissed (its close button), it is gone from the
 * page, the browser reports no leave, and the stack stayed fanned out until
 * the pointer went back in and out again. So while the stack is fanned out,
 * a pointer moving outside it reports the leave itself.
 */
export function useCollapseAfterRemoval(ref: { current: HTMLElement | null }) {
  useEffect(() => {
    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      const list = ref.current?.querySelector("[data-sonner-toaster]");
      if (!list || !list.querySelector('[data-expanded="true"]')) return;
      if (event.target instanceof Node && list.contains(event.target)) return;
      list.dispatchEvent(
        new MouseEvent("mouseout", {
          bubbles: true,
          relatedTarget: document.body,
        }),
      );
    };
    document.addEventListener("pointermove", onPointerMove, { passive: true });
    return () => document.removeEventListener("pointermove", onPointerMove);
  }, [ref]);
}
