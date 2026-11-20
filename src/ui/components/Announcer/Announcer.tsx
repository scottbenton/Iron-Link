import {
  PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { VisuallyHidden } from "../VisuallyHidden";

export type Announce = (message: string) => void;

const AnnouncerContext = createContext<Announce | null>(null);

// How long a live region stays empty between two messages. Screen readers
// only read a live region when its text changes, so a message that repeats
// the last one is cleared and written again after this pause.
const CLEAR_DELAY_MS = 100;

interface LiveMessage {
  text: string;
  /** Goes up with every message, so a repeat is still read. */
  nonce: number;
}

/**
 * The text a live region should hold. It starts empty, so a region mounted
 * after a message (a dialog opening) does not read that message again, and
 * it is cleared and rewritten for every new message, repeats included.
 * Ported from Iron Link's `useLiveRegionText`.
 */
function useLiveText(message: LiveMessage | null) {
  const [text, setText] = useState("");
  const mountedNonce = useRef(message?.nonce);
  useEffect(() => {
    if (!message || message.nonce === mountedNonce.current) return;
    setText("");
    const timeout = setTimeout(() => setText(message.text), CLEAR_DELAY_MS);
    return () => clearTimeout(timeout);
  }, [message]);
  return text;
}

export interface AnnouncerProviderProps extends PropsWithChildren {
  /**
   * Hand announcements to the app's own store (Iron Link's
   * `useSetAnnouncement`), which feeds a `LiveRegion`. Without one the
   * provider renders its own region.
   */
  announce?: Announce;
}

/**
 * One polite live region for the library. Toasts and roll results announce
 * through it, one message per action: a second message in the same tick
 * replaces the first.
 */
export function AnnouncerProvider(props: AnnouncerProviderProps) {
  const { announce: externalAnnounce, children } = props;
  const [message, setMessage] = useState<LiveMessage | null>(null);
  const nonce = useRef(0);

  const internalAnnounce = useCallback<Announce>((text) => {
    nonce.current += 1;
    setMessage({ text, nonce: nonce.current });
  }, []);

  const announce = externalAnnounce ?? internalAnnounce;
  const text = useLiveText(externalAnnounce ? null : message);

  return (
    <AnnouncerContext.Provider value={announce}>
      {children}
      {!externalAnnounce && (
        <VisuallyHidden role="status" aria-live="polite" aria-atomic="true">
          {text}
        </VisuallyHidden>
      )}
    </AnnouncerContext.Provider>
  );
}

/** Announces a message to screen readers. */
export function useAnnounce(): Announce {
  const announce = useContext(AnnouncerContext);
  return useMemo(
    () =>
      announce ??
      ((message: string) => {
        if (import.meta.env.DEV) {
          console.warn("useAnnounce called outside UIProvider:", message);
        }
      }),
    [announce],
  );
}

export interface LiveRegionProps {
  /** The message to read, or null for none. */
  message: string | null;
  /**
   * Goes up with every message, so the same words sent twice are read twice
   * (Iron Link's `useAnnouncementId`).
   */
  nonce?: number;
  id?: string;
}

/**
 * A live region fed by a message and its count. Dialogs render one, since a
 * modal dialog makes everything outside it inert, and so can the app, from
 * its own announcement store:
 * `<LiveRegion message={useAnnouncement()} nonce={useAnnouncementId()} />`.
 */
export function LiveRegion(props: LiveRegionProps) {
  const { message, nonce = 0, id } = props;
  const value = useMemo(
    () => (message ? { text: message, nonce } : null),
    [message, nonce],
  );
  const text = useLiveText(value);
  return (
    <VisuallyHidden id={id} role="status" aria-live="polite" aria-atomic="true">
      {text}
    </VisuallyHidden>
  );
}
