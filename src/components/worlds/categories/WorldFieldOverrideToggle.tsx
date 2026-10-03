import { Box, FormControlLabel, Switch } from "@mui/material";
import type { ReactNode } from "react";

export function WorldFieldOverrideToggle({
  label,
  checked,
  disabled,
  onToggle,
  children,
}: {
  label: string;
  checked: boolean;
  disabled: boolean;
  onToggle: (checked: boolean) => void;
  children: ReactNode;
}) {
  return (
    <Box>
      <FormControlLabel
        control={
          <Switch
            size="small"
            checked={checked}
            disabled={disabled}
            onChange={(_, next) => onToggle(next)}
          />
        }
        label={label}
      />
      {checked && <Box sx={{ pl: 5, pt: 1 }}>{children}</Box>}
    </Box>
  );
}
