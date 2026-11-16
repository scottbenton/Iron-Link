import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  MenuItem,
  TextField,
} from "@mui/material";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { ProgressTrack } from "components/datasworn/ProgressTrack";
import { getConnectionMembers } from "components/worlds/bonds/useConnectionMenuActions";
import { useWorldBondActions } from "components/worlds/bonds/useWorldBondActions";
import { useWorldBondCharacters } from "components/worlds/bonds/useWorldBondCharacters";
import { useWorldBondMechanics } from "components/worlds/bonds/useWorldBondMechanics";

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
// many connections the character has; its track, roll and Bonded checkbox
// show once one is picked.
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
  const characters = useWorldBondCharacters();
  const actions = useWorldBondActions(useWorldBondMechanics());

  if (!worldId || connections.length === 0) return null;

  // Nothing is chosen at first, so a roll is always for the connection the
  // player picked.
  const connection = connections.find((c) => c.entryId === selected);
  const members = connection
    ? getConnectionMembers(connection, characters)
    : [];

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
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              flexWrap: "wrap",
              columnGap: 2,
              mt: 1,
            }}
          >
            <Button
              variant="outlined"
              color="inherit"
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
            {/* A strong hit makes the connection a bond, so it can be marked
              here without leaving the move. */}
            {members.some((member) => member.canEdit) && (
              <FormControlLabel
                control={
                  <Checkbox
                    checked={connection.bonded}
                    onChange={(_, checked) =>
                      actions.setBonded(connection, members, checked)
                    }
                  />
                }
                label={t("worlds.bonds.bonded", "Bonded")}
                sx={{ mx: 0 }}
              />
            )}
          </Box>
        </>
      )}
    </Box>
  );
}
