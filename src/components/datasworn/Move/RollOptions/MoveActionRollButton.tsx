import { Stat } from "@/components/datasworn/Stat";
import { useRollStatAndAddToLog } from "@/hooks/useRollStatAndAddToLog";
import { IAsset } from "@/services/asset.service";
import {
  useConditionMeterRules,
  useStatRules,
} from "@/stores/dataswornTree.store";
import { Datasworn } from "@datasworn/core";
import { DicesIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

import { MoveActionAssetControl } from "./MoveActionAssetControl";
import { CharacterRollOptionState } from "./common.types";

export interface MoveActionRollButtonProps {
  moveId: string;
  disabled?: boolean;
  rollOption: Datasworn.RollableValue;
  characterData: CharacterRollOptionState;
  characterAssets: Record<string, IAsset>;
  gameAssets: Record<string, IAsset>;
  gameConditionMeters: Record<string, number>;
  characterId: string;
}

export function MoveActionRollButton(props: MoveActionRollButtonProps) {
  const {
    moveId,
    rollOption,
    disabled,
    characterData,
    gameConditionMeters,
    characterId,
  } = props;
  const { t } = useTranslation();
  const rollStat = useRollStatAndAddToLog();

  const stats = useStatRules();
  const conditionMeters = useConditionMeterRules();

  if (rollOption.using === "stat" && stats[rollOption.stat]) {
    const statRule = stats[rollOption.stat];
    const characterStatValue = characterData.stats[rollOption.stat] ?? 0;
    return (
      <Stat
        disabled={disabled}
        label={statRule.label}
        value={characterStatValue}
        action={{
          actionLabel: t("datasworn.roll"),
          ActionIcon: DicesIcon,
        }}
        onActionClick={() => {
          rollStat({
            statId: rollOption.stat,
            statLabel: statRule.label,
            statModifier: characterStatValue,
            moveId,
            adds: characterData.adds ?? 0,
            momentum: characterData.momentum,
            characterId,
          });
        }}
      />
    );
  }

  if (
    rollOption.using === "condition_meter" &&
    conditionMeters[rollOption.condition_meter]
  ) {
    const conditionMeterRule = conditionMeters[rollOption.condition_meter];
    const currentValue =
      (conditionMeterRule.shared
        ? gameConditionMeters[rollOption.condition_meter]
        : characterData.conditionMeters?.[rollOption.condition_meter]) ??
      conditionMeterRule.value;

    return (
      <Stat
        disabled={disabled}
        label={conditionMeterRule.label}
        value={currentValue}
        action={{
          actionLabel: t("datasworn.roll"),
          ActionIcon: DicesIcon,
        }}
        onActionClick={() => {
          rollStat({
            statId: rollOption.condition_meter,
            statLabel: conditionMeterRule.label,
            statModifier: currentValue,
            moveId,
            adds: characterData.adds ?? 0,
            momentum: characterData.momentum,
            characterId,
          });
        }}
      />
    );
  }
  if (rollOption.using === "custom") {
    return (
      <Stat
        disabled={disabled}
        label={rollOption.label}
        value={rollOption.value}
        action={{
          actionLabel: t("datasworn.roll"),
          ActionIcon: DicesIcon,
        }}
        onActionClick={() => {
          rollStat({
            statId: rollOption.label,
            statLabel: rollOption.label,
            statModifier: rollOption.value,
            moveId,
            adds: characterData.adds ?? 0,
            momentum: characterData.momentum,
            characterId,
          });
        }}
      />
    );
  }

  if (rollOption.using === "asset_control") {
    return <MoveActionAssetControl {...props} rollOption={rollOption} />;
  }

  console.error("Could not find rollOption", rollOption);
  return null;
}
