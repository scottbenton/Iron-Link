import { PropsWithChildren } from "react";

import { Announce, AnnouncerProvider } from "../Announcer";
import { Toaster } from "../Toast";
import { TooltipProvider } from "../Tooltip";

export interface UIProviderProps extends PropsWithChildren {
  /** Route announcements to the app's live region (`useSetAnnouncement`). */
  announce?: Announce;
}

/**
 * Mount once near the root. Shares the tooltip delay, renders the toast
 * viewport and the announcer. Colour mode and scheme are attributes on
 * <html>; set them with applyUITheme.
 */
export function UIProvider(props: UIProviderProps) {
  const { announce, children } = props;
  return (
    <AnnouncerProvider announce={announce}>
      <TooltipProvider delay={500} closeDelay={0}>
        {children}
        <Toaster />
      </TooltipProvider>
    </AnnouncerProvider>
  );
}
