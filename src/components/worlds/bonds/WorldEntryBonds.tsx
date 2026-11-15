import AddIcon from "@mui/icons-material/Add";
import {
  Alert,
  Box,
  Button,
  Menu,
  MenuItem,
  Stack,
  Typography,
} from "@mui/material";
import { useId, useState } from "react";
import { useTranslation } from "react-i18next";

import { useHeadingComponent } from "components/HeadingLevel";

import { useRollCompleteProgressTrack } from "pages/games/hooks/useRollCompleteProgressTrack";

import { useSpecialTrackRules } from "stores/dataswornTree.store";
import {
  useEntryBonds,
  useListenToEntryBonds,
} from "stores/worldEntryBonds.store";

import { WorldBondMechanics, getWorldBondMechanics } from "lib/worldBonds.lib";

import { Difficulty, TrackTypes } from "repositories/tracks.repository";

import { IWorldEntry } from "services/worldEntries.service";
import { IWorldEntryBond } from "services/worldEntryBonds.service";

import { useWorldBondsGame } from "./WorldBondsGameContext";
import { WorldConnectionRow } from "./WorldConnectionRow";
import { WorldEntryBondChips } from "./WorldEntryBondChips";
import { useWorldBondActions } from "./useWorldBondActions";
import {
  WorldBondCharacter,
  useWorldBondCharacters,
} from "./useWorldBondCharacters";
import { FORGE_A_BOND_MOVE_ID, getRankLabel } from "./worldBondLabels";

const RANKS = [
  Difficulty.Troublesome,
  Difficulty.Dangerous,
  Difficulty.Formidable,
  Difficulty.Extreme,
  Difficulty.Epic,
];

// A character's bonds with an entry, in the terms of the current game's
// rules. Ironlands bonds are chips in the entry's header; Starforged
// connections are a section of their own. Outside a game there are no
// characters to show, so the body says where bonds live instead.
export function WorldEntryBonds({
  entry,
  placement,
}: {
  entry: IWorldEntry;
  placement: "header" | "body";
}) {
  const game = useWorldBondsGame();
  if (!game) {
    return placement === "body" ? <WorldEntryBondsElsewhere /> : null;
  }
  return <GameWorldEntryBonds entry={entry} placement={placement} />;
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
  placement,
}: {
  entry: IWorldEntry;
  placement: "header" | "body";
}) {
  const specialTrackRules = useSpecialTrackRules();
  const mechanics = getWorldBondMechanics(specialTrackRules);
  useListenToEntryBonds(mechanics ? entry.id : undefined);
  const characters = useWorldBondCharacters();
  const bonds = useEntryBonds(entry.id).filter((bond) =>
    characters.some((character) => character.id === bond.characterId),
  );
  const actions = useWorldBondActions(mechanics);

  if (!mechanics || characters.length === 0) return null;

  if (mechanics.kind === "bond") {
    if (placement !== "header") return null;
    return (
      <WorldEntryBondChips
        entryId={entry.id}
        characters={characters}
        bonds={bonds}
        onToggle={(characterId, bonded) =>
          actions.setBond({ entryId: entry.id, characterId }, bonded)
        }
      />
    );
  }
  if (placement !== "body") return null;
  return (
    <WorldEntryConnections
      entry={entry}
      characters={characters}
      connections={bonds}
      mechanics={mechanics}
    />
  );
}

function WorldEntryConnections({
  entry,
  characters,
  connections,
  mechanics,
}: {
  entry: IWorldEntry;
  characters: WorldBondCharacter[];
  connections: IWorldEntryBond[];
  mechanics: WorldBondMechanics;
}) {
  const { t } = useTranslation();
  const headingComponent = useHeadingComponent(2);
  const titleId = useId();
  const actions = useWorldBondActions(mechanics);
  const rollProgress = useRollCompleteProgressTrack();
  const byCharacter = new Map(
    connections.map((connection) => [connection.characterId, connection]),
  );
  const listed = characters.filter((character) =>
    byCharacter.has(character.id),
  );
  const canConnect = characters.filter(
    (character) => character.canEdit && !byCharacter.has(character.id),
  );

  if (listed.length === 0 && canConnect.length === 0) return null;

  return (
    <Box component="section" aria-labelledby={titleId}>
      <Typography
        id={titleId}
        component={headingComponent}
        variant="overline"
        sx={{
          display: "block",
          fontFamily: "fontFamilyTitle",
          fontSize: 15,
          lineHeight: 1.5,
          mb: 1,
        }}
      >
        {t("worlds.bonds.connections", "Connections")}
      </Typography>
      <Stack spacing={2}>
        {listed.map((character) => {
          const connection = byCharacter.get(character.id)!;
          return (
            <WorldConnectionRow
              key={character.id}
              connection={connection}
              label={character.name}
              canEdit={character.canEdit}
              onTicksChange={(ticks) =>
                actions.updateConnection(connection, { ticks })
              }
              onForgeBond={() =>
                rollProgress(
                  TrackTypes.BondProgress,
                  t("worlds.bonds.roll-label", "{{character}} and {{entry}}", {
                    character: character.name,
                    entry: entry.name,
                  }),
                  connection.ticks,
                  FORGE_A_BOND_MOVE_ID,
                  character.id,
                )
              }
              onBondedChange={(bonded) => actions.setBonded(connection, bonded)}
              onRemove={() => actions.removeConnection(connection)}
            />
          );
        })}
        {canConnect.length > 0 && (
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
            {canConnect.map((character) => (
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
    </Box>
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
        {RANKS.map((rank) => (
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
