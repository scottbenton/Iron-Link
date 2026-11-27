import { useContext, useLayoutEffect } from "react";

import { ShellFillContext } from "./shellFillContext";

/**
 * Fills the screen with the page while `active`, as a two-column page with
 * its own scrolling columns needs. A layout effect, so the page never paints
 * at the document's height first.
 */
export function useFillShell(active: boolean) {
  const requestFill = useContext(ShellFillContext);
  useLayoutEffect(() => {
    if (!active || !requestFill) return;
    return requestFill();
  }, [active, requestFill]);
}
