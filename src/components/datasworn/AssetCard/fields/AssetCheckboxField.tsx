import { Datasworn } from "@datasworn-community/core";
import { Checkbox, FormControlLabel, capitalize } from "@mui/material";

export interface AssetCheckboxFieldProps {
  field: Datasworn.AssetCheckboxField | Datasworn.AssetCardFlipField;
  value?: boolean;
  onChange?: (value: boolean) => void;
}

export function AssetCheckboxField(props: AssetCheckboxFieldProps) {
  const { field, value, onChange } = props;

  return (
    <FormControlLabel
      control={
        <Checkbox
          checked={value ?? field.value ?? false}
          disabled={!onChange}
          onChange={(_, checked) => onChange && onChange(checked)}
        />
      }
      label={capitalize(field.label)}
    />
  );
}
