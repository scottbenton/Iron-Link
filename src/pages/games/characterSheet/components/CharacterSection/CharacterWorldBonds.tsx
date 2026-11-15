import LinkOffIcon from "@mui/icons-material/LinkOff";
import {
  Box,
  IconButton,
  Link,
  List,
  ListItem,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router";

import type { NavigationLinkProps } from "components/LinkComponent";
import { WorldConnectionRow } from "components/worlds/bonds/WorldConnectionRow";
import { useLeaveConnection } from "components/worlds/bonds/useLeaveConnection";
import { useWorldBondActions } from "components/worlds/bonds/useWorldBondActions";
import { useWorldBondCharacters } from "components/worlds/bonds/useWorldBondCharacters";
import { useWorldBondMechanics } from "components/worlds/bonds/useWorldBondMechanics";
import { formatNames } from "components/worlds/bonds/worldBondLabels";

import { getNotesItemLinkProps } from "pages/games/gamePageLayout/hooks/notesDestination";
import { useGameId } from "pages/games/gamePageLayout/hooks/useGameId";
import { useRollCompleteProgressTrack } from "pages/games/hooks/useRollCompleteProgressTrack";

import { useGameCharacter } from "stores/gameCharacters.store";
import { useNotesStore } from "stores/notes.store";
import { useWorldEntriesStore } from "stores/worldEntries.store";
import {
  useCharacterBonds,
  useEntryBonds,
  useListenToCharacterBonds,
  useListenToEntryBonds,
  useListenToGameConnections,
  useWorldEntryConnections,
} from "stores/worldEntryBonds.store";

import { WorldBondMechanics } from "lib/worldBonds.lib";

import { TrackTypes } from "repositories/tracks.repository";

import { IWorldEntry } from "services/worldEntries.service";
import { IWorldEntryBond } from "services/worldEntryBonds.service";

import { useCanEditCharacter } from "../../hooks/useCanEditCharacter";
import { useCharacterId } from "../../hooks/useCharacterId";
import { useGameWorldId } from "../NotesSection/hooks/useGameWorld";

// The character's bonds with entries of the game's world, under the Legacy
// Tracks they mark. Each links back to its entry in Notes, where bonds are
// formed; connections can be marked and forged here too.
export function CharacterWorldBonds() {
  const { t } = useTranslation();
  const characterId = useCharacterId();
  const characterName = useGameCharacter((character) => character?.name);
  const canEdit = useCanEditCharacter();
  const worldId = useGameWorldId();
  const gameId = useGameId();
  const mechanics = useWorldBondMechanics();
  useListenToCharacterBonds(worldId && mechanics ? characterId : undefined);
  useListenToGameConnections(
    worldId && mechanics?.kind === "connection" ? gameId : undefined,
  );
  const entries = useWorldEntriesStore((store) => store.entryState.entries);
  const bonds = useCharacterBonds(characterId)
    .filter((bond) => bond.worldId === worldId && entries[bond.entryId])
    .sort((a, b) =>
      entries[a.entryId].name.localeCompare(entries[b.entryId].name),
    );
  const actions = useWorldBondActions(mechanics);
  const location = useLocation();
  const openItemTab = useNotesStore((store) => store.openItemTab);

  if (!worldId || !mechanics) return null;

  const getEntryLinkProps = (entry: IWorldEntry) =>
    getNotesItemLinkProps(
      location.pathname,
      new URLSearchParams(location.search),
      {
        type: "world",
        itemId: worldId,
        worldView: {
          type: "entry",
          categoryId: entry.categoryId,
          entryId: entry.id,
        },
      },
      (item, background) =>
        openItemTab({
          type: item.type,
          id: item.itemId,
          worldView: item.worldView,
          openInBackground: background,
        }),
    );

  const connections = mechanics.kind === "connection";
  const title = connections
    ? t("character.bonds.connections", "Connections")
    : t("character.bonds.bonds", "Bonds");

  return (
    <Box>
      <Typography
        variant="h6"
        component="h3"
        textTransform="uppercase"
        fontFamily="fontFamilyTitle"
      >
        {title}
      </Typography>
      {bonds.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          {connections
            ? t(
                "character.bonds.no-connections",
                "Make connections from a world entry's page in Notes.",
              )
            : t(
                "character.bonds.no-bonds",
                "Form bonds from a world entry's page in Notes.",
              )}
        </Typography>
      ) : connections ? (
        <Stack spacing={2} sx={{ mt: 1 }}>
          {bonds.map((bond) =>
            bond.connectionId ? (
              <CharacterConnection
                key={bond.entryId}
                entry={entries[bond.entryId]}
                connectionId={bond.connectionId}
                characterId={characterId}
                characterName={characterName ?? ""}
                canEdit={canEdit}
                mechanics={mechanics}
                labelLinkProps={getEntryLinkProps(entries[bond.entryId])}
              />
            ) : null,
          )}
        </Stack>
      ) : (
        <List dense disablePadding>
          {bonds.map((bond: IWorldEntryBond) => {
            const entry = entries[bond.entryId];
            return (
              <ListItem
                key={bond.entryId}
                disableGutters
                secondaryAction={
                  canEdit && (
                    <Tooltip title={t("character.bonds.clear", "Clear bond")}>
                      <IconButton
                        edge="end"
                        aria-label={t(
                          "character.bonds.clear-named",
                          "Clear bond with {{name}}",
                          { name: entry.name },
                        )}
                        onClick={() => actions.setBond(bond, false)}
                      >
                        <LinkOffIcon />
                      </IconButton>
                    </Tooltip>
                  )
                }
              >
                <Link {...getEntryLinkProps(entry)} color="inherit">
                  {entry.name}
                </Link>
              </ListItem>
            );
          })}
        </List>
      )}
    </Box>
  );
}

