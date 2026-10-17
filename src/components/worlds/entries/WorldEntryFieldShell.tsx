import CasinoIcon from "@mui/icons-material/Casino";
import { Box, IconButton, Tooltip, Typography } from "@mui/material";
import { ReactNode, useId } from "react";
import { useTranslation } from "react-i18next";

export interface WorldEntryFieldShellProps {
  label: string;
  helpText?: string;
  // Where the label points. Without one the label names a group, for values
  // that are not a single input, and the field is read only. The input is
  // described by getWorldEntryFieldHelpId(inputId).
  inputId?: string;
  // Shows dice that roll the field's oracle: always while the field is
  // empty or on a touchscreen, and on hover or focus once it holds a value.
  onRoll?: () => void;
  empty?: boolean;
  children: ReactNode;
}

// One field of an entry: its label above its value, help text below. The
// value fills the cell, so an editable field reads like text until it is
// used, then shows an outline around it while it has focus.
export function WorldEntryFieldShell({
  label,
  helpText,
  inputId,
  onRoll,
  empty,
  children,
}: WorldEntryFieldShellProps) {
  const { t } = useTranslation();
  const labelId = useId();
  const groupHelpId = useId();
  const helpId = inputId ? getWorldEntryFieldHelpId(inputId) : groupHelpId;
  const rollLabel = t("worlds.entries.roll-field", "Roll {{field}}", {
    field: label,
  });

  return (
    <Box
      role={inputId ? undefined : "group"}
      aria-labelledby={inputId ? undefined : labelId}
      aria-describedby={!inputId && helpText ? helpId : undefined}
      sx={
        inputId
          ? {
              position: "relative",
              borderRadius: 1,
              mx: -1,
              px: 1,
              py: 0.5,
              transition: (theme) =>
                theme.transitions.create(["background-color", "box-shadow"], {
                  duration: theme.transitions.duration.shortest,
                }),
              // Hover only where something can hover, so a tap never
              // leaves a field looking active.
              "@media (hover: hover) and (pointer: fine)": {
                "&:hover": { bgcolor: "action.hover" },
                "&:hover .world-entry-field-roll": { opacity: 1 },
              },
              "& .world-entry-field-roll": {
                opacity: empty ? 1 : 0,
                "@media (hover: none), (pointer: coarse)": { opacity: 1 },
              },
              "&:focus-within .world-entry-field-roll": { opacity: 1 },
              "&:focus-within": {
                bgcolor: "action.hover",
                boxShadow: (theme) =>
                  `inset 0 0 0 2px ${theme.palette.primary.main}`,
              },
            }
          : { position: "relative", mx: -1, px: 1, py: 0.5 }
      }
    >
      <Typography
        id={labelId}
        component={inputId ? "label" : "div"}
        htmlFor={inputId}
        variant="body2"
        color="text.secondary"
        sx={{
          display: "block",
          fontSize: 12.5,
          fontWeight: 500,
          lineHeight: 1.5,
          pr: onRoll ? 4 : 0,
        }}
      >
        {label}
      </Typography>
      {children}
      {helpText && (
        <Typography
          id={helpId}
          variant="caption"
          component="div"
          color="text.secondary"
          sx={{ mt: 0.25 }}
        >
          {helpText}
        </Typography>
      )}
      {onRoll && (
        <Tooltip title={rollLabel}>
          <IconButton
            className="world-entry-field-roll"
            size="small"
            aria-label={rollLabel}
            onClick={onRoll}
            sx={{ position: "absolute", top: 0, right: 0 }}
          >
            <CasinoIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
    </Box>
  );
}

export function getWorldEntryFieldHelpId(inputId: string) {
  return `${inputId}-help`;
}

// The placeholder of an empty field.
export function useEmptyFieldText() {
  const { t } = useTranslation();
  return t("worlds.entries.empty-field", "Empty");
}

// Inputs inside a field look like its value: no border, the value's size,
// and an italic placeholder.
export const worldEntryValueInputSx = {
  fontSize: 15,
  lineHeight: 1.45,
  p: 0,
  "& .MuiInputBase-input": { p: 0 },
  "& .MuiInputBase-input::placeholder": {
    fontStyle: "italic",
    fontSize: 14,
    opacity: 1,
    color: "text.disabled",
  },
} as const;
