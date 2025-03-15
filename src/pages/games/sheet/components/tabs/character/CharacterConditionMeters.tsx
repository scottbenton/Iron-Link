import { DebouncedConditionMeter } from "@/components/datasworn/ConditonMeter";
import { DEFAULT_MOMENTUM } from "@/data/constants";
import { momentumTrack } from "@/data/defaultTracks";
import { useGameTranslations } from "@/hooks/i18n/useGameTranslations";
import { useCharacterId } from "@/hooks/useCharacterId";
import { useGameId } from "@/hooks/useGameId";
import { useMomentumParameters } from "@/hooks/useMomentumParameters";
import { useIsOwnerOfCharacter } from "@/hooks/usePermissions";
import { useConditionMeterRules } from "@/stores/dataswornTree.store";
import { useGameStore } from "@/stores/game.store";
import {
  useGameCharacter,
  useGameCharactersStore,
} from "@/stores/gameCharacters.store";
import { Box, Heading } from "@chakra-ui/react";
import { RotateCcw } from "lucide-react";
import { useCallback } from "react";

import { SingleConditionMeter } from "./SingleConditionMeter";

export function CharacterConditionMeters() {
  const t = useGameTranslations();
  const gameId = useGameId();
  const characterId = useCharacterId();

  const isCharacterOwner = useIsOwnerOfCharacter();

  const conditionMeterRules = useConditionMeterRules();
  const characterConditionMeters = useGameCharacter(
    (character) => character?.conditionMeters ?? {},
  );
  const gameConditionMeters = useGameStore(
    (store) => store.game?.conditionMeters ?? {},
  );
  const momentum = useGameCharacter(
    (character) => character?.momentum ?? DEFAULT_MOMENTUM,
  );
  const adds = useGameCharacter((character) => character?.adds ?? 0);

  const updateGameConditionMeter = useGameStore(
    (store) => store.updateConditionMeter,
  );
  const updateCharacterConditionMeter = useGameCharactersStore(
    (store) => store.updateCharacterConditionMeterValue,
  );

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

  const updateCharacterMomentum = useGameCharactersStore(
    (store) => store.updateCharacterMomentum,
  );
  const handleMomentumChange = useCallback(
    (value: number) => {
      if (characterId) {
        updateCharacterMomentum(characterId, value).catch(() => {});
      }
    },
    [characterId, updateCharacterMomentum],
  );

  const { resetValue, max } = useMomentumParameters();

  return (
    <Box>
      <Heading size="xl" textTransform="uppercase">
        {t("meters-section-heading", "Meters")}
      </Heading>
      <Box display="flex" flexWrap="wrap" gap={2}>
        {Object.entries(conditionMeterRules).map(([key, rule]) => (
          <SingleConditionMeter
            key={key}
            conditionMeterKey={key}
            rule={rule}
            value={
              rule.shared
                ? gameConditionMeters[key]
                : characterConditionMeters[key]
            }
            onChange={handleConditionMeterChange}
            disabled={!isCharacterOwner}
            momentum={momentum}
            adds={adds}
          />
        ))}
        <DebouncedConditionMeter
          label={t("character-momentum-track", "Momentum")}
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
            ActionIcon: RotateCcw,
          }}
          disabled={!isCharacterOwner}
        />
      </Box>
    </Box>
  );
}
