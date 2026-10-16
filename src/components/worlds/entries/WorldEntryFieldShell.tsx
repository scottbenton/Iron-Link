import MoreVertIcon from "@mui/icons-material/MoreVert";
import {
  Box,
  IconButton,
  ListItemText,
  Menu,
  MenuItem,
  Typography,
} from "@mui/material";
import { ReactNode, useId, useState } from "react";
import { useTranslation } from "react-i18next";

export interface WorldEntryFieldShellProps {
  label: string;
  helpText?: string;
  // Where the label points. Without one the label names a group, for values
  // that are not a single input. The input is described by
  // getWorldEntryFieldHelpId(inputId).
  inputId?: string;
  // Offers Clear in the field's menu.
  onClear?: () => void;
  children: ReactNode;
}

// One field of an entry: its label above its value, help text below, and for
// editors a menu that appears on hover or focus. The value fills the cell, so
// an editable field reads like text until it is used.
export function WorldEntryFieldShell({
  label,
  helpText,
  inputId,
  onClear,
  children,
}: WorldEntryFieldShellProps) {
  const { t } = useTranslation();
  const labelId = useId();
  const groupHelpId = useId();
  const helpId = inputId ? getWorldEntryFieldHelpId(inputId) : groupHelpId;
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);

  return (
    <Box
      role={inputId ? undefined : "group"}
      aria-labelledby={inputId ? undefined : labelId}
      aria-describedby={!inputId && helpText ? helpId : undefined}
      sx={{
        position: "relative",
        borderRadius: 1,
        mx: -1,
        px: 1,
        py: 0.5,
        "&:hover, &:focus-within": onClear
          ? { bgcolor: "action.hover" }
          : undefined,
        // Shown on hover and focus, and always where nothing can hover.
        "& .world-entry-field-menu": {
          opacity: anchor ? 1 : 0,
          "@media (hover: none)": { opacity: 1 },
        },
        "&:hover .world-entry-field-menu, &:focus-within .world-entry-field-menu":
          { opacity: 1 },
      }}
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
          pr: onClear ? 4 : 0,
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
      {onClear && (
        <>
          <IconButton
            className="world-entry-field-menu"
            size="small"
            aria-label={t("worlds.entries.field-actions", "{{field}} actions", {
              field: label,
            })}
            aria-haspopup="menu"
            onClick={(event) => setAnchor(event.currentTarget)}
            sx={{ position: "absolute", top: 0, right: 0 }}
          >
            <MoreVertIcon fontSize="small" />
          </IconButton>
          <Menu
            anchorEl={anchor}
            open={!!anchor}
            onClose={() => setAnchor(null)}
          >
            <MenuItem
              onClick={() => {
                setAnchor(null);
                onClear();
              }}
            >
              <ListItemText>
                {t("worlds.entries.clear-field", "Clear")}
              </ListItemText>
            </MenuItem>
          </Menu>
        </>
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
