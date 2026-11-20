import { createContext } from "react";

/** True inside a `Field`, so a control inside one does not open another. */
export const InFieldContext = createContext(false);
