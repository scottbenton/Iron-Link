import { Checkbox } from "ui/components/Checkbox";
import { Select } from "ui/components/Select";
import { TextField } from "ui/components/TextField";
import { Clock } from "ui/game/Clock";
import { ConditionMeter } from "ui/game/ConditionMeter";

import { css } from "styled-system/css";

import { capitalize } from "../shared";
import {
  AssetCardState,
  AssetControl,
  AssetControlValue,
  getControlValue,
  sortByLabel,
} from "./assetData";
import { selectOptions } from "./selectOptions";

const meterRowStyles = css({
  display: "flex",
  alignItems: "flex-start",
  flexWrap: "wrap",
  gap: "3",
});

const impactsStyles = css({
  display: "grid",
  gap: "1.5",
  paddingBlockStart: "1.5",
});

const plainValue = (value: number) => String(value);

export interface AssetControlFieldProps {
  controlKey: string;
  control: AssetControl;
  state?: AssetCardState;
  onChange?: (key: string, value: AssetControlValue) => void;
  /** Rolls a rollable condition meter, with its current value. */
  onRoll?: (key: string, control: AssetControl, value: number) => void;
  rollLabel?: string;
}

/** One of an asset's controls: a meter, a toggle, a clock, a counter. */
export function AssetControlField(props: AssetControlFieldProps) {
  const { controlKey, control, state, onChange, onRoll, rollLabel } = props;
  const value = getControlValue(control, controlKey, state);
  const label = capitalize(control.label);
  const change = onChange
    ? (next: AssetControlValue) => onChange(controlKey, next)
    : undefined;

  switch (control.field_type) {
    case "condition_meter": {
      const meterValue = typeof value === "number" ? value : control.max;
      const impacts = sortByLabel(control.controls ?? {});
      return (
        <div className={meterRowStyles}>
          <ConditionMeter
            label={label}
            value={meterValue}
            min={control.min}
            max={control.max}
            onChange={change}
            onRoll={
              onRoll && control.rollable
                ? () => onRoll(controlKey, control, meterValue)
                : undefined
            }
            rollLabel={rollLabel}
            warnAtMin
          />
          {impacts.length > 0 && (
            <div className={impactsStyles}>
              {impacts.map(([key, impact]) => (
                <Checkbox
                  key={key}
                  size="sm"
                  label={capitalize(impact.label)}
                  checked={getControlValue(impact, key, state) === true}
                  readOnly={!onChange}
                  onCheckedChange={(checked) => onChange?.(key, checked)}
                />
              ))}
            </div>
          )}
        </div>
      );
    }
    case "checkbox":
    case "card_flip":
      return (
        <Checkbox
          size="sm"
          label={label}
          checked={value === true}
          readOnly={!onChange}
          onCheckedChange={(checked) => change?.(checked)}
        />
      );
    case "clock":
      return (
        <Clock
          label={label}
          segments={control.max}
          value={typeof value === "number" ? value : 0}
          onChange={change}
          size="sm"
        />
      );
    case "counter":
      return (
        <ConditionMeter
          label={label}
          value={typeof value === "number" ? value : control.min}
          min={control.min}
          max={control.max ?? 999}
          onChange={change}
          formatValue={plainValue}
          showPips={false}
        />
      );
    case "select_enhancement":
      return (
        <Select<string>
          label={label}
          size="sm"
          options={selectOptions(control)}
          value={typeof value === "string" ? value : null}
          readOnly={!onChange}
          onValueChange={(next) => {
            if (next !== null) change?.(next);
          }}
        />
      );
    case "text":
      return (
        <TextField
          label={label}
          size="sm"
          defaultValue={typeof value === "string" ? value : ""}
          readOnly={!onChange}
          onValueChange={(next) => change?.(next)}
        />
      );
    default:
      return null;
  }
}
