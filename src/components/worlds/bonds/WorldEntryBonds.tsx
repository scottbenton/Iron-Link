import AddIcon from "@mui/icons-material/Add";
import { Alert, Box, Button, Menu, MenuItem, Stack } from "@mui/material";
import { useId, useState } from "react";
import { useTranslation } from "react-i18next";

import { useRollCompleteProgressTrack } from "pages/games/hooks/useRollCompleteProgressTrack";

import {
  useEntryBonds,
  useEntryConnections,
  useListenToEntryBonds,
  useListenToGameConnections,
} from "stores/worldEntryBonds.store";

import { WorldBondMechanics } from "lib/worldBonds.lib";

import { Difficulty, TrackTypes } from "repositories/tracks.repository";

import { IWorldEntry } from "services/worldEntries.service";
import { IWorldEntryBond } from "services/worldEntryBonds.service";

import { WorldBondSection } from "./WorldBondSection";
import { useWorldBondsGame } from "./WorldBondsGameContext";
import { WorldConnectionRow } from "./WorldConnectionRow";
import { WorldEntryBondList } from "./WorldEntryBondList";
import { useLeaveConnection } from "./useLeaveConnection";
import { useWorldBondActions } from "./useWorldBondActions";
import {
  WorldBondCharacter,
  useWorldBondCharacters,
} from "./useWorldBondCharacters";
import { useWorldBondMechanics } from "./useWorldBondMechanics";
import { CONNECTION_RANKS, formatNames, getRankLabel } from "./worldBondLabels";

// The game's characters and their bonds with an entry, in the terms of the
// game's rules: a checkbox per character for Ironlands bonds, a track per
// connection for Starforged connections, each one character's or shared. Outside a game there are
// no characters to show, so it says where bonds live instead.
export function WorldEntryBonds({ entry }: { entry: IWorldEntry }) {
  const game = useWorldBondsGame();
  if (!game) return <WorldEntryBondsElsewhere />;
  return <GameWorldEntryBonds entry={entry} gameId={game.gameId} />;
}

function WorldEntryBondsElsewhere() {
  const { t } = useTranslation();
  return (
    <Alert severity="info" variant="outlined">
      {t(
        "worlds.bonds.elsewhere",
        "Bonds belong to characters, so they show when you open this world from a game's Notes tab.",
      )}
    </Alert>
  );
}

function GameWorldEntryBonds({
  entry,
  gameId,
}: {
  entry: IWorldEntry;
  gameId: string;
}) {
  const mechanics = useWorldBondMechanics();
  useListenToEntryBonds(mechanics ? entry.id : undefined);
  const characters = useWorldBondCharacters();
  const bonds = useEntryBonds(entry.id).filter((bond) =>
    characters.some((character) => character.id === bond.characterId),
  );
  const actions = useWorldBondActions(mechanics);

  if (!mechanics || characters.length === 0) return null;

  if (mechanics.kind === "bond") {
    return (
      <WorldEntryBondList
        entry={entry}
        characters={characters}
        bonds={bonds}
        onToggle={(characterId, bonded) =>
          actions.setBond({ entryId: entry.id, characterId }, bonded)
        }
      />
    );
  }
  return (
    <WorldEntryConnections
      entry={entry}
      gameId={gameId}
      characters={characters}
      bonds={bonds}
      mechanics={mechanics}
    />
  );
}

