import ResetIcon from "@mui/icons-material/RestartAlt";
import { Box, Typography } from "@mui/material";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";

import { DebouncedConditionMeter } from "components/datasworn/ConditonMeter";

import { useGameId } from "pages/games/gamePageLayout/hooks/useGameId.ts";

import { useConditionMeterRules } from "stores/dataswornTree.store.ts";
import { useGameStore } from "stores/game.store.ts";
import {
  useGameCharacter,
  useGameCharactersStore,
} from "stores/gameCharacters.store.ts";

import { momentumTrack } from "data/defaultTracks";

import { DEFAULT_MOMENTUM } from "../../../../../data/constants.ts";
import { useCharacterId } from "../../hooks/useCharacterId.ts";
import { useIsOwnerOfCharacter } from "../../hooks/useIsOwnerOfCharacter.ts";
import { useMomentumParameters } from "../../hooks/useMomentumResetValue.ts";
import { SingleConditionMeter } from "./SingleConditionMeter.tsx";

export function ConditionMeters() {
  const gameId = useGameId();
  const characterId = useCharacterId();
  const isCharacterOwner = useIsOwnerOfCharacter();

  const gameConditionMeterValues = useGameStore(
    (store) => store.game?.conditionMeters ?? {},
  );
  const updateGameConditionMeter = useGameStore(
    (store) => store.updateConditionMeter,
  );

  const conditionMeterValues = useGameCharacter(
    (character) => character?.conditionMeters ?? {},
  );
  const updateCharacterConditionMeter = useGameCharactersStore(
    (store) => store.updateCharacterConditionMeterValue,
  );

  const momentum = useGameCharacter((character) => {
    return character?.momentum ?? DEFAULT_MOMENTUM;
  });
  const updateCharacterMomentum = useGameCharactersStore(
    (store) => store.updateCharacterMomentum,
  );

  const adds = useGameCharacter((character) => character?.adds ?? 0);

  const { resetValue, max } = useMomentumParameters();

  const conditionMeterRules = useConditionMeterRules();

  const { t } = useTranslation();

  const handleConditionMeterChange = useCallback(
    (key: string, value: number, isShared: boolean) => {
      if (isShared) {
        updateGameConditionMeter(gameId, key, value).catch(() => {});
      }
      if (characterId && !isShared) {
        updateCharacterConditionMeter(characterId, key, value).catch(() => {});
      }
    },
    [
      gameId,
      characterId,
      updateGameConditionMeter,
      updateCharacterConditionMeter,
    ],
  );

  const handleMomentumChange = useCallback(
    (value: number) => {
      if (characterId) {
        updateCharacterMomentum(characterId, value).catch(() => {});
      }
    },
    [characterId, updateCharacterMomentum],
  );

  return (
    <Box>
      <Typography
        variant="h6"
        textTransform="uppercase"
        fontFamily="fontFamilyTitle"
      >
        {t("character.character-sidebar.meters", "Meters")}
      </Typography>
      <Box display="flex" flexWrap="wrap" gap={1}>
        {Object.entries(conditionMeterRules).map(([key, rule]) => (
          <SingleConditionMeter
            key={key}
            conditionMeterKey={key}
            rule={rule}
            value={
              rule.shared
                ? gameConditionMeterValues[key]
                : conditionMeterValues[key]
            }
            onChange={handleConditionMeterChange}
            disabled={!isCharacterOwner}
            momentum={momentum}
            adds={adds}
          />
        ))}
        <DebouncedConditionMeter
          label={t("character.character-sidebar.momentum-track", "Momentum")}
          min={momentumTrack.min}
          max={max}
          defaultValue={resetValue}
          value={momentum}
          onChange={handleMomentumChange}
          onActionClick={(setValue) => {
            setValue(resetValue);
          }}
          action={{
            actionLabel: t(
              "character.character-sidebar.momentum-track-reset",
              "Reset",
            ),
            ActionIcon: ResetIcon,
          }}
          disabled={!isCharacterOwner}
        />
      </Box>
    </Box>
  );
}
