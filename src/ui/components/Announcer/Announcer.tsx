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

/** Text for a live region that a screen reader reads again when it repeats. */
function useLiveText(message: { text: string; nonce: number } | null) {
  const [text, setText] = useState("");
  useEffect(() => {
    if (!message) return;
    // Clear, then write on the next frame, so the same words are read twice.
    setText("");
    const frame = requestAnimationFrame(() => setText(message.text));
    return () => cancelAnimationFrame(frame);
  }, [message]);
  return text;
}

export interface AnnouncerProviderProps extends PropsWithChildren {
  /**
   * Hand announcements to the app's own live region (Iron Link's
   * `useSetAnnouncement`). Without one the provider renders its own.
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
  const [message, setMessage] = useState<{
    text: string;
    nonce: number;
  } | null>(null);
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

/**
 * A live region of its own, for places that hide the page's region (a modal
 * dialog makes everything outside it inert). Dialog renders one.
 */
export function LiveRegion(props: { message: string | null; nonce?: number }) {
  const { message, nonce = 0 } = props;
  const value = useMemo(
    () => (message ? { text: message, nonce } : null),
    [message, nonce],
  );
  const text = useLiveText(value);
  return (
    <VisuallyHidden role="status" aria-live="polite" aria-atomic="true">
      {text}
    </VisuallyHidden>
  );
}
