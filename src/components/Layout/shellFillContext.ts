import { createContext } from "react";

/**
 * Lets a page ask the app shell to fill the screen exactly, so its own
 * regions scroll rather than the document. The layout provides it; pages
 * ask through `useFillShell`. Calling it returns the function that ends the
 * request.
 */
export const ShellFillContext = createContext<(() => () => void) | null>(null);
