import { useContext, useMemo } from "react";

import { Announce, AnnouncerContext } from "./announcerContext";

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
