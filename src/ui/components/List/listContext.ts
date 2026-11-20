import { createContext } from "react";

interface ListContextValue {
  dense: boolean;
  inset: boolean;
}

export const ListContext = createContext<ListContextValue>({
  dense: false,
  inset: false,
});
