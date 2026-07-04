import { Datasworn } from "@datasworn-community/core";

import { ConditionMeter } from "../../ConditonMeter";

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
      <ConditionMeter
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
