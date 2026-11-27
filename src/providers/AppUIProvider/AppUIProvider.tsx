import { PropsWithChildren } from "react";

import { DataswornRulesTextProvider } from "components/datasworn/DataswornRulesTextProvider";

import { ConfirmOptions } from "ui/components/ConfirmDialog";
import { UIProvider } from "ui/components/UIProvider";

import {
  useAnnouncement,
  useAnnouncementId,
  useSetAnnouncement,
} from "stores/appState.store";

// Every confirm in the app asks before deleting or removing something, so
// each one is red with Cancel focused first (material-ui-confirm's app
// defaults made every confirm red).
const confirmDefaults: ConfirmOptions = { tone: "danger" };

/**
 * Mounts the UI library on the app's own stores: library announcements go
 * through `useSetAnnouncement`, so the page's region, MUI dialogs' regions
 * and library dialogs' and drawers' regions all read one store. `useConfirm`
 * and snackbars render through the library too. Rules text opens its
 * `datasworn:` links the app's way.
 */
export function AppUIProvider(props: PropsWithChildren) {
  const { children } = props;
  const announce = useSetAnnouncement();
  const message = useAnnouncement();
  const nonce = useAnnouncementId();

  return (
    <UIProvider
      announce={announce}
      message={message}
      nonce={nonce}
      confirmDefaults={confirmDefaults}
    >
      <DataswornRulesTextProvider>{children}</DataswornRulesTextProvider>
    </UIProvider>
  );
}
