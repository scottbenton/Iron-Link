import PersonRemoveIcon from "@mui/icons-material/PersonRemove";
import { IconButton, Link, List, ListItem, Tooltip } from "@mui/material";
import { useTranslation } from "react-i18next";

import { EmptyState } from "components/Layout/EmptyState";
import { useWorldBondActions } from "components/worlds/bonds/useWorldBondActions";
import { useWorldBondMechanics } from "components/worlds/bonds/useWorldBondMechanics";
import { useWorldEntryNotesLinkProps } from "components/worlds/bonds/useWorldEntryNotesLinkProps";

import { useWorldEntriesStore } from "stores/worldEntries.store";
import {
  useCharacterBonds,
  useListenToCharacterBonds,
  useWorldEntryBondsStore,
} from "stores/worldEntryBonds.store";

import { IWorldEntryBond } from "services/worldEntryBonds.service";

import { useCanEditCharacter } from "../../hooks/useCanEditCharacter";
import { useCharacterIdOptional } from "../../hooks/useCharacterId";
import { useGameWorldId } from "../NotesSection/hooks/useGameWorld";
import { CollapsibleTrackSection } from "./CollapsibleTrackSection";

// The open character's Ironlands bonds with entries of the game's world,
// under its other tracks like Starforged connections (CharacterConnections).
// Each links back to its entry in Notes, where bonds are formed.
export function CharacterWorldBonds() {
  const { t } = useTranslation();
  const characterId = useCharacterIdOptional();
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
  const loaded = useWorldEntryBondsStore(
    (store) => store.loading[`character:${characterId}`] === false,
  );

  if (!characterId || !worldId || !isBond) return null;

  return (
    <CollapsibleTrackSection
      title={t("character.bonds.bonds", "Bonds")}
      loaded={loaded}
      shownCount={bonds.length}
    >
      {bonds.length === 0 ? (
        <EmptyState
          sx={{ my: 3 }}
          message={t(
            "character.bonds.no-bonds",
            "Form bonds from a world entry's page in Notes.",
          )}
        />
      ) : (
        <List dense sx={{ mt: 1 }}>
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
                        <PersonRemoveIcon />
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
    </CollapsibleTrackSection>
  );
}
