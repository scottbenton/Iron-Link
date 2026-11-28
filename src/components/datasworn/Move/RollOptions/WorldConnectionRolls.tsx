import { useState } from "react";
import { useTranslation } from "react-i18next";

import { getConnectionMembers } from "components/worlds/bonds/useConnectionMenuActions";
import { useWorldBondActions } from "components/worlds/bonds/useWorldBondActions";
import { useWorldBondCharacters } from "components/worlds/bonds/useWorldBondCharacters";
import { useWorldBondMechanics } from "components/worlds/bonds/useWorldBondMechanics";

import { Checkbox } from "ui/components/Checkbox";
import { Select } from "ui/components/Select";
import { Stack } from "ui/primitives";

import { useGameWorldId } from "pages/games/characterSheet/components/NotesSection/hooks/useGameWorld";
import { useCharacterIdOptional } from "pages/games/characterSheet/hooks/useCharacterId";
import { useGameIdOptional } from "pages/games/gamePageLayout/hooks/useGameId";
import { useRollCompleteProgressTrack } from "pages/games/hooks/useRollCompleteProgressTrack";

import { useWorldEntriesStore } from "stores/worldEntries.store";
import {
  useCharacterConnections,
  useListenToGameConnections,
} from "stores/worldEntryBonds.store";

import { getProgressRank } from "lib/progressTrack.lib";

import { TrackTypes } from "repositories/tracks.repository";

import { TrackRoll } from "./TrackRoll";

// The open character's world connections as targets for a connection
// progress move (Forge a Bond). One dropdown keeps the dialog short however
// many connections the character has; its track, roll and Bonded checkbox
// show once one is picked.
export interface WorldConnectionRollsProps {
  moveId: string;
  moveName: string;
}

export function WorldConnectionRolls(props: WorldConnectionRollsProps) {
  const { moveId, moveName } = props;
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
    <Stack gap="3">
      <Select
        size="sm"
        label={t("datasworn.move.world-connection", "Connection")}
        options={connections.map((bond) => ({
          value: bond.entryId,
          label: entries[bond.entryId].name,
        }))}
        value={connection?.entryId ?? null}
        onValueChange={(value) => setSelected(value ?? "")}
      />
      {connection && (
        <TrackRoll
          moveName={moveName}
          label={entries[connection.entryId].name}
          ticks={connection.ticks}
          rank={getProgressRank(connection.rank)}
          onRoll={() =>
            rollTrackProgress(
              TrackTypes.BondProgress,
              entries[connection.entryId].name,
              connection.ticks,
              moveId,
            )
          }
        />
      )}
      {/* A strong hit makes the connection a bond, so it can be marked here
        without leaving the move. */}
      {connection && members.some((member) => member.canEdit) && (
        <Checkbox
          label={t("worlds.bonds.bonded", "Bonded")}
          checked={connection.bonded}
          onCheckedChange={(checked) =>
            actions.setBonded(connection, members, checked)
          }
        />
      )}
    </Stack>
  );
}
