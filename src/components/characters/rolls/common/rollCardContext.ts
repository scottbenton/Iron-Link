import { createContext } from "react";

export interface RollCardContextValue {
  // The card has a dismiss button in its top corner, which the title makes
  // room for.
  hasDismissButton: boolean;
}

export const RollCardContext = createContext<RollCardContextValue>({
  hasDismissButton: false,
});
