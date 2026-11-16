import AddIcon from "@mui/icons-material/Add";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  Stack,
  Typography,
} from "@mui/material";
import { useId, useState } from "react";
import { useTranslation } from "react-i18next";

import type { NavigationLinkProps } from "components/LinkComponent";
import { NewConnectionDialog } from "components/worlds/bonds/NewConnectionDialog";
import { WorldConnectionRow } from "components/worlds/bonds/WorldConnectionRow";
import {
  getConnectionMembers,
  useConnectionMenuActions,
} from "components/worlds/bonds/useConnectionMenuActions";
import { useWorldBondActions } from "components/worlds/bonds/useWorldBondActions";
import { useWorldBondCharacters } from "components/worlds/bonds/useWorldBondCharacters";
import { useWorldBondMechanics } from "components/worlds/bonds/useWorldBondMechanics";
import { useWorldEntryNotesLinkProps } from "components/worlds/bonds/useWorldEntryNotesLinkProps";

import { useGameIdOptional } from "pages/games/gamePageLayout/hooks/useGameId";
import { useRollCompleteProgressTrack } from "pages/games/hooks/useRollCompleteProgressTrack";

import { useGameCharacter } from "stores/gameCharacters.store";
import { useWorldEntriesStore } from "stores/worldEntries.store";
import {
  useCharacterConnections,
  useEntryConnections,
  useListenToGameConnections,
} from "stores/worldEntryBonds.store";

import { WorldBondMechanics } from "lib/worldBonds.lib";

import { TrackTypes } from "repositories/tracks.repository";

import { IWorldEntry } from "services/worldEntries.service";
import { IWorldEntryConnection } from "services/worldEntryBonds.service";

import { useCanEditCharacter } from "../../hooks/useCanEditCharacter";
import { useCharacterIdOptional } from "../../hooks/useCharacterId";
import { useGameWorldId } from "../NotesSection/hooks/useGameWorld";

// The open character's connections (its own and the Party's) with NPCs of
// the game's world, under its other tracks. Closed until opened; bonded ones
// are hidden unless asked for, like completed tracks.
export function CharacterConnections() {
  const characterId = useCharacterIdOptional();
  const worldId = useGameWorldId();
  const gameId = useGameIdOptional();
  const mechanics = useWorldBondMechanics();

  if (!characterId || !worldId || !gameId || mechanics?.kind !== "connection") {
    return null;
  }
  return (
    <ConnectionsSection
      characterId={characterId}
      worldId={worldId}
      gameId={gameId}
      mechanics={mechanics}
    />
  );
}

