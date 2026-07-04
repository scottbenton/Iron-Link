import { Datasworn } from "@datasworn-community/core";
import { MenuItem, TextField, capitalize } from "@mui/material";

export interface AssetSelectValueFieldProps {
  field: Datasworn.SelectValueField;
  value?: string;
  onChange?: (value: string) => void;
}

export function AssetSelectValueField(props: AssetSelectValueFieldProps) {
  const { field, value, onChange } = props;
  const { label, value: defaultValue, choices } = field;

  return (
    <TextField
      select
      label={capitalize(label)}
      defaultValue={value ?? defaultValue ?? ""}
      disabled={!onChange}
      onChange={(evt) => onChange && onChange(evt.target.value)}
      variant={"standard"}
      sx={{ mt: 0.5 }}
      fullWidth
    >
      {Object.entries(choices).map(([choiceKey, choice]) => (
        <MenuItem key={choiceKey} value={choiceKey}>
          {capitalize(choice.label)}
        </MenuItem>
      ))}
    </TextField>
  );
}
