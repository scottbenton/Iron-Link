import { useAnnouncement } from "@/stores/appState.store";
import { VisuallyHidden } from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";

export function LiveRegion() {
  const announcement = useAnnouncement();

  const [changedAnnouncement, setChangedAnnouncement] = useState<
    string | undefined
  >();
  const isFirstLoadRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (isFirstLoadRef.current === undefined) {
      isFirstLoadRef.current = announcement ?? "";
    }
    if (isFirstLoadRef.current !== announcement) {
      setChangedAnnouncement(announcement ?? undefined);
      if (import.meta.env.DEV) {
        console.log("-- Screen Reader Announcement --");
        console.log(announcement);
      }
    }
  }, [announcement]);

  return (
    <VisuallyHidden id={"dialog-live-region"} aria-live="polite">
      {changedAnnouncement}
    </VisuallyHidden>
  );
}
