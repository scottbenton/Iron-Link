import { Box, Button, MenuItem, TextField } from "@mui/material";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { ProgressTrack } from "components/datasworn/ProgressTrack";

import { useGameWorldId } from "pages/games/characterSheet/components/NotesSection/hooks/useGameWorld";
import { useCharacterIdOptional } from "pages/games/characterSheet/hooks/useCharacterId";
import { useGameIdOptional } from "pages/games/gamePageLayout/hooks/useGameId";
import { useRollCompleteProgressTrack } from "pages/games/hooks/useRollCompleteProgressTrack";

import { useWorldEntriesStore } from "stores/worldEntries.store";
import {
  useCharacterConnections,
  useListenToGameConnections,
} from "stores/worldEntryBonds.store";

import { TrackTypes } from "repositories/tracks.repository";

// The open character's world connections as targets for a connection
// progress move (Forge a Bond). One dropdown keeps the dialog short however
// many connections the character has; its track and roll show once one is
// picked.
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
  const gameId = useGameIdOptional();
  useListenToGameConnections(worldId ? gameId : undefined);
  const entries = useWorldEntriesStore((store) => store.entryState.entries);
  const connections = useCharacterConnections(gameId, characterId)
    .filter(
      (connection) =>
        connection.worldId === worldId && !!entries[connection.entryId],
    )
    .sort((a, b) =>
      entries[a.entryId].name.localeCompare(entries[b.entryId].name),
    );
  const [selected, setSelected] = useState("");
  const rollTrackProgress = useRollCompleteProgressTrack();

  if (!worldId || connections.length === 0) return null;

  // Nothing is chosen at first, so a roll is always for the connection the
  // player picked.
  const connection = connections.find((c) => c.entryId === selected);

  return (
    <Box>
      <TextField
        select
        size="small"
        fullWidth
        label={t("datasworn.move.world-connection", "Connection")}
        value={connection?.entryId ?? ""}
        onChange={(event) => setSelected(event.target.value)}
        sx={{ mb: 1 }}
      >
        {connections.map((bond) => (
          <MenuItem key={bond.entryId} value={bond.entryId}>
            {entries[bond.entryId].name}
          </MenuItem>
        ))}
      </TextField>
      {connection && (
        <>
          <ProgressTrack
            label={entries[connection.entryId].name}
            difficulty={connection.rank}
            value={connection.ticks}
          />
          <Button
            variant="outlined"
            color="inherit"
            sx={{ mt: 1 }}
            onClick={() =>
              rollTrackProgress(
                TrackTypes.BondProgress,
                entries[connection.entryId].name,
                connection.ticks,
                moveId,
              )
            }
          >
            {t("datasworn.move.roll-track-progress", "Roll {{moveName}}", {
              moveName,
            })}
          </Button>
        </>
      )}
    </Box>
  );
}
