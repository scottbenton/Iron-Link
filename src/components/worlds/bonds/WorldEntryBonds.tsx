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

import { WorldBondSection } from "./WorldBondSection";
import { useWorldBondsGame } from "./WorldBondsGameContext";
import { WorldConnectionRow } from "./WorldConnectionRow";
import { WorldEntryBondList } from "./WorldEntryBondList";
import {
  getConnectionMembers,
  useConnectionMenuActions,
} from "./useConnectionMenuActions";
import { useWorldBondActions } from "./useWorldBondActions";
import {
  WorldBondCharacter,
  useWorldBondCharacters,
} from "./useWorldBondCharacters";
import { useWorldBondMechanics } from "./useWorldBondMechanics";
import { CONNECTION_RANKS, formatNames, getRankLabel } from "./worldBondLabels";

// The game's characters and their bonds with an entry, in the terms of the
// game's rules: a checkbox per character for Ironlands bonds, a track per
// connection for Starforged connections, each one character's or the whole
// party's. Outside a game there are no characters to show, so it says where
// bonds live instead.
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
  useListenToEntryBonds(mechanics?.kind === "bond" ? entry.id : undefined);
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
      mechanics={mechanics}
    />
  );
}

function WorldEntryConnections({
  entry,
  gameId,
  characters,
  mechanics,
}: {
  entry: IWorldEntry;
  gameId: string;
  characters: WorldBondCharacter[];
  mechanics: WorldBondMechanics;
}) {
  const { t } = useTranslation();
  const actions = useWorldBondActions(mechanics);
  const getMenuActions = useConnectionMenuActions(actions);
  const rollProgress = useRollCompleteProgressTrack();
  useListenToGameConnections(gameId);
  const connections = useEntryConnections(gameId, entry.id);
  const party = connections.find(
    (connection) => connection.characterId === null,
  );
  // The party's first, then each character's, by name.
  const listed = [
    ...(party ? [party] : []),
    ...characters.flatMap((character) =>
      connections.filter(
        (connection) => connection.characterId === character.id,
      ),
    ),
  ];
  // Characters this person may edit who could make a connection.
  const unconnected = party
    ? []
    : characters.filter(
        (character) =>
          character.canEdit &&
          !connections.some(
            (connection) => connection.characterId === character.id,
          ),
      );
  // Who a new connection can be for: the party while no one has one, and
  // each of those characters.
  const targets: ConnectionTarget[] = [
    ...(connections.length === 0 &&
    characters.length > 1 &&
    characters.some((character) => character.canEdit)
      ? [
          {
            characterId: null,
            label: t("worlds.bonds.connect-party", "For the party"),
          },
        ]
      : []),
    ...unconnected.map((character) => ({
      characterId: character.id,
      label: t("worlds.bonds.connect-named", "For {{name}}", {
        name: character.name,
      }),
    })),
  ];

  if (listed.length === 0 && targets.length === 0) return null;

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
        {listed.map((connection) => {
          const members = getConnectionMembers(connection, characters);
          const label =
            connection.characterId === null
              ? t("worlds.bonds.party", "The Party")
              : formatNames(
                  members.map((member) => member.name),
                  t,
                );
          const editor = members.find((member) => member.canEdit);
          return (
            <WorldConnectionRow
              key={connection.id}
              connection={connection}
              label={label}
              canEdit={!!editor}
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
                  editor?.id,
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
              menuActions={getMenuActions(
                entry.name,
                connection,
                characters,
                connections.length > 1,
              )}
            />
          );
        })}
        {targets.length > 0 && (
          <Box>
            <CreateConnectionButton
              targets={targets}
              askTarget={characters.length > 1}
              onCreate={(characterId, rank) =>
                actions.makeConnection({
                  entryId: entry.id,
                  gameId,
                  characterId,
                  rank,
                })
              }
            />
          </Box>
        )}
      </Stack>
    </WorldBondSection>
  );
}

type ConnectionTarget = { characterId: string | null; label: string };

// "Create a connection", then who it is for (skipped in a game with one
// character), then its rank.
function CreateConnectionButton({
  targets,
  askTarget,
  onCreate,
}: {
  targets: ConnectionTarget[];
  askTarget: boolean;
  onCreate: (characterId: string | null, rank: Difficulty) => void;
}) {
  const { t } = useTranslation();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [target, setTarget] = useState<ConnectionTarget | null>(null);
  const menuId = useId();
  const close = () => {
    setAnchor(null);
    setTarget(null);
  };
  const choosingTarget = askTarget && !target;
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
        onClick={(event) => {
          setTarget(askTarget ? null : targets[0]);
          setAnchor(event.currentTarget);
        }}
      >
        {t("worlds.bonds.connect", "Create a connection")}
      </Button>
      <Menu
        id={menuId}
        anchorEl={anchor}
        open={!!anchor}
        onClose={close}
        MenuListProps={{
          "aria-label": choosingTarget
            ? t("worlds.bonds.connect-for", "Create a connection for")
            : t("worlds.bonds.rank", "Rank"),
        }}
      >
        {choosingTarget
          ? targets.map((option) => (
              <MenuItem
                key={option.characterId ?? "party"}
                onClick={() => setTarget(option)}
              >
                {option.label}
              </MenuItem>
            ))
          : CONNECTION_RANKS.map((rank) => (
              <MenuItem
                key={rank}
                onClick={() => {
                  if (target) onCreate(target.characterId, rank);
                  close();
                }}
              >
                {getRankLabel(rank, t)}
              </MenuItem>
            ))}
      </Menu>
    </>
  );
}
