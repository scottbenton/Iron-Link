import { createContext } from "react";

import { LiveMessage } from "./useLiveText";

/**
 * The latest announcement, read by every live region: the page's own and the
 * one inside each modal dialog and drawer (a modal makes the page inert, so
 * its region would go unheard). Null until something is announced.
 */
export const AnnouncementContext = createContext<LiveMessage | null>(null);
