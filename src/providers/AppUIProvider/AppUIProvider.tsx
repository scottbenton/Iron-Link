import { PropsWithChildren } from "react";

import { UIProvider } from "ui/components/UIProvider";

import {
  useAnnouncement,
  useAnnouncementId,
  useSetAnnouncement,
} from "stores/appState.store";

/**
 * Mounts the UI library on the app's own stores: library announcements go
 * through `useSetAnnouncement`, so the page's region, MUI dialogs' regions
 * and library dialogs' and drawers' regions all read one store.
 */
export function AppUIProvider(props: PropsWithChildren) {
  const { children } = props;
  const announce = useSetAnnouncement();
  const message = useAnnouncement();
  const nonce = useAnnouncementId();

  return (
    <UIProvider announce={announce} message={message} nonce={nonce}>
      {children}
    </UIProvider>
  );
}
