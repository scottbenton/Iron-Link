import { Box, Button, MenuItem, TextField } from "@mui/material";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { ProgressTrack } from "components/datasworn/ProgressTrack";

import { useGameWorldId } from "pages/games/characterSheet/components/NotesSection/hooks/useGameWorld";
import { useCharacterIdOptional } from "pages/games/characterSheet/hooks/useCharacterId";
import { useRollCompleteProgressTrack } from "pages/games/hooks/useRollCompleteProgressTrack";

import { useWorldEntriesStore } from "stores/worldEntries.store";
import {
  useCharacterBonds,
  useListenToCharacterBonds,
} from "stores/worldEntryBonds.store";

import { TrackTypes } from "repositories/tracks.repository";

// The open character's world connections as targets for a connection
// progress move (Forge a Bond). One dropdown keeps the dialog short however
// many connections the character has.
export function WorldConnectionRolls({
  moveId,
  moveName,
}: {
  moveId: string;
  moveName: string;
}) {
  const { t } = useTranslation();
  const characterId = useCharacterIdOptional();
  const worldId = useGameWorldId();
  useListenToCharacterBonds(worldId ? characterId : undefined);
  const entries = useWorldEntriesStore((store) => store.entryState.entries);
  const connections = useCharacterBonds(characterId)
    .filter(
      (bond) =>
        bond.kind === "connection" &&
        bond.worldId === worldId &&
        entries[bond.entryId],
    )
    .sort((a, b) =>
      entries[a.entryId].name.localeCompare(entries[b.entryId].name),
    );
  const [selected, setSelected] = useState("");
  const rollTrackProgress = useRollCompleteProgressTrack();

  if (!worldId || connections.length === 0) return null;

  const connection =
    connections.find((bond) => bond.entryId === selected) ?? connections[0];
  const name = entries[connection.entryId].name;

  return (
    <Box>
      <TextField
        select
        size="small"
        fullWidth
        label={t("datasworn.move.world-connection", "Connection")}
        value={connection.entryId}
        onChange={(event) => setSelected(event.target.value)}
        sx={{ mb: 1 }}
      >
        {connections.map((bond) => (
          <MenuItem key={bond.entryId} value={bond.entryId}>
            {entries[bond.entryId].name}
          </MenuItem>
        ))}
      </TextField>
      <ProgressTrack
        label={name}
        difficulty={connection.rank ?? undefined}
        value={connection.ticks}
      />
      <Button
        variant="outlined"
        color="inherit"
        sx={{ mt: 1 }}
        onClick={() =>
          rollTrackProgress(
            TrackTypes.BondProgress,
            name,
            connection.ticks,
            moveId,
          )
        }
      >
        {t("datasworn.move.roll-track-progress", "Roll {{moveName}}", {
          moveName,
        })}
      </Button>
    </Box>
  );
}
