import {
  PropsWithChildren,
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";

import { LiveRegion } from "./LiveRegion";
import { AnnouncementContext } from "./announcementContext";
import { Announce, AnnouncerContext } from "./announcerContext";
import { LiveMessage } from "./useLiveText";

export interface AnnouncerProviderProps extends PropsWithChildren {
  /**
   * Hand announcements to the app's own store (Iron Link's
   * `useSetAnnouncement`). Pass the store's latest `message` and `nonce`
   * with it, so dialog and drawer regions read the same store. Without
   * one the provider keeps its own and renders the page's region itself.
   */
  announce?: Announce;
  /** The store's latest announcement (`useAnnouncement()`). */
  message?: string | null;
  /** Goes up with every announcement (`useAnnouncementId()`). */
  nonce?: number;
}

/**
 * One announcement store for the library. Toasts and roll results announce
 * through it, one message per action: a second message in the same tick
 * replaces the first. Every live region reads it.
 */
export function AnnouncerProvider(props: AnnouncerProviderProps) {
  const {
    announce: externalAnnounce,
    message: externalMessage,
    nonce: externalNonce = 0,
    children,
  } = props;
  const [internalMessage, setInternalMessage] = useState<LiveMessage | null>(
    null,
  );
  const nonce = useRef(0);

  const internalAnnounce = useCallback<Announce>((text) => {
    nonce.current += 1;
    setInternalMessage({ text, nonce: nonce.current });
  }, []);

  const external = !!externalAnnounce;
  const message = useMemo<LiveMessage | null>(
    () =>
      external
        ? externalMessage
          ? { text: externalMessage, nonce: externalNonce }
          : null
        : internalMessage,
    [external, externalMessage, externalNonce, internalMessage],
  );

  return (
    <AnnouncerContext.Provider value={externalAnnounce ?? internalAnnounce}>
      <AnnouncementContext.Provider value={message}>
        {children}
        {!external && <LiveRegion />}
      </AnnouncementContext.Provider>
    </AnnouncerContext.Provider>
  );
}
