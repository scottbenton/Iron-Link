import { useContext } from "react";

import { InFieldContext } from "./inFieldContext";

/** Whether the caller is inside a `Field` (or `FieldRoot`). */
export function useInField() {
  return useContext(InFieldContext);
}
