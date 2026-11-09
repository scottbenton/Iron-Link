import { useEffect } from "react";

import { useSetAnnouncement } from "stores/appState.store";

// Long enough that a screen reader isn't talked over after every keystroke.
export const SEARCH_RESULTS_ANNOUNCE_DELAY_MS = 1000;

/**
 * Reads how many results a filter shows once typing settles. Nothing is read
 * while the filter is empty. `search` should be the value the results were
 * worked out from (a deferred value), so the message matches it.
 */
export function useAnnounceSearchResults(search: string, message: string) {
  const announce = useSetAnnouncement();
  const isActive = search.trim().length > 0;

  useEffect(() => {
    if (!isActive) return;
    const timeout = setTimeout(
      () => announce(message),
      SEARCH_RESULTS_ANNOUNCE_DELAY_MS,
    );
    return () => clearTimeout(timeout);
  }, [announce, isActive, message, search]);
}
