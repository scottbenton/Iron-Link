import { useMemo } from "react";

import { VisuallyHidden } from "../VisuallyHidden";
import { useLiveText } from "./useLiveText";

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
