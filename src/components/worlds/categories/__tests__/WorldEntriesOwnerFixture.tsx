import type { ReactNode } from "react";

import { useListenToWorldEntries } from "stores/worldEntries.store";

// Stands in for the world page or game Notes section, which own the entries
// subscription above every world view.
export function WorldEntriesOwnerFixture({
  worldId,
  children,
}: {
  worldId: string;
  children: ReactNode;
}) {
  useListenToWorldEntries(worldId);
  return children;
}
