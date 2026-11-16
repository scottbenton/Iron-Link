import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  Box,
  Button,
  ButtonBase,
  Checkbox,
  Collapse,
  FormControlLabel,
  Stack,
  Theme,
  Typography,
} from "@mui/material";
import { useId, useState } from "react";
import { useTranslation } from "react-i18next";

import { EmptyState } from "components/Layout/EmptyState";
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
  useWorldEntryBondsStore,
} from "stores/worldEntryBonds.store";

import { WorldBondMechanics } from "lib/worldBonds.lib";

import { TrackTypes } from "repositories/tracks.repository";

import { IWorldEntry } from "services/worldEntries.service";
import { IWorldEntryConnection } from "services/worldEntryBonds.service";

import { useCanEditCharacter } from "../../hooks/useCanEditCharacter";
import { useCharacterIdOptional } from "../../hooks/useCharacterId";
import { useGameWorldId } from "../NotesSection/hooks/useGameWorld";

const barColor = (theme: Theme) =>
  theme.palette.mode === "light" ? "grey.300" : "grey.700";

// Fewer connections than this start open.
const OPEN_BELOW = 3;

// The open character's connections (its own and the party's) with NPCs of
// the game's world, under its other tracks with a header bar like theirs.
// Open at first only when there are few; bonded ones are hidden unless
// asked for, like completed tracks.
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
  // Null until the person opens or closes it.
  const [toggled, setToggled] = useState<boolean | null>(null);
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
  // Open at first when there are only a few to show, decided once they have
  // loaded so adding one later doesn't fold it away.
  const loaded = useWorldEntryBondsStore(
    (store) => store.loading[`game:${gameId}`] === false,
  );
  const [startOpen, setStartOpen] = useState<boolean | null>(null);
  if (loaded && startOpen === null) {
    setStartOpen(shown.length < OPEN_BELOW);
  }
  const open = toggled ?? startOpen ?? false;

  return (
    <>
      <Box mx={-2} mt={4} bgcolor={barColor}>
        <Typography
          component="h3"
          variant="h6"
          fontFamily="fontFamilyTitle"
          textTransform="uppercase"
        >
          <ButtonBase
            aria-expanded={open}
            aria-controls={detailsId}
            onClick={() => setToggled(!open)}
            sx={{
              width: "100%",
              justifyContent: "space-between",
              font: "inherit",
              textTransform: "inherit",
              px: 2,
              py: 1.5,
              "&:hover": { bgcolor: "action.hover" },
              "&.Mui-focusVisible": { bgcolor: "action.focus" },
            }}
          >
            {t("character.connections.title", "Connections")}
            <ExpandMoreIcon
              sx={{
                transition: (theme) => theme.transitions.create("transform"),
                transform: open ? "rotate(180deg)" : "none",
              }}
            />
          </ButtonBase>
        </Typography>
      </Box>
      {/* One collapse for the bar's controls and the list, so they fold
          together. It spans the bar's width, since it clips its contents. */}
      <Collapse in={open} id={detailsId} sx={{ mx: -2 }}>
        <Box
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          flexWrap="wrap"
          gap={1}
          px={2}
          pb={1}
          bgcolor={barColor}
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
              // "Add" fits beside Show Bonded in the narrow sidebar; the
              // section heading says what it adds.
              aria-label={t(
                "character.connections.add-label",
                "Add connection",
              )}
              onClick={() => setCreating(true)}
            >
              {t("character.connections.add", "Add")}
            </Button>
          )}
        </Box>
        <Box px={2}>
          {shown.length === 0 ? (
            <EmptyState
              sx={{ my: 3 }}
              message={
                connections.length === 0
                  ? t("character.connections.empty", "No connections yet")
                  : t(
                      "character.connections.all-bonded",
                      "Every connection is bonded",
                    )
              }
            />
          ) : (
            <Stack spacing={4} sx={{ mt: 2 }}>
              {shown.map((connection) => (
                <CharacterConnection
                  key={connection.id}
                  entry={entries[connection.entryId]}
                  connection={connection}
                  characterId={characterId}
                  characterName={characterName}
                  mechanics={mechanics}
                  labelLinkProps={getEntryLinkProps(
                    entries[connection.entryId],
                  )}
                />
              ))}
            </Stack>
          )}
        </Box>
      </Collapse>
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
    </>
  );
}

// One of the character's connections, its own or the party's: its track,
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
          ? t("character.bonds.party", "Shared with the party")
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
