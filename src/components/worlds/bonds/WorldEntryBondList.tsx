import { Checkbox, FormControlLabel, FormGroup } from "@mui/material";
import { useTranslation } from "react-i18next";

import { IWorldEntry } from "services/worldEntries.service";
import { getWorldEntryBondKey } from "services/worldEntryBonds.service";
import type { IWorldEntryBond } from "services/worldEntryBonds.service";

import { WorldBondSection } from "./WorldBondSection";
import type { WorldBondCharacter } from "./useWorldBondCharacters";

// Ironlands bonds: every character in the game, checked while they share a
// bond with this entry. Only people who may edit a character can change its
// box; the rest show its state.
export function WorldEntryBondList({
  entry,
  characters,
  bonds,
  onToggle,
}: {
  entry: IWorldEntry;
  characters: WorldBondCharacter[];
  bonds: IWorldEntryBond[];
  onToggle: (characterId: string, bonded: boolean) => void;
}) {
  const { t } = useTranslation();
  const bonded = new Set(bonds.map(getWorldEntryBondKey));
  const anyEditable = characters.some((character) => character.canEdit);

  return (
    <WorldBondSection
      title={t("worlds.bonds.title", "Bonds")}
      description={
        anyEditable
          ? t(
              "worlds.bonds.list-description",
              "Check each character who has a bond with {{entry}}. Their Bonds track is marked for them.",
              { entry: entry.name },
            )
          : t(
              "worlds.bonds.list-description-readonly",
              "Characters with a bond with {{entry}} are checked.",
              { entry: entry.name },
            )
      }
    >
      <FormGroup sx={{ alignItems: "flex-start" }}>
        {characters.map((character) => (
          <FormControlLabel
            key={character.id}
            disabled={!character.canEdit}
            control={
              <Checkbox
                checked={bonded.has(
                  getWorldEntryBondKey({
                    entryId: entry.id,
                    characterId: character.id,
                  }),
                )}
                onChange={(_, checked) => onToggle(character.id, checked)}
              />
            }
            label={character.name}
          />
        ))}
      </FormGroup>
    </WorldBondSection>
  );
}
