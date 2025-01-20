import RollIcon from "@mui/icons-material/Casino";
import { Box, Typography } from "@mui/material";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";

import { DebouncedConditionMeter } from "components/datasworn/ConditonMeter";
import { Stat } from "components/datasworn/Stat";

import { useRollStatAndAddToLog } from "pages/games/hooks/useRollStatAndAddToLog.ts";

import { useStatRules } from "stores/dataswornTree.store.ts";
import {
  useGameCharacter,
  useGameCharactersStore,
} from "stores/gameCharacters.store.ts";

import { DEFAULT_MOMENTUM } from "../../../../../data/constants.ts";
import { useCharacterId } from "../../hooks/useCharacterId.ts";
import { useIsOwnerOfCharacter } from "../../hooks/useIsOwnerOfCharacter.ts";

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
  const isCharacterOwner = useIsOwnerOfCharacter();

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

  return (
    <Box>
      <Typography
        variant="h6"
        textTransform={"uppercase"}
        fontFamily="fontFamilyTitle"
      >
        {t("character.character-sidebar.stats", "Stats")}
      </Typography>
      <Box display="flex" flexWrap="wrap" gap={1}>
        {Object.entries(statRules).map(([key, statRule]) => (
          <Stat
            key={key}
            label={statRule.label}
            value={stats[key] ?? 0}
            action={
              isCharacterOwner
                ? {
                    actionLabel: t("common.roll", "Roll"),
                    ActionIcon: RollIcon,
                  }
                : undefined
            }
            onActionClick={
              isCharacterOwner
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
        <DebouncedConditionMeter
          label={t("character.character-sidebar.adds", "Adds")}
          min={-9}
          max={9}
          defaultValue={0}
          disabled={!isCharacterOwner}
          value={adds}
          onChange={handleAddsChange}
        />
      </Box>
    </Box>
  );
}