function WorldEntryConnections({
  entry,
  gameId,
  characters,
  bonds,
  mechanics,
}: {
  entry: IWorldEntry;
  gameId: string;
  characters: WorldBondCharacter[];
  bonds: IWorldEntryBond[];
  mechanics: WorldBondMechanics;
}) {
  const { t } = useTranslation();
  const actions = useWorldBondActions(mechanics);
  const leave = useLeaveConnection(actions);
  const rollProgress = useRollCompleteProgressTrack();
  useListenToGameConnections(gameId);
  const connections = useEntryConnections(gameId, entry.id);
  // In the characters' order, by name.
  const getMembers = (connectionId: string) =>
    characters.filter((character) =>
      bonds.some(
        (bond) =>
          bond.connectionId === connectionId &&
          bond.characterId === character.id,
      ),
    );
  const listed = connections
    .map((connection) => ({ connection, members: getMembers(connection.id) }))
    .filter(({ members }) => members.length > 0);
  // Characters this person may edit who have no connection with the entry.
  const unconnected = characters.filter(
    (character) =>
      character.canEdit &&
      !bonds.some((bond) => bond.characterId === character.id),
  );

  if (listed.length === 0 && unconnected.length === 0) return null;

  return (
    <WorldBondSection
      title={t("worlds.bonds.connections", "Connections")}
      description={
        listed.length === 0
          ? t(
              "worlds.bonds.connections-empty",
              "No character has a connection with {{entry}} yet.",
              { entry: entry.name },
            )
          : undefined
      }
    >
      <Stack spacing={3}>
        {listed.map(({ connection, members }) => {
          const editable = members.filter((member) => member.canEdit);
          const label = formatNames(
            members.map((member) => member.name),
            t,
          );
          return (
            <WorldConnectionRow
              key={connection.id}
              connection={connection}
              label={label}
              canEdit={editable.length > 0}
              connectionMoves={mechanics.connectionMoves}
              onRollMove={(moveId) =>
                rollProgress(
                  TrackTypes.BondProgress,
                  t("worlds.bonds.roll-label", "{{character}} and {{entry}}", {
                    character: label,
                    entry: entry.name,
                  }),
                  connection.ticks,
                  moveId,
                  editable[0]?.id,
                )
              }
              onTicksChange={(ticks) =>
                actions.updateConnection(connection.id, { ticks })
              }
              onBondedChange={(bonded) =>
                actions.setBonded(connection, members, bonded)
              }
              onRankChange={(rank) =>
                actions.updateConnection(connection.id, { rank })
              }
              memberActions={[
                ...unconnected.map((character) => ({
                  key: `add:${character.id}`,
                  label: t("worlds.bonds.share", "Share with {{name}}", {
                    name: character.name,
                  }),
                  onClick: () =>
                    actions.shareConnection(
                      { entryId: entry.id, characterId: character.id },
                      connection.id,
                    ),
                })),
                ...editable.map((member) => ({
                  key: `remove:${member.id}`,
                  label:
                    members.length > 1
                      ? t(
                          "worlds.bonds.unshare",
                          "Stop sharing with {{name}}",
                          {
                            name: member.name,
                          },
                        )
                      : t(
                          "worlds.bonds.remove-connection",
                          "Remove connection",
                        ),
                  onClick: () =>
                    leave(entry, connection, members.length, member),
                })),
              ]}
            />
          );
        })}
        {unconnected.length > 0 && (
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
            {unconnected.map((character) => (
              <MakeConnectionButton
                key={character.id}
                character={character}
                showName={characters.filter((c) => c.canEdit).length > 1}
                onConnect={(rank) =>
                  actions.makeConnection(
                    { entryId: entry.id, characterId: character.id },
                    rank,
                  )
                }
              />
            ))}
          </Box>
        )}
      </Stack>
    </WorldBondSection>
  );
}

function MakeConnectionButton({
  character,
  showName,
  onConnect,
}: {
  character: WorldBondCharacter;
  showName: boolean;
  onConnect: (rank: Difficulty) => void;
}) {
  const { t } = useTranslation();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const menuId = useId();
  const label = showName
    ? t("worlds.bonds.connect-named", "Make a connection for {{name}}", {
        name: character.name,
      })
    : t("worlds.bonds.connect", "Make a connection");
  return (
    <>
      <Button
        variant="outlined"
        color="inherit"
        size="small"
        startIcon={<AddIcon />}
        aria-haspopup="menu"
        aria-controls={anchor ? menuId : undefined}
        aria-expanded={anchor ? true : undefined}
        onClick={(event) => setAnchor(event.currentTarget)}
      >
        {label}
      </Button>
      <Menu
        id={menuId}
        anchorEl={anchor}
        open={!!anchor}
        onClose={() => setAnchor(null)}
        MenuListProps={{
          "aria-label": t("worlds.bonds.rank", "Rank"),
        }}
      >
        {CONNECTION_RANKS.map((rank) => (
          <MenuItem
            key={rank}
            onClick={() => {
              setAnchor(null);
              onConnect(rank);
            }}
          >
            {getRankLabel(rank, t)}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
