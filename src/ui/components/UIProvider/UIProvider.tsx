import { PropsWithChildren } from "react";

import { Announce, AnnouncerProvider } from "../Announcer";
import { ConfirmProvider } from "../ConfirmDialog";
import { Toaster } from "../Toast";
import { TooltipProvider } from "../Tooltip";

export interface UIProviderProps extends PropsWithChildren {
  /**
   * Route announcements to the app's own store (`useSetAnnouncement`), with
   * its latest `message` and `nonce`, so dialog and drawer regions read it.
   */
  announce?: Announce;
  message?: string | null;
  nonce?: number;
}

/**
 * Mount once near the root. Shares the tooltip delay, renders the toast
 * viewport, the announcer and the dialog behind `useConfirm()`. Colour
 * mode and scheme are attributes on <html>; set them with applyUITheme.
 */
export function UIProvider(props: UIProviderProps) {
  const { announce, message, nonce, children } = props;
  return (
    <AnnouncerProvider announce={announce} message={message} nonce={nonce}>
      <TooltipProvider delay={500} closeDelay={0}>
        <ConfirmProvider>{children}</ConfirmProvider>
        <Toaster />
      </TooltipProvider>
    </AnnouncerProvider>
  );
}
