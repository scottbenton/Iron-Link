import { PropsWithChildren, useCallback, useRef, useState } from "react";

import { VisuallyHidden } from "../VisuallyHidden";
import { Announce, AnnouncerContext } from "./announcerContext";
import { LiveMessage, useLiveText } from "./useLiveText";

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
