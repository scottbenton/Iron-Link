import { Box, Checkbox, FormControlLabel, FormHelperText } from "@mui/material";
import { ReactNode, useId } from "react";

// Where a checkbox's label text starts, so explanations line up under it:
// the checkbox is 42px wide and FormControlLabel pulls it 11px left.
export const WORLD_SETTING_INDENT = "31px";

// One on/off world setting: a checkbox, its label, and a one-line
// explanation beneath. Settings stack in a column, so each has room for its
// explanation. The label alone names the checkbox; the explanation and any
// note (such as why it is disabled) describe it.
export function WorldSettingCheckbox({
  label,
  description,
  note,
  checked,
  disabled,
  onChange,
  children,
}: {
  label: string;
  description?: ReactNode;
  // Shown after the description, for example why the setting is locked.
  note?: ReactNode;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
  // Indented under the label, such as an action next to the note.
  children?: ReactNode;
}) {
  const descriptionId = useId();
  const noteId = useId();
  const describedBy =
    [description && descriptionId, note && noteId].filter(Boolean).join(" ") ||
    undefined;
  return (
    <Box>
      <FormControlLabel
        sx={{ alignItems: "flex-start", mr: 0 }}
        control={
          <Checkbox
            checked={checked}
            disabled={disabled}
            onChange={(_, next) => onChange(next)}
            sx={{ mt: -1 }}
            slotProps={{ input: { "aria-describedby": describedBy } }}
          />
        }
        label={label}
      />
      {(description || note || children) && (
        <Box sx={{ pl: WORLD_SETTING_INDENT, mt: -0.5 }}>
          {description && (
            <FormHelperText id={descriptionId} sx={{ m: 0 }}>
              {description}
            </FormHelperText>
          )}
          {note && (
            <FormHelperText id={noteId} sx={{ m: 0 }}>
              {note}
            </FormHelperText>
          )}
          {children}
        </Box>
      )}
    </Box>
  );
}
