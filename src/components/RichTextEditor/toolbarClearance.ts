import { createContext, useContext, useEffect } from "react";

// Given by the editor to its toolbar: tells the editor how many pixels at the
// bottom of the window a phone toolbar covers (the bar and the keyboard under
// it), so the editor keeps its caret and its last line clear of them.
export const ToolbarClearanceContext = createContext<
  (clearance: number) => void
>(() => {});

// Reports `clearance` to the editor whose toolbar this is, and 0 once the
// caller unmounts.
export function useReportToolbarClearance(clearance: number) {
  const setClearance = useContext(ToolbarClearanceContext);
  useEffect(() => {
    setClearance(clearance);
  }, [setClearance, clearance]);
  useEffect(() => () => setClearance(0), [setClearance]);
}
