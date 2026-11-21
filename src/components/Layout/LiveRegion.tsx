import { LiveRegion as UILiveRegion } from "ui/components/Announcer";

import { useAnnouncement, useAnnouncementId } from "stores/appState.store";

export interface LiveRegionProps {
  id?: string;
}

/**
 * Reads announcements (roll and oracle results, track changes) to screen
 * readers, straight from the app's announcement store. A modal dialog hides
 * the rest of the page from them, this region included, so dialogs render
 * one of their own; library dialogs and drawers read the same store through
 * `AppUIProvider`.
 */
export function LiveRegion(props: LiveRegionProps) {
  const { id } = props;
  const message = useAnnouncement();
  const nonce = useAnnouncementId();

  return <UILiveRegion id={id} message={message} nonce={nonce} />;
}
