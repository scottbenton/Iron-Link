import { ComponentType, createContext } from "react";

/**
 * What every dialog renders beside its title: things on the page that a
 * screen reader must still reach while a modal dialog hides the page (the
 * recent roll cards). The layout provides it, so dialogs need not import it.
 */
export const DialogExtrasContext = createContext<ComponentType | null>(null);
