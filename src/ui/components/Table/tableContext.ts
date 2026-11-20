import { createContext } from "react";

interface TableContextValue {
  density: "comfortable" | "compact";
  stickyHeader: boolean;
}

export const TableContext = createContext<TableContextValue>({
  density: "comfortable",
  stickyHeader: false,
});
