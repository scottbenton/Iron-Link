import { useCallback } from "react";
import { useTranslation } from "react-i18next";

import { SectionHeading } from "ui/layout";
import { Grid, Stack } from "ui/primitives";

import { useGameId } from "pages/games/gamePageLayout/hooks/useGameId.ts";

import { useConditionMeterRules } from "stores/dataswornTree.store.ts";
import { useGameStore } from "stores/game.store.ts";
import {
  useGameCharacter,
  useGameCharactersStore,
} from "stores/gameCharacters.store.ts";

import { DEFAULT_MOMENTUM } from "../../../../../data/constants.ts";
import { useCanEditCharacter } from "../../hooks/useCanEditCharacter.ts";
import { useCharacterId } from "../../hooks/useCharacterId.ts";
import { MomentumMeterSection } from "./MomentumMeterSection.tsx";
import { SingleConditionMeter } from "./SingleConditionMeter.tsx";

export function ConditionMeters() {
  const { t } = useTranslation();
  const gameId = useGameId();
  const characterId = useCharacterId();
  const canEditCharacter = useCanEditCharacter();

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

  const momentum = useGameCharacter(
    (character) => character?.momentum ?? DEFAULT_MOMENTUM,
  );
  const adds = useGameCharacter((character) => character?.adds ?? 0);

  const conditionMeterRules = useConditionMeterRules();

  // Shared meters (Starforged's supply) belong to the game.
  const handleConditionMeterChange = useCallback(
    (key: string, value: number, isShared: boolean) => {
      if (isShared) {
        updateGameConditionMeter(gameId, key, value).catch(() => {});
      } else if (characterId) {
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

  return (
    <Stack gap="2" as="section">
      <SectionHeading
        title={t("character.character-sidebar.meters", "Meters")}
        as="h3"
      />
      {/* As many meters to a row as fit, each at least a meter's width. */}
      <Grid gap="2" gridTemplateColumns="repeat(auto-fill, minmax(112px, 1fr))">
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
            onChange={canEditCharacter ? handleConditionMeterChange : undefined}
            momentum={momentum}
            adds={adds}
          />
        ))}
        <MomentumMeterSection />
      </Grid>
    </Stack>
  );
}
