import RollIcon from "@mui/icons-material/Casino";
import { Box, Typography } from "@mui/material";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";

import { ConditionMeter } from "components/datasworn/ConditonMeter";
import { Stat } from "components/datasworn/Stat";

import { useRollStatAndAddToLog } from "pages/games/hooks/useRollStatAndAddToLog.ts";

import { useIsMobile } from "hooks/useIsMobile";

import { useStatRules } from "stores/dataswornTree.store.ts";
import {
  useGameCharacter,
  useGameCharactersStore,
} from "stores/gameCharacters.store.ts";

import { DEFAULT_MOMENTUM } from "../../../../../data/constants.ts";
import { useCanEditCharacter } from "../../hooks/useCanEditCharacter.ts";
import { useCharacterId } from "../../hooks/useCharacterId.ts";

export function Stats() {
  const characterId = useCharacterId();

  const stats = useGameCharacter((character) => character?.stats ?? {});
  const adds = useGameCharacter((character) => character?.adds ?? 0);
  const momentum = useGameCharacter(
    (character) => character?.momentum ?? DEFAULT_MOMENTUM,
  );

  const updateAdds = useGameCharactersStore(
    (store) => store.updateCharacterAdds,
  );
  const canEditCharacter = useCanEditCharacter();

  const { t } = useTranslation();

  const statRules = useStatRules();

  const handleAddsChange = useCallback(
    (value: number) => {
      if (characterId) {
        updateAdds(characterId, value).catch(() => {});
      }
    },
    [characterId, updateAdds],
  );

  const rollStat = useRollStatAndAddToLog();
  const isMobile = useIsMobile();

  return (
    <Box>
      <Typography
        variant="h6"
        component="h3"
        textTransform={"uppercase"}
        fontFamily="fontFamilyTitle"
      >
        {t("character.character-sidebar.stats", "Stats")}
      </Typography>
      <Box
        display="grid"
        // Five across on phones; wider columns fill out as they fit.
        gridTemplateColumns={
          isMobile
            ? "repeat(5, minmax(0, 1fr))"
            : "repeat(auto-fill, minmax(64px, 1fr))"
        }
        gap={0.25}
        mx={-0.25}
      >
        {Object.entries(statRules).map(([key, statRule]) => (
          <Stat
            key={key}
            label={statRule.label}
            value={stats[key] ?? 0}
            action={
              canEditCharacter
                ? {
                    actionLabel: t("common.roll", "Roll"),
                    ActionIcon: RollIcon,
                  }
                : undefined
            }
            onActionClick={
              canEditCharacter
                ? () =>
                    rollStat({
                      statId: key,
                      statLabel: statRule.label,
                      statModifier: stats[key] ?? 0,
                      adds,
                      momentum,
                    })
                : undefined
            }
          />
        ))}
      </Box>
      <Box
        display="grid"
        gridTemplateColumns={
          isMobile
            ? "repeat(2, minmax(0, 1fr))"
            : "repeat(auto-fill, minmax(140px, 1fr))"
        }
        mt={1}
      >
        <ConditionMeter
          label={t("character.character-sidebar.adds", "Adds")}
          min={-9}
          max={9}
          defaultValue={0}
          disabled={!canEditCharacter}
          value={adds}
          onChange={handleAddsChange}
        />
      </Box>
    </Box>
  );
}
