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
import {
  getConnectionMembers,
  useConnectionMenuActions,
} from "components/worlds/bonds/useConnectionMenuActions";
import { useWorldBondActions } from "components/worlds/bonds/useWorldBondActions";
import { useWorldBondCharacters } from "components/worlds/bonds/useWorldBondCharacters";
import { useWorldBondMechanics } from "components/worlds/bonds/useWorldBondMechanics";

import { getNotesItemLinkProps } from "pages/games/gamePageLayout/hooks/notesDestination";
import { useGameId } from "pages/games/gamePageLayout/hooks/useGameId";
import { useRollCompleteProgressTrack } from "pages/games/hooks/useRollCompleteProgressTrack";

import { useGameCharacter } from "stores/gameCharacters.store";
import { useNotesStore } from "stores/notes.store";
import { useWorldEntriesStore } from "stores/worldEntries.store";
import {
  useCharacterBonds,
  useCharacterConnections,
  useEntryConnections,
  useListenToCharacterBonds,
  useListenToGameConnections,
} from "stores/worldEntryBonds.store";

import { WorldBondMechanics } from "lib/worldBonds.lib";

import { TrackTypes } from "repositories/tracks.repository";

import { IWorldEntry } from "services/worldEntries.service";
import {
  IWorldEntryBond,
  IWorldEntryConnection,
} from "services/worldEntryBonds.service";

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
  useListenToCharacterBonds(
    worldId && mechanics?.kind === "bond" ? characterId : undefined,
  );
  useListenToGameConnections(
    worldId && mechanics?.kind === "connection" ? gameId : undefined,
  );
  const entries = useWorldEntriesStore((store) => store.entryState.entries);
  const bonds = useCharacterBonds(characterId)
    .filter((bond) => bond.worldId === worldId && entries[bond.entryId])
    .sort((a, b) =>
      entries[a.entryId].name.localeCompare(entries[b.entryId].name),
    );
  const connectionList = useCharacterConnections(gameId, characterId)
    .filter(
      (connection) =>
        connection.worldId === worldId && entries[connection.entryId],
    )
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
      {(connections ? connectionList : bonds).length === 0 ? (
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
          {connectionList.map((connection) => (
            <CharacterConnection
              key={connection.id}
              entry={entries[connection.entryId]}
              connection={connection}
              characterId={characterId}
              characterName={characterName ?? ""}
              mechanics={mechanics}
              labelLinkProps={getEntryLinkProps(entries[connection.entryId])}
            />
          ))}
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

// One of the character's connections, its own or the party's: its track,
// marked and forged here as on the entry, named by the entry. Its menu
// shares it or keeps it for one character, removes it and changes the rank.
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
  labelLinkProps: NavigationLinkProps;
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
