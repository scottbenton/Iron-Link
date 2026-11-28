import { Datasworn } from "@datasworn-community/core";
import { useCallback } from "react";

import { ConditionMeter } from "ui/game/ConditionMeter";
import { capitalize } from "ui/game/shared";

import { useRollStatAndAddToLog } from "pages/games/hooks/useRollStatAndAddToLog";

import { useDebouncedSync } from "hooks/useDebouncedSync";

interface SingleConditionMeterProps {
  conditionMeterKey: string;
  rule: Datasworn.ConditionMeterRule;
  value: number | undefined;
  /** Saves a step. Without it the meter is read-only and can't be rolled. */
  onChange?: (key: string, value: number, isShared: boolean) => void;
  momentum: number;
  adds: number;
}

// A condition meter whose steps are saved after a pause, so clicking down
// several steps is one save.
export function SingleConditionMeter(props: SingleConditionMeterProps) {
  const { conditionMeterKey, rule, value, onChange, momentum, adds } = props;

  const isShared = rule.shared;

  const persist = useCallback(
    (next: number) => onChange?.(conditionMeterKey, next, isShared),
    [conditionMeterKey, onChange, isShared],
  );
  const [localValue, setLocalValue] = useDebouncedSync(
    persist,
    value ?? rule.value,
  );

  const rollConditionMeter = useRollStatAndAddToLog();
  const handleRoll = useCallback(
    () =>
      rollConditionMeter({
        statId: conditionMeterKey,
        statLabel: rule.label,
        statModifier: localValue,
        momentum,
        moveId: undefined,
        adds,
      }).action,
    [rollConditionMeter, conditionMeterKey, rule, localValue, momentum, adds],
  );

  return (
    <ConditionMeter
      label={capitalize(rule.label)}
      value={localValue}
      min={rule.min}
      max={rule.max}
      warnAtMin
      adds={adds}
      onChange={onChange ? setLocalValue : undefined}
      onRoll={onChange ? handleRoll : undefined}
    />
  );
}
