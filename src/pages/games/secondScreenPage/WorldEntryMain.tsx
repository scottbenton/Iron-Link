import { Box, LinearProgress, Typography } from "@mui/material";

import { WorldEntryIcon } from "components/worlds/entries/WorldEntryIcon";

import { useGameStore } from "stores/game.store";
import { useListenToWorld } from "stores/world.store";
import { useListenToWorldConfiguration } from "stores/worldCategories.store";
import {
  useListenToWorldEntries,
  useWorldEntriesStore,
} from "stores/worldEntries.store";

import { ReadPermissions } from "repositories/shared.types";

import { WorldEntriesService } from "services/worldEntries.service";

import { Default } from "./Default";
import { NoteImageMain } from "./NoteImageMain";

export interface WorldEntryMainProps {
  worldId: string;
  entryId: string;
}

// A world entry on the second screen, shown like a character: its picture
// with its name, or its icon and name when it has no picture. An entry only
// Guides can see, or one from a world this game no longer uses, shows the
// game's default screen instead.
export function WorldEntryMain(props: WorldEntryMainProps) {
  const { worldId, entryId } = props;

  const gameWorldId = useGameStore((store) => store.game?.worldId);
  const linked = gameWorldId === worldId;
  // The world's permission decides which entries load; its configuration holds
  // the category icon an entry without its own falls back to.
  useListenToWorld(linked ? worldId : undefined);
  useListenToWorldConfiguration(linked ? worldId : undefined);
  useListenToWorldEntries(linked ? worldId : undefined);

  const entry = useWorldEntriesStore(
    (store) => store.entryState.entries[entryId],
  );
  const loading = useWorldEntriesStore((store) => store.entryState.loading);

  if (!linked) return <Default />;
  if (loading) return <LinearProgress sx={{ flexGrow: 1 }} />;
  if (!entry || entry.readPermissions === ReadPermissions.OnlyGuides)
    return <Default />;

  if (entry.imageFilename)
    return (
      <NoteImageMain
        url={WorldEntriesService.getWorldEntryImageUrl(
          entry.worldId,
          entry.id,
          entry.imageFilename,
        )}
        label={entry.name}
      />
    );
  return (
    <Box
      sx={{
        flexGrow: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 2,
        p: 4,
      }}
    >
      <WorldEntryIcon entry={entry} size="xlarge" />
      <Typography
        variant="h1"
        component="h1"
        fontFamily="fontFamilyTitle"
        textAlign="center"
      >
        {entry.name}
      </Typography>
    </Box>
  );
}
