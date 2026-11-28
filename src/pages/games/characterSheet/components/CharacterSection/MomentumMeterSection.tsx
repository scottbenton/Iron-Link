import { useCallback } from "react";
import { useTranslation } from "react-i18next";

import { MomentumMeter } from "ui/game/ConditionMeter";

import { useDebouncedSync } from "hooks/useDebouncedSync";

import { useDataswornTreeStore } from "stores/dataswornTree.store.ts";
import {
  useGameCharacter,
  useGameCharactersStore,
} from "stores/gameCharacters.store.ts";

import { momentumTrack } from "data/defaultTracks";
import { elegyRulesetConfig } from "data/package.config.ts";

import { DEFAULT_MOMENTUM } from "../../../../../data/constants.ts";
import { useCanEditCharacter } from "../../hooks/useCanEditCharacter.ts";
import { useCharacterId } from "../../hooks/useCharacterId.ts";
import { useMomentumParameters } from "../../hooks/useMomentumResetValue.ts";

// Momentum (Focus in Elegy). Its value opens a menu with Reset; burning
// momentum happens from a roll.
export function MomentumMeterSection() {
  const { t } = useTranslation();
  const characterId = useCharacterId();
  const canEditCharacter = useCanEditCharacter();

  const momentum = useGameCharacter(
    (character) => character?.momentum ?? DEFAULT_MOMENTUM,
  );
  const updateCharacterMomentum = useGameCharactersStore(
    (store) => store.updateCharacterMomentum,
  );
  const isElegyActive = useDataswornTreeStore(
    (store) => !!store.activeRules[elegyRulesetConfig.id],
  );
  const { resetValue, max } = useMomentumParameters();

  const persist = useCallback(
    (value: number) => {
      if (characterId) {
        updateCharacterMomentum(characterId, value).catch(() => {});
      }
    },
    [characterId, updateCharacterMomentum],
  );
  const [value, setValue] = useDebouncedSync(persist, momentum);

  return (
    <MomentumMeter
      label={
        isElegyActive
          ? t("character.character-sidebar.elegy-focus-track", "Focus")
          : t("character.character-sidebar.momentum-track", "Momentum")
      }
      resetLabel={t(
        "character.character-sidebar.momentum-track-reset",
        "Reset",
      )}
      value={value}
      min={momentumTrack.min}
      max={max}
      resetValue={resetValue}
      onChange={canEditCharacter ? setValue : undefined}
    />
  );
}
