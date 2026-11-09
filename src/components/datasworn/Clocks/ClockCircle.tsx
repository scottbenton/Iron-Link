import { Box, ButtonBase, SxProps, Theme, useTheme } from "@mui/material";
import { useTranslation } from "react-i18next";

import { ClockSegment } from "./ClockSegment";

export type ClockSize = "small" | "medium" | "large";

const sizes: Record<ClockSize, number> = {
  small: 60,
  medium: 80,
  large: 120,
};

export interface ClockCircleProps {
  segments: number;
  value: number;
  /**
   * The clock's name, read out with its value ("Siege, 3 of 6 segments
   * filled"). Without one, and without onClick, the clock is decorative and
   * hidden from screen readers (the segment picker's previews).
   */
  label?: string;
  /** Fills the next segment, or clears a full clock. */
  onClick?: () => void;
  size?: ClockSize;
  sx?: SxProps<Theme>;
}

export function ClockCircle(props: ClockCircleProps) {
  const { segments, value, label, onClick, size = "medium", sx } = props;
  const theme = useTheme();
  const { t } = useTranslation();

  const valueText = t(
    "datasworn.clock.value-text",
    "{{label}}, {{value}} of {{segments}} segments filled",
    {
      label: label ?? t("datasworn.clock.default-label", "Clock"),
      value,
      segments,
    },
  );

  const sxArray = Array.isArray(sx) ? sx : [sx];

  const clock = (
    <svg
      width={sizes[size]}
      height={sizes[size]}
      viewBox="-2 -2 104 104"
      stroke={theme.palette.grey[theme.palette.mode === "light" ? 700 : 500]}
      aria-hidden
      focusable={false}
    >
      {Array.from({ length: segments }).map((_, index) => (
        <ClockSegment
          key={index}
          index={index}
          segments={segments}
          filled={value}
        />
      ))}
    </svg>
  );

  if (onClick) {
    return (
      <ButtonBase
        sx={[
          {
            borderRadius: 999,
            "&.Mui-focusVisible": {
              outline: `2px solid ${theme.palette.primary.main}`,
              outlineOffset: 2,
            },
          },
          ...sxArray,
        ]}
        onClick={onClick}
        aria-label={
          value >= segments
            ? t("datasworn.clock.button-clear", "{{valueText}}, clear clock", {
                valueText,
              })
            : t(
                "datasworn.clock.button-fill",
                "{{valueText}}, fill a segment",
                { valueText },
              )
        }
      >
        {clock}
      </ButtonBase>
    );
  }

  if (!label) {
    return <Box sx={[{ borderRadius: 999 }, ...sxArray]}>{clock}</Box>;
  }

  return (
    <Box
      sx={[{ borderRadius: 999 }, ...sxArray]}
      role="img"
      aria-label={valueText}
    >
      {clock}
    </Box>
  );
}