// One of the character's connections: its track, marked and forged here as
// on the entry, named by the entry and by any allies who share it. Its menu
// changes the rank or takes this character out of it.
function CharacterConnection({
  entry,
  connectionId,
  characterId,
  characterName,
  canEdit,
  mechanics,
  labelLinkProps,
}: {
  entry: IWorldEntry;
  connectionId: string;
  characterId: string;
  characterName: string;
  canEdit: boolean;
  mechanics: WorldBondMechanics;
  labelLinkProps: NavigationLinkProps;
}) {
  const { t } = useTranslation();
  const connection = useWorldEntryConnections()[connectionId];
  // The other members are read with the entry's bonds.
  useListenToEntryBonds(entry.id);
  const entryBonds = useEntryBonds(entry.id);
  const characters = useWorldBondCharacters();
  const actions = useWorldBondActions(mechanics);
  const leave = useLeaveConnection(actions);
  const rollProgress = useRollCompleteProgressTrack();

  if (!connection) return null;

  const members = characters.filter((character) =>
    entryBonds.some(
      (bond) =>
        bond.connectionId === connectionId && bond.characterId === character.id,
    ),
  );
  const self = members.find((member) => member.id === characterId) ?? {
    id: characterId,
    name: characterName,
    canEdit,
  };
  const allies = members.filter((member) => member.id !== characterId);

  return (
    <WorldConnectionRow
      connection={connection}
      label={entry.name}
      labelLinkProps={labelLinkProps}
      description={
        allies.length > 0
          ? t("character.bonds.shared-with", "Shared with {{names}}", {
              names: formatNames(
                allies.map((ally) => ally.name),
                t,
              ),
            })
          : undefined
      }
      canEdit={canEdit}
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
        actions.setBonded(
          connection,
          members.length > 0 ? members : [self],
          bonded,
        )
      }
      onRankChange={(rank) => actions.updateConnection(connection.id, { rank })}
      memberActions={[
        {
          key: "leave",
          label:
            members.length > 1
              ? t("character.bonds.leave", "Stop sharing this connection")
              : t("worlds.bonds.remove-connection", "Remove connection"),
          onClick: () =>
            leave(entry, connection, Math.max(members.length, 1), self),
        },
      ]}
    />
  );
}
