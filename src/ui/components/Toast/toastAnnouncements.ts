type Listener = (message: string) => void;

let listener: Listener | null = null;
let pending: string | null = null;

/**
 * Hands a toast's announcement to the mounted Toaster, which reads it
 * through `useAnnounce()`. A message sent before the Toaster mounts waits
 * for it.
 */
export function announceToast(message: string) {
  if (listener) listener(message);
  else pending = message;
}

export function subscribeToToastAnnouncements(next: Listener) {
  listener = next;
  if (pending !== null) {
    next(pending);
    pending = null;
  }
  return () => {
    if (listener === next) listener = null;
  };
}
