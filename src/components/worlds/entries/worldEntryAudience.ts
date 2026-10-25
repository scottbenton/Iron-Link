import { createContext, useContext } from "react";

// Who an entry is drawn for. "reader" is the person viewing it, with their
// own rights. "table" is a shared screen everyone at the table can see (the
// second screen): read-only, and never anything only Guides may see, even
// when a Guide put it there.
export type WorldEntryAudience = "reader" | "table";

export const WorldEntryAudienceContext =
  createContext<WorldEntryAudience>("reader");

export function useWorldEntryAudience(): WorldEntryAudience {
  return useContext(WorldEntryAudienceContext);
}
