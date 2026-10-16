import { Box } from "@mui/material";
import type { ReactNode } from "react";

import {
  WORLD_SETTING_INDENT,
  WorldSettingCheckbox,
} from "../WorldSettingCheckbox";

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
      <WorldSettingCheckbox
        label={label}
        checked={checked}
        disabled={disabled}
        onChange={onToggle}
      />
      {checked && (
        <Box sx={{ pl: WORLD_SETTING_INDENT, pt: 1 }}>{children}</Box>
      )}
    </Box>
  );
}
