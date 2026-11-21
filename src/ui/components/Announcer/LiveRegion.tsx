import { useContext, useMemo } from "react";

import { VisuallyHidden } from "../VisuallyHidden";
import { AnnouncementContext } from "./announcementContext";
import { useLiveText } from "./useLiveText";

export interface LiveRegionProps {
  /**
   * The message to read, or null for none. Leave it out to read the shared
   * announcement store, which is what the page, dialogs and drawers do.
   */
  message?: string | null;
  /** Goes up with every message, so the same words sent twice are read twice. */
  nonce?: number;
  id?: string;
}

/**
 * A polite live region. It starts empty, so one mounted after a message (a
 * dialog opening) does not read it again. The page renders one, and so does
 * every modal dialog and drawer, since a modal makes the page inert.
 */
export function LiveRegion(props: LiveRegionProps) {
  const { message, nonce = 0, id } = props;
  const shared = useContext(AnnouncementContext);
  const own = useMemo(
    () => (message ? { text: message, nonce } : null),
    [message, nonce],
  );
  const text = useLiveText(message === undefined ? shared : own);
  return (
    <VisuallyHidden id={id} role="status" aria-live="polite" aria-atomic="true">
      {text}
    </VisuallyHidden>
  );
}