function ConnectionsSection({
  characterId,
  worldId,
  gameId,
  mechanics,
}: {
  characterId: string;
  worldId: string;
  gameId: string;
  mechanics: WorldBondMechanics;
}) {
  const { t } = useTranslation();
  const characterName = useGameCharacter((character) => character?.name) ?? "";
  const canEdit = useCanEditCharacter();
  const characters = useWorldBondCharacters();
  const actions = useWorldBondActions(mechanics);
  const getEntryLinkProps = useWorldEntryNotesLinkProps(worldId);
  const [showBonded, setShowBonded] = useState(false);
  const [creating, setCreating] = useState(false);
  const detailsId = useId();

  useListenToGameConnections(gameId);
  const entries = useWorldEntriesStore((store) => store.entryState.entries);
  const connections = useCharacterConnections(gameId, characterId)
    .filter(
      (connection) =>
        connection.worldId === worldId && entries[connection.entryId],
    )
    .sort((a, b) =>
      entries[a.entryId].name.localeCompare(entries[b.entryId].name),
    );
  const shown = connections.filter(
    (connection) => showBonded || !connection.bonded,
  );

  return (
    <Accordion variant="outlined" disableGutters sx={{ mt: 4 }}>
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        aria-controls={detailsId}
      >
        <Typography
          component="span"
          variant="h6"
          textTransform="uppercase"
          fontFamily="fontFamilyTitle"
        >
          {t("character.connections.title", "Connections")}
        </Typography>
        <Typography
          component="span"
          color="text.secondary"
          sx={{ ml: 1, alignSelf: "center" }}
        >
          {connections.length}
        </Typography>
      </AccordionSummary>
      <AccordionDetails id={detailsId}>
        <Box
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          flexWrap="wrap"
          gap={1}
        >
          <FormControlLabel
            label={t("character.connections.show-bonded", "Show Bonded")}
            control={
              <Checkbox
                checked={showBonded}
                onChange={(_, checked) => setShowBonded(checked)}
              />
            }
          />
          {canEdit && (
            <Button
              color="inherit"
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => setCreating(true)}
            >
              {t("character.connections.new", "New Connection")}
            </Button>
          )}
        </Box>
        {shown.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {connections.length === 0
              ? t(
                  "character.connections.empty",
                  "No connections yet. Make one here or from an NPC's page in Notes.",
                )
              : t(
                  "character.connections.all-bonded",
                  "Every connection here is a bond. Show Bonded to see them.",
                )}
          </Typography>
        ) : (
          <Stack spacing={2} sx={{ mt: 1 }}>
            {shown.map((connection) => (
              <CharacterConnection
                key={connection.id}
                entry={entries[connection.entryId]}
                connection={connection}
                characterId={characterId}
                characterName={characterName}
                mechanics={mechanics}
                labelLinkProps={getEntryLinkProps(entries[connection.entryId])}
              />
            ))}
          </Stack>
        )}
      </AccordionDetails>
      {creating && (
        <NewConnectionDialog
          onClose={() => setCreating(false)}
          gameId={gameId}
          worldId={worldId}
          characterId={characterId}
          characterName={characterName}
          canShare={characters.length > 1}
          onCreate={actions.makeConnection}
        />
      )}
    </Accordion>
  );
}

// One of the character's connections, its own or the Party's: its track,
// marked and forged here as on the NPC, named by the NPC. Its menu shares it
// or keeps it for one character, removes it and changes the rank.
function CharacterConnection({
  entry,
  connection,
  characterId,
  characterName,
  mechanics,
  labelLinkProps,
}: {
  entry: IWorldEntry;
  connection: IWorldEntryConnection;
  characterId: string;
  characterName: string;
  mechanics: WorldBondMechanics;
  labelLinkProps: NavigationLinkProps | undefined;
}) {
  const { t } = useTranslation();
  const characters = useWorldBondCharacters();
  const entryConnections = useEntryConnections(connection.gameId, entry.id);
  const actions = useWorldBondActions(mechanics);
  const getMenuActions = useConnectionMenuActions(actions);
  const rollProgress = useRollCompleteProgressTrack();
  const members = getConnectionMembers(connection, characters);
  const isParty = connection.characterId === null;

  return (
    <WorldConnectionRow
      connection={connection}
      label={entry.name}
      labelLinkProps={labelLinkProps}
      description={
        isParty
          ? t("character.bonds.party", "Shared with the Party")
          : undefined
      }
      canEdit={members.some((member) => member.canEdit)}
      connectionMoves={mechanics.connectionMoves}
      onRollMove={(moveId) =>
        rollProgress(
          TrackTypes.BondProgress,
          t("worlds.bonds.roll-label", "{{character}} and {{entry}}", {
            character: characterName,
            entry: entry.name,
          }),
          connection.ticks,
          moveId,
          characterId,
        )
      }
      onTicksChange={(ticks) =>
        actions.updateConnection(connection.id, { ticks })
      }
      onBondedChange={(bonded) =>
        actions.setBonded(connection, members, bonded)
      }
      onRankChange={(rank) => actions.updateConnection(connection.id, { rank })}
      menuActions={getMenuActions(
        entry.name,
        connection,
        characters,
        entryConnections.length > 1,
      )}
    />
  );
}
