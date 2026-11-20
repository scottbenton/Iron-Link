import { useContext } from "react";

import { DialogContext } from "./dialogContext";

/** Announces through the open dialog's own live region (the page's is inert). */
export function useDialogAnnounce() {
  return useContext(DialogContext)?.announce;
}
