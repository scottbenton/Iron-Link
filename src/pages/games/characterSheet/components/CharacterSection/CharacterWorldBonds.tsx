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

import { WorldConnectionRow } from "components/worlds/bonds/WorldConnectionRow";
import { useWorldBondActions } from "components/worlds/bonds/useWorldBondActions";
import { FORGE_A_BOND_MOVE_ID } from "components/worlds/bonds/worldBondLabels";

import { getNotesItemLinkProps } from "pages/games/gamePageLayout/hooks/notesDestination";
import { useRollCompleteProgressTrack } from "pages/games/hooks/useRollCompleteProgressTrack";

import { useSpecialTrackRules } from "stores/dataswornTree.store";
import { useGameCharacter } from "stores/gameCharacters.store";
import { useNotesStore } from "stores/notes.store";
import { useWorldEntriesStore } from "stores/worldEntries.store";
import {
  useCharacterBonds,
  useListenToCharacterBonds,
} from "stores/worldEntryBonds.store";

import { getWorldBondMechanics } from "lib/worldBonds.lib";

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
  const mechanics = getWorldBondMechanics(useSpecialTrackRules());
  useListenToCharacterBonds(worldId && mechanics ? characterId : undefined);
  const entries = useWorldEntriesStore((store) => store.entryState.entries);
  const bonds = useCharacterBonds(characterId)
    .filter((bond) => bond.worldId === worldId && entries[bond.entryId])
    .sort((a, b) =>
      entries[a.entryId].name.localeCompare(entries[b.entryId].name),
    );
  const actions = useWorldBondActions(mechanics);
  const rollProgress = useRollCompleteProgressTrack();
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
          {bonds.map((connection) => {
            const entry = entries[connection.entryId];
            return (
              <WorldConnectionRow
                key={connection.entryId}
                connection={connection}
                label={entry.name}
                labelLinkProps={getEntryLinkProps(entry)}
                canEdit={canEdit}
                onTicksChange={(ticks) =>
                  actions.updateConnection(connection, { ticks })
                }
                onForgeBond={() =>
                  rollProgress(
                    TrackTypes.BondProgress,
                    t(
                      "worlds.bonds.roll-label",
                      "{{character}} and {{entry}}",
                      { character: characterName ?? "", entry: entry.name },
                    ),
                    connection.ticks,
                    FORGE_A_BOND_MOVE_ID,
                    characterId,
                  )
                }
                onBondedChange={(bonded) =>
                  actions.setBonded(connection, bonded)
                }
                onRemove={() => actions.removeConnection(connection)}
              />
            );
          })}
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
