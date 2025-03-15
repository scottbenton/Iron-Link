import { Datasworn } from "@datasworn/core";

import { DebouncedConditionMeter } from "../../ConditonMeter";

export interface AssetCounterFieldProps {
  value?: number;
  field: Datasworn.CounterField;
  onChange?: (value: number) => void;
}

export function AssetCounterField(props: AssetCounterFieldProps) {
  const { value, field, onChange } = props;
  const { label, value: defaultValue, min, max } = field;

  return (
    <div>
      <DebouncedConditionMeter
        label={label}
        value={value}
        defaultValue={defaultValue}
        min={min}
        max={max ?? 999}
        onChange={onChange}
      />
    </div>
  );
}
