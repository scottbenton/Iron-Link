import { DebouncedConditionMeter } from "@/components/datasworn/ConditonMeter";
import { useGameTranslations } from "@/hooks/i18n/useGameTranslations";
import { useIsOwnerOfCharacter } from "@/hooks/usePermissions";
import { useRollStatAndAddToLog } from "@/hooks/useRollStatAndAddToLog";
import { Datasworn } from "@datasworn/core";
import { DicesIcon } from "lucide-react";
import { useCallback } from "react";

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

  const isCharacterOwner = useIsOwnerOfCharacter();

  const t = useGameTranslations();

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
              ActionIcon: DicesIcon,
              actionLabel: t("roll-condition-meter-label", "Roll"),
            }
          : undefined
      }
      onActionClick={isCharacterOwner ? handleRoll : undefined}
    />
  );
}
