import { Datasworn } from "@datasworn-community/core";
import { ListSubheader, MenuItem, TextField, capitalize } from "@mui/material";
import { ReactNode } from "react";

export interface AssetSelectEnhancementFieldProps {
  field: Datasworn.SelectEnhancementField;
  value?: string;
  onChange?: (value: string) => void;
}

export function AssetSelectEnhancementField(
  props: AssetSelectEnhancementFieldProps,
) {
  const { field, value, onChange } = props;
  const { label, value: defaultValue, choices } = field;

  const children: ReactNode[] = [];
  Object.entries(choices).forEach(([choiceKey, choice]) => {
    if (choice.choice_type === "choice_group") {
      children.push(
        <ListSubheader key={choiceKey}>{choice.name}</ListSubheader>,
      );
      Object.entries(choice.choices).forEach(([subChoiceKey, subChoice]) => {
        children.push(
          <MenuItem key={subChoiceKey} value={subChoiceKey}>
            {capitalize(subChoice.label)}
          </MenuItem>,
        );
      });
    } else {
      children.push(
        <MenuItem key={choiceKey} value={choiceKey}>
          {capitalize(choice.label)}
        </MenuItem>,
      );
    }
  });

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
      {children}
    </TextField>
  );
}
