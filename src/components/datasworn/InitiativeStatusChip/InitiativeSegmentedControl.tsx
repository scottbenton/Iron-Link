import { Box } from "@mui/material";
import { useId } from "react";
import { useTranslation } from "react-i18next";

import {
  TOUCH_DEVICE_MEDIA_QUERY,
  TOUCH_TARGET_SIZE,
} from "hooks/useIsTouchDevice";

import { InitiativeStatus } from "repositories/character.repository";

import { initiativeStatusColors } from "./initiativeStatusColors";
import { useInitiativeStatusText } from "./useInitiativeStatusText";

export interface InitiativeSegmentedControlProps {
  status: InitiativeStatus;
  /** Without it the control only shows the status. */
  handleStatusChange?: (newStatus: InitiativeStatus) => void;
}

const statuses = [
  InitiativeStatus.HasInitiative,
  InitiativeStatus.DoesNotHaveInitiative,
  InitiativeStatus.OutOfCombat,
];

/**
 * The phone sheet's initiative control: the three statuses side by side, the
 * current one filled in its status colour. Each segment is a native radio, so
 * arrow keys move between them and screen readers read a radio group.
 */
export function InitiativeSegmentedControl(
  props: InitiativeSegmentedControlProps,
) {
  const { status, handleStatusChange } = props;

  const { t } = useTranslation();
  const statusLabels = useInitiativeStatusText(true);
  const name = useId();
  const disabled = !handleStatusChange;

  return (
    <Box
      role="radiogroup"
      aria-label={t("datasworn.initiative", "Initiative")}
      sx={(theme) => ({
        display: "grid",
        gridTemplateColumns: `repeat(${statuses.length}, minmax(0, 1fr))`,
        height: 36,
        border: `1px solid ${theme.palette.grey[theme.palette.mode === "light" ? 400 : 500]}`,
        borderRadius: `${theme.shape.borderRadius}px`,
        overflow: "hidden",
        [TOUCH_DEVICE_MEDIA_QUERY]: {
          height: TOUCH_TARGET_SIZE,
        },
      })}
    >
      {statuses.map((option, index) => {
        const checked = option === status;
        const color = initiativeStatusColors[option];
        return (
          <Box
            key={option}
            component="label"
            sx={(theme) => ({
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              px: 0.5,
              textAlign: "center",
              typography: "body2",
              lineHeight: 1.15,
              fontWeight: checked ? 700 : 500,
              cursor: disabled ? "default" : "pointer",
              borderLeft:
                index > 0
                  ? `1px solid ${theme.palette.grey[theme.palette.mode === "light" ? 400 : 500]}`
                  : undefined,
              color: checked
                ? theme.palette[color].contrastText
                : theme.palette.text.secondary,
              bgcolor: checked ? theme.palette[color].main : "transparent",
              transition: theme.transitions.create(
                ["background-color", "color"],
                { duration: theme.transitions.duration.shortest },
              ),
              "@media (hover: hover)": {
                "&:hover": !checked && !disabled && { bgcolor: "action.hover" },
              },
              "&:has(input:focus-visible)": {
                outline: `2px solid ${theme.palette.text.primary}`,
                outlineOffset: -4,
                borderRadius: `${theme.shape.borderRadius - 2}px`,
              },
            })}
          >
            <Box
              component="input"
              type="radio"
              name={name}
              value={option}
              checked={checked}
              disabled={disabled}
              onChange={() => handleStatusChange?.(option)}
              sx={{
                position: "absolute",
                inset: 0,
                m: 0,
                opacity: 0,
                cursor: "inherit",
              }}
            />
            {statusLabels[option]}
          </Box>
        );
      })}
    </Box>
  );
}
