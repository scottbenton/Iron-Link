import { Datasworn } from "@datasworn/core";
import RollIcon from "@mui/icons-material/Casino";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";

import { DebouncedConditionMeter } from "components/datasworn/ConditonMeter";

import { useGamePermissions } from "pages/games/gamePageLayout/hooks/usePermissions";
import { useRollStatAndAddToLog } from "pages/games/hooks/useRollStatAndAddToLog";

import { CharacterPermissionType } from "stores/gameCharacters.store";

interface SingleConditionMeterProps {
  conditionMeterKey: string;
  rule: Datasworn.ConditionMeterRule;
  value: number | undefined;
  onChange: (key: string, value: number, isShared: boolean) => void;
  disabled?: boolean;
  momentum: number;
  adds: number;
}

export function SingleConditionMeter(props: SingleConditionMeterProps) {
  const { conditionMeterKey, rule, value, onChange, disabled, momentum, adds } =
    props;

  const isCharacterOwner =
    useGamePermissions().characterPermission === CharacterPermissionType.Owner;

  const { t } = useTranslation();

  const isShared = rule.shared;

  const handleChange = useCallback(
    (value: number) => onChange(conditionMeterKey, value, isShared),
    [conditionMeterKey, onChange, isShared],
  );

  const rollConditionMeter = useRollStatAndAddToLog();
  const handleRoll = useCallback(() => {
    rollConditionMeter({
      statId: conditionMeterKey,
      statLabel: rule.label,
      statModifier: value ?? rule.value,
      momentum,
      moveId: undefined,
      adds,
    });
  }, [rollConditionMeter, conditionMeterKey, rule, value, momentum, adds]);

  return (
    <DebouncedConditionMeter
      label={rule.label}
      min={rule.min}
      max={rule.max}
      defaultValue={rule.value}
      value={value}
      onChange={handleChange}
      disabled={disabled}
      action={
        isCharacterOwner
          ? {
              ActionIcon: RollIcon,
              actionLabel: t("datasworn.roll", "Roll"),
            }
          : undefined
      }
      onActionClick={isCharacterOwner ? handleRoll : undefined}
    />
  );
}
