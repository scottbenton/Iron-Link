import { Datasworn } from "@datasworn-community/core";
import { TextField, capitalize } from "@mui/material";

export interface AssetTextFieldProps {
  field: Datasworn.TextField;
  value?: string;
  onChange?: (value: string) => void;
}

export function AssetTextField(props: AssetTextFieldProps) {
  const { field, value, onChange } = props;
  const { label, value: defaultValue } = field;

  return (
    <TextField
      label={capitalize(label)}
      defaultValue={value ?? defaultValue ?? ""}
      disabled={!onChange}
      onChange={(evt) => onChange && onChange(evt.target.value)}
      variant={"standard"}
      sx={{ mt: 0.5 }}
      fullWidth
    />
  );
}
