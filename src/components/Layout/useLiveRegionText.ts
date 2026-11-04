import { useEffect, useRef, useState } from "react";

import { useAnnouncement, useAnnouncementId } from "stores/appState.store";

// How long a live region stays empty between two messages. Screen readers only
// read a live region when its text changes, so a message that repeats the last
// one has to be cleared and written again.
const CLEAR_DELAY_MS = 100;

/**
 * The text a live region should hold. It starts empty, so a region mounted
 * after an announcement (a dialog opening) does not read it again, and it is
 * cleared and rewritten for every announcement, including a repeat.
 */
export function useLiveRegionText(): string | undefined {
  const announcement = useAnnouncement();
  const announcementId = useAnnouncementId();

  const [text, setText] = useState<string>();
  const mountedIdRef = useRef(announcementId);

  useEffect(() => {
    if (announcementId === mountedIdRef.current) {
      return;
    }
    setText(undefined);
    const timeout = setTimeout(
      () => setText(announcement ?? undefined),
      CLEAR_DELAY_MS,
    );
    return () => clearTimeout(timeout);
  }, [announcement, announcementId]);

  return text;
}
