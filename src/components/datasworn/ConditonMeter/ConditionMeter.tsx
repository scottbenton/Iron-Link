import IncrementIcon from "@mui/icons-material/Add";
import ExampleIcon from "@mui/icons-material/Casino";
import DecrementIcon from "@mui/icons-material/Remove";
import {
  Box,
  Card,
  IconButton,
  SxProps,
  Theme,
  Typography,
} from "@mui/material";
import { useId } from "react";
import { useTranslation } from "react-i18next";

import { RollButton } from "components/datasworn/RollButton";

import {
  TOUCH_DEVICE_MEDIA_QUERY,
  TOUCH_TARGET_SIZE,
} from "hooks/useIsTouchDevice";

import { formatSignedValue } from "lib/formatSignedValue";

import { useAnnounceMeterValue } from "./useAnnounceMeterValue";

export interface ConditionMeterProps {
  label: string;
  defaultValue: number;
  value?: number;
  min: number;
  max: number;
  onChange?: (value: number) => void;
  onActionClick?: () => void;
  action?: {
    ActionIcon: typeof ExampleIcon;
    actionLabel: string;
  };
  disabled?: boolean;
}

// Minus and plus are plain icon buttons: no frame or fill, only a tint on
// hover and press. Their current size with a pointer, 44px for fingers.
const stepButtonSx: SxProps<Theme> = (theme) => ({
  width: 34,
  height: 34,
  p: 0,
  color: "text.primary",
  "& svg": { fontSize: 18 },
  "&.Mui-focusVisible": {
    outline: `2px solid ${theme.palette.text.primary}`,
    outlineOffset: -2,
  },
  [TOUCH_DEVICE_MEDIA_QUERY]: {
    width: TOUCH_TARGET_SIZE,
    height: TOUCH_TARGET_SIZE,
  },
});

export function ConditionMeter(props: ConditionMeterProps) {
  const {
    label,
    defaultValue,
    value,
    min,
    max,
    onChange,
    onActionClick,
    action,
    disabled,
  } = props;
  const { ActionIcon, actionLabel } = action ?? {};

  const { t } = useTranslation();

  const currentValue = value ?? defaultValue;
  const valueText = formatSignedValue(currentValue);
  const isActionButton = !!onActionClick && !disabled;

  const labelId = useId();

  const announceValue = useAnnounceMeterValue();
  const handleChange = (newValue: number) => {
    if (onChange) {
      onChange(newValue);
      announceValue(label, newValue);
    }
  };

  return (
    <Card
      variant="outlined"
      role="group"
      aria-labelledby={labelId}
      sx={(theme) => ({
        display: "inline-flex",
        flexDirection: "column",
        gap: 0.5,
        p: 0.75,
        bgcolor: theme.palette.mode === "light" ? "grey.100" : "grey.800",
        borderColor: theme.palette.mode === "light" ? "grey.300" : "grey.700",
      })}
    >
      <Typography
        component={"span"}
        id={labelId}
        variant="body2"
        textAlign="center"
        color={"textSecondary"}
        textTransform={"uppercase"}
        fontWeight={600}
        lineHeight={1.2}
        fontFamily={(theme) => theme.typography.fontFamilyTitle}
      >
        {label}
      </Typography>
      <Box
        display="grid"
        gridTemplateColumns="auto minmax(0, 1fr) auto"
        alignItems="center"
        gap={0.5}
      >
        <IconButton
          aria-label={t(
            "datasworn.meter-subtract-1",
            "subtract 1 from {{label}}",
            { label },
          )}
          disabled={!onChange || currentValue <= min || disabled}
          onClick={() => handleChange(currentValue - 1)}
          sx={stepButtonSx}
        >
          <DecrementIcon />
        </IconButton>
        <RollButton
          value={valueText}
          ActionIcon={ActionIcon}
          iconTestId={label + actionLabel}
          data-testid={isActionButton ? "roll-button" : undefined}
          onClick={isActionButton ? onActionClick : undefined}
          aria-label={
            actionLabel
              ? t(
                  "datasworn.meter-action-named",
                  "{{action}} {{label}}, {{value}}",
                  { action: actionLabel, label, value: valueText },
                )
              : t("datasworn.meter-value-named", "{{label}}, {{value}}", {
                  label,
                  value: valueText,
                })
          }
        />
        <IconButton
          aria-label={t("datasworn.meter-add-1", "add 1 to {{label}}", {
            label,
          })}
          disabled={!onChange || currentValue >= max || disabled}
          onClick={() => handleChange(currentValue + 1)}
          sx={stepButtonSx}
        >
          <IncrementIcon />
        </IconButton>
      </Box>
    </Card>
  );
}
