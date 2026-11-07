import { createContext, useContext } from "react";

import { useOpenDataswornDialog } from "stores/appState.store";

export type DataswornLinkHandler = (id: string) => void;

export const DataswornLinkHandlerContext = createContext<
  DataswornLinkHandler | undefined
>(undefined);

// What a Datasworn link in rules text opens: the page's own handler when a
// DataswornLinkHandlerProvider gives one, otherwise the Datasworn dialog.
export function useDataswornLinkHandler(): DataswornLinkHandler {
  const handler = useContext(DataswornLinkHandlerContext);
  const openDialog = useOpenDataswornDialog();
  return handler ?? openDialog;
}
