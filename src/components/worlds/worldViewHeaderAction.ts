import { ReactNode, createContext, useContext } from "react";

// A control the surrounding page puts at the end of a world destination's
// breadcrumb row, such as the Worlds page's Reference toggle when Reference
// has no room to stay open.
export const WorldViewHeaderActionContext = createContext<ReactNode>(null);

export function useWorldViewHeaderAction() {
  return useContext(WorldViewHeaderActionContext);
}
