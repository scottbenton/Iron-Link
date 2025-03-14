import { RefObject, createContext, useContext } from "react";

export const DialogContentRefContext = createContext<{
  ref: RefObject<HTMLDivElement> | null;
}>({
  ref: null,
});

export function useDialogPortalRef() {
  return useContext(DialogContentRefContext).ref;
}
