import IncrementIcon from "@mui/icons-material/Add";
import ExampleIcon from "@mui/icons-material/Casino";
import DecrementIcon from "@mui/icons-material/Remove";
import { Box, ButtonBase, Card, IconButton, Typography } from "@mui/material";
import { useId } from "react";
import { useTranslation } from "react-i18next";

import { GradientBox } from "components/GradientBox";

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

const normalPx = 1.5;
const normalPy = 0.5;
const normalBorderRadius = 0.5;
const borderSize = 0.5;

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
        alignItems: "stretch",
        flexDirection: "column",
        bgcolor: theme.palette.mode === "light" ? "grey.300" : "grey.700",
        minWidth: 72,
      })}
    >
      <Typography
        component={"span"}
        id={labelId}
        variant="body2"
        textAlign="center"
        color={"textSecondary"}
        textTransform={"uppercase"}
        py={0.25}
        fontFamily={(theme) => theme.typography.fontFamilyTitle}
        px={1}
      >
        {label}
      </Typography>
      <Box display="flex" alignItems="center" px={onChange ? 0 : 0.5} pb={0.5}>
        <IconButton
          aria-label={t(
            "datasworn.meter-subtract-1",
            "subtract 1 from {{label}}",
            { label },
          )}
          size={"small"}
          disabled={!onChange || currentValue <= min || disabled}
          onClick={() => handleChange(currentValue - 1)}
        >
          <DecrementIcon />
        </IconButton>
        <Box
          component={isActionButton ? ButtonBase : "div"}
          data-testid={isActionButton ? "roll-button" : undefined}
          onClick={onActionClick}
          {...(isActionButton
            ? {
                focusRipple: true,
                "aria-label": actionLabel
                  ? t(
                      "datasworn.meter-action-named",
                      "{{action}} {{label}}, {{value}}",
                      { action: actionLabel, label, value: valueText },
                    )
                  : t("datasworn.meter-value-named", "{{label}}, {{value}}", {
                      label,
                      value: valueText,
                    }),
              }
            : {})}
          display="block"
          color="common.white"
          borderRadius={normalBorderRadius}
          overflow="hidden"
          flexGrow={1}
          sx={[
            (theme) => ({
              ".MuiTouchRipple-root": {
                zIndex: 3,
              },
              "& .gradient-box": {
                transition: theme.transitions.create(["padding"], {
                  duration: theme.transitions.duration.short,
                  easing: theme.transitions.easing.easeInOut,
                }),
                p: 0,
                "&::before": {
                  opacity: 0,
                },
              },
              "& .inner-box": {
                transition: theme.transitions.create(["padding"], {
                  duration: theme.transitions.duration.short,
                  easing: theme.transitions.easing.easeInOut,
                }),
              },
            }),
            isActionButton
              ? {
                  "&:hover, &:focus-visible": {
                    "& .gradient-box": {
                      p: borderSize,
                      "&::before": {
                        opacity: 1,
                      },
                    },
                    "& .inner-box": {
                      px: normalPx - borderSize,
                      py: normalPy - borderSize,
                      borderRadius: normalBorderRadius - borderSize,
                    },
                  },
                }
              : {},
          ]}
        >
          <GradientBox className="gradient-box">
            <Box
              className="inner-box"
              px={normalPx}
              py={normalPy}
              display="flex"
              alignItems="center"
              bgcolor={(theme) =>
                theme.palette.mode === "light" ? "grey.700" : "grey.900"
              }
              justifyContent="center"
            >
              {ActionIcon && (
                <ActionIcon
                  data-testid={label + actionLabel}
                  aria-hidden
                  color={"inherit"}
                  fontSize={"small"}
                  sx={{
                    ml: -0.5,
                    mr: 0.5,
                    color: "grey.300",
                  }}
                />
              )}
              <Typography
                component="span"
                variant="h5"
                fontFamily={(theme) => theme.typography.fontFamilyTitle}
                sx={{ width: 24 }}
              >
                {valueText}
              </Typography>
            </Box>
          </GradientBox>
        </Box>
        <IconButton
          aria-label={t("datasworn.meter-add-1", "add 1 to {{label}}", {
            label,
          })}
          size={"small"}
          disabled={!onChange || currentValue >= max || disabled}
          onClick={() => handleChange(currentValue + 1)}
        >
          <IncrementIcon />
        </IconButton>
      </Box>
    </Card>
  );
}
