import { Datasworn } from "@datasworn-community/core";
import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";

import { AddsControl } from "ui/game/ConditionMeter";
import { MoveRollGroup } from "ui/game/MoveCard";

import { useRollStatAndAddToLog } from "pages/games/hooks/useRollStatAndAddToLog";

import {
  useConditionMeterRules,
  useDataswornTree,
  useStatRules,
} from "stores/dataswornTree.store";
import { useGameCharactersStore } from "stores/gameCharacters.store";

import { IAsset } from "services/asset.service";

import { CharacterRollOptionState } from "./common.types";
import { ActionRollOption, getActionRollOptions } from "./getActionRollOptions";

export interface ActionRollsProps {
  moveId: string;
  moveName: string;
  actionRolls: Datasworn.RollableValue[];
  character: {
    id: string;
    data: CharacterRollOptionState;
    assets: Record<string, IAsset>;
  };
  gameAssets: Record<string, IAsset>;
  gameConditionMeters: Record<string, number>;
}

// A character's action rolls for a move, with the Adds the next one takes.
export function ActionRolls(props: ActionRollsProps) {
  const {
    moveId,
    moveName,
    actionRolls,
    character,
    gameAssets,
    gameConditionMeters,
  } = props;
  const { t } = useTranslation();
  const rollStat = useRollStatAndAddToLog();
  const stats = useStatRules();
  const conditionMeters = useConditionMeterRules();
  const tree = useDataswornTree();

  const options = useMemo(
    () =>
      getActionRollOptions(
        actionRolls,
        {
          character: character.data,
          assets: { ...character.assets, ...gameAssets },
          gameConditionMeters,
          stats,
          conditionMeters,
          tree,
        },
        t,
      ),
    [
      actionRolls,
      character,
      gameAssets,
      gameConditionMeters,
      stats,
      conditionMeters,
      tree,
      t,
    ],
  );

  const characterId = character.id;
  const updateAdds = useGameCharactersStore(
    (store) => store.updateCharacterAdds,
  );
  const handleAddsChange = useCallback(
    (adds: number) => {
      updateAdds(characterId, adds).catch(() => {});
    },
    [characterId, updateAdds],
  );

  const adds = character.data.adds ?? 0;
  const roll = (option: ActionRollOption) =>
    rollStat({
      statId: option.statId,
      statLabel: option.rollLabel,
      statModifier: option.value,
      moveId,
      adds,
      momentum: character.data.momentum,
      characterId,
    });

  if (options.length === 0) return null;

  return (
    <MoveRollGroup
      moveName={moveName}
      label={t("datasworn.move.roll-with", "Roll with")}
      options={options}
      adds={adds}
      onRoll={roll}
    >
      <AddsControl
        label={t("character.character-sidebar.adds", "Adds")}
        value={adds}
        onChange={handleAddsChange}
      />
    </MoveRollGroup>
  );
}
