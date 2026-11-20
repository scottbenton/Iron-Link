import { createContext } from "react";

export interface DialogContextValue {
  announce: (message: string) => void;
}
export const DialogContext = createContext<DialogContextValue | null>(null);
