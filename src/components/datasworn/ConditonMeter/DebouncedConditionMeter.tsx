import {
  ConditionMeter,
  ConditionMeterProps,
} from "components/datasworn/ConditonMeter/ConditionMeter";

import { useDebouncedSync } from "hooks/useDebouncedSync";

import { useAnnounceMeterValue } from "./useAnnounceMeterValue";

export interface DebouncedConditionMeterProps
  extends Omit<ConditionMeterProps, "onChange" | "onActionClick"> {
  onActionClick?: (setValue: (value: number) => void) => void;
  onChange: (value: number) => void;
}

export function DebouncedConditionMeter(props: DebouncedConditionMeterProps) {
  const { onChange, onActionClick, ...conditionMeterProps } = props;

  const [value, setValue] = useDebouncedSync(
    onChange,
    conditionMeterProps.value ?? conditionMeterProps.defaultValue,
  );

  // An action that sets the value (Reset on momentum) is announced like a
  // change from the buttons; one that only rolls announces its own result.
  const announceValue = useAnnounceMeterValue();
  const setValueFromAction = (newValue: number) => {
    setValue(newValue);
    announceValue(conditionMeterProps.label, newValue);
  };

  return (
    <ConditionMeter
      {...conditionMeterProps}
      onActionClick={
        onActionClick ? () => onActionClick(setValueFromAction) : undefined
      }
      value={value}
      onChange={setValue}
    />
  );
}
