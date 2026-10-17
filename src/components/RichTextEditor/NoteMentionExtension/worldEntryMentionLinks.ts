import { createContext, useContext } from "react";

import type {
  WorldLinkProps,
  WorldView,
} from "components/worlds/worldNavigation";

// Where a world entry mention leads. Notes in a game open the entry in a
// world tab; the world page links to its own route. Without a provider (the
// game log, for one) a mention shows its entry's name but is not a link.
export type WorldEntryMentionLinks = (view: WorldView) => WorldLinkProps;

export const WorldEntryMentionLinksContext =
  createContext<WorldEntryMentionLinks | null>(null);

export function useWorldEntryMentionLinks(): WorldEntryMentionLinks | null {
  return useContext(WorldEntryMentionLinksContext);
}
