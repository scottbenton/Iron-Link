import { Box, LinearProgress } from "@mui/material";

import { WorldEntryView } from "components/worlds/entries/WorldEntryView";
import { WorldEntryAudienceContext } from "components/worlds/entries/worldEntryAudience";
import type { WorldNavigation } from "components/worlds/worldNavigation";

import { useGameStore } from "stores/game.store";
import { useListenToWorld } from "stores/world.store";
import {
  useListenToWorldConfiguration,
  useWorldCategoriesStore,
} from "stores/worldCategories.store";
import {
  useListenToWorldEntries,
  useWorldEntriesStore,
} from "stores/worldEntries.store";

import { ReadPermissions } from "repositories/shared.types";

import { Default } from "./Default";

// Nothing on the second screen is a link: it is a display for the table.
const NO_NAVIGATION: Omit<WorldNavigation, "view"> = {
  getLinkProps: () => ({
    href: "#",
    onClick: (event) => event.preventDefault(),
  }),
  navigate: () => {},
};

export interface WorldEntryMainProps {
  worldId: string;
  entryId: string;
}

// A world entry on the second screen: its header, shared fields and Notes,
// drawn for the whole table. An entry only Guides can see, or one from a
// world this game no longer uses, shows the game's default screen instead.
export function WorldEntryMain(props: WorldEntryMainProps) {
  const { worldId, entryId } = props;

  const gameWorldId = useGameStore((store) => store.game?.worldId);
  const linked = gameWorldId === worldId;
  useListenToWorld(linked ? worldId : undefined);
  useListenToWorldConfiguration(linked ? worldId : undefined);
  useListenToWorldEntries(linked ? worldId : undefined);

  const entry = useWorldEntriesStore(
    (store) => store.entryState.entries[entryId],
  );
  const entriesLoading = useWorldEntriesStore(
    (store) => store.entryState.loading,
  );
  const category = useWorldCategoriesStore((store) =>
    entry ? store.categories[entry.categoryId] : undefined,
  );
  const categoriesLoading = useWorldCategoriesStore((store) => store.loading);

  if (!linked) return <Default />;
  if (entriesLoading || (entry && !category && categoriesLoading))
    return <LinearProgress sx={{ flexGrow: 1 }} />;
  if (
    !entry ||
    !category ||
    entry.readPermissions === ReadPermissions.OnlyGuides
  )
    return <Default />;

  return (
    <Box sx={{ flexGrow: 1, overflow: "auto", p: 4 }}>
      <WorldEntryAudienceContext.Provider value="table">
        <WorldEntryView
          category={category}
          entryId={entryId}
          navigation={{
            ...NO_NAVIGATION,
            view: { type: "entry", categoryId: category.id, entryId },
          }}
        />
      </WorldEntryAudienceContext.Provider>
    </Box>
  );
}
