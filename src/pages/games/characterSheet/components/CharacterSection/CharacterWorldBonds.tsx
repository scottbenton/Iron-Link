import LinkOffIcon from "@mui/icons-material/LinkOff";
import {
  Box,
  IconButton,
  Link,
  List,
  ListItem,
  Tooltip,
  Typography,
} from "@mui/material";
import { useTranslation } from "react-i18next";

import { useWorldBondActions } from "components/worlds/bonds/useWorldBondActions";
import { useWorldBondMechanics } from "components/worlds/bonds/useWorldBondMechanics";
import { useWorldEntryNotesLinkProps } from "components/worlds/bonds/useWorldEntryNotesLinkProps";

import { useWorldEntriesStore } from "stores/worldEntries.store";
import {
  useCharacterBonds,
  useListenToCharacterBonds,
} from "stores/worldEntryBonds.store";

import { IWorldEntryBond } from "services/worldEntryBonds.service";

import { useCanEditCharacter } from "../../hooks/useCanEditCharacter";
import { useCharacterId } from "../../hooks/useCharacterId";
import { useGameWorldId } from "../NotesSection/hooks/useGameWorld";

// The character's Ironlands bonds with entries of the game's world, under
// the Legacy Tracks they mark. Each links back to its entry in Notes, where
// bonds are formed. Starforged connections live on the Tracks tab
// (CharacterConnections).
export function CharacterWorldBonds() {
  const { t } = useTranslation();
  const characterId = useCharacterId();
  const canEdit = useCanEditCharacter();
  const worldId = useGameWorldId();
  const mechanics = useWorldBondMechanics();
  const isBond = mechanics?.kind === "bond";
  useListenToCharacterBonds(worldId && isBond ? characterId : undefined);
  const entries = useWorldEntriesStore((store) => store.entryState.entries);
  const bonds = useCharacterBonds(characterId)
    .filter((bond) => bond.worldId === worldId && entries[bond.entryId])
    .sort((a, b) =>
      entries[a.entryId].name.localeCompare(entries[b.entryId].name),
    );
  const actions = useWorldBondActions(mechanics);
  const getEntryLinkProps = useWorldEntryNotesLinkProps(worldId);

  if (!worldId || !isBond) return null;

  return (
    <Box>
      <Typography
        variant="h6"
        component="h3"
        textTransform="uppercase"
        fontFamily="fontFamilyTitle"
      >
        {t("character.bonds.bonds", "Bonds")}
      </Typography>
      {bonds.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          {t(
            "character.bonds.no-bonds",
            "Form bonds from a world entry's page in Notes.",
          )}
        </Typography>
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
