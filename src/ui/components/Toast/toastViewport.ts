/**
 * Marks the element that holds the toast stack and its Clear All footer.
 * Toasts sit above dialogs and drawers, so a press on one lands outside the
 * open modal; `isPressOnToasts` lets the modal tell that apart.
 */
export const toastViewportAttribute = "data-toast-viewport";

/**
 * Whether a dialog's or drawer's close request is a press on the toasts.
 * Such a press dismisses or acts on a toast and must not close the modal.
 */
export function isPressOnToasts(details: { reason: string; event: Event }) {
  if (details.reason !== "outside-press") return false;
  const target = details.event.target;
  return (
    target instanceof Element &&
    target.closest(`[${toastViewportAttribute}]`) !== null
  );
}
