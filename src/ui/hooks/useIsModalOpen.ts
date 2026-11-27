import { useLayoutEffect, useSyncExternalStore } from "react";

// How many library modals (dialogs, modal drawers) are open right now.
let openModals = 0;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Counts a library modal as open while `open` is true. Dialog and Drawer
 * call it; nothing else should need to.
 */
export function useRegisterOpenModal(open: boolean) {
  useLayoutEffect(() => {
    if (!open) return;
    openModals += 1;
    notify();
    return () => {
      openModals -= 1;
      notify();
    };
  }, [open]);
}

/**
 * Whether a library modal is open. Anything drawn in the page sits under it
 * and is inert, so a part of the page that must stay in view (a phone's
 * docked roll cards) can hand over to the toasts, which sit above modals.
 */
export function useIsModalOpen() {
  return useSyncExternalStore(
    subscribe,
    () => openModals > 0,
    () => false,
  );
}
