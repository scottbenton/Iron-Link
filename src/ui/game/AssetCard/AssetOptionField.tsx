import { Select } from "ui/components/Select";
import { TextField } from "ui/components/TextField";

import { capitalize } from "../shared";
import { AssetOption } from "./assetData";
import { selectOptions } from "./selectOptions";

export interface AssetOptionFieldProps {
  optionKey: string;
  option: AssetOption;
  value?: string;
  onChange?: (key: string, value: string) => void;
}

/** One of an asset's fields: a name, a chosen stat, an enhancement. */
export function AssetOptionField(props: AssetOptionFieldProps) {
  const { optionKey, option, value, onChange } = props;
  const label = capitalize(option.label);
  const readOnly = !onChange;
  const current = value ?? (option.value as string | null) ?? undefined;

  if (option.field_type === "text") {
    return (
      <TextField
        label={label}
        size="sm"
        defaultValue={current ?? ""}
        readOnly={readOnly}
        onValueChange={(next) => onChange?.(optionKey, next)}
      />
    );
  }
  if (
    option.field_type === "select_value" ||
    option.field_type === "select_enhancement"
  ) {
    return (
      <Select<string>
        label={label}
        size="sm"
        options={selectOptions(option)}
        value={current ?? null}
        readOnly={readOnly}
        onValueChange={(next) => {
          if (next !== null) onChange?.(optionKey, next);
        }}
      />
    );
  }
  return null;
}
