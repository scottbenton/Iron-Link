import CheckIcon from "@mui/icons-material/Check";
import { Box, Chip, Typography } from "@mui/material";
import { useId } from "react";
import { useTranslation } from "react-i18next";

import { getWorldEntryBondKey } from "services/worldEntryBonds.service";
import type { IWorldEntryBond } from "services/worldEntryBonds.service";

import type { WorldBondCharacter } from "./useWorldBondCharacters";

// Ironlands bonds: one chip per character in the game, pressed while the
// character shares a bond with this entry. Only people who may edit a
// character can toggle its chip.
export function WorldEntryBondChips({
  entryId,
  characters,
  bonds,
  onToggle,
}: {
  entryId: string;
  characters: WorldBondCharacter[];
  bonds: IWorldEntryBond[];
  onToggle: (characterId: string, bonded: boolean) => void;
}) {
  const { t } = useTranslation();
  const labelId = useId();
  const bonded = new Set(bonds.map(getWorldEntryBondKey));

  if (characters.length === 0) return null;

  return (
    <Box
      role="group"
      aria-labelledby={labelId}
      sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 1 }}
    >
      <Typography
        id={labelId}
        variant="overline"
        component="span"
        color="text.secondary"
        sx={{ lineHeight: 1, mr: 0.5 }}
      >
        {t("worlds.bonds.title", "Bonds")}
      </Typography>
      {characters.map((character) => {
        const isBonded = bonded.has(
          getWorldEntryBondKey({ entryId, characterId: character.id }),
        );
        return (
          <Chip
            key={character.id}
            label={character.name}
            icon={isBonded ? <CheckIcon /> : undefined}
            color={isBonded ? "primary" : "default"}
            variant={isBonded ? "filled" : "outlined"}
            aria-pressed={character.canEdit ? isBonded : undefined}
            aria-label={
              character.canEdit
                ? undefined
                : isBonded
                  ? t("worlds.bonds.chip-bonded", "{{name}}, bonded", {
                      name: character.name,
                    })
                  : t("worlds.bonds.chip-not-bonded", "{{name}}, not bonded", {
                      name: character.name,
                    })
            }
            onClick={
              character.canEdit
                ? () => onToggle(character.id, !isBonded)
                : undefined
            }
          />
        );
      })}
    </Box>
  );
}
