import { Box, ButtonBase, SxProps, Theme, useTheme } from "@mui/material";
import { PropsWithChildren } from "react";

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
  onClick?: () => void;
  size?: ClockSize;
  sx?: SxProps<Theme>;
}

export function ClockCircle(props: ClockCircleProps) {
  const { segments, value, onClick, size = "medium", sx } = props;
  const theme = useTheme();

  const Wrapper = (
    props: PropsWithChildren<{
      onClick?: () => void;
      sx: SxProps;
    }>,
  ) => {
    const { children, onClick, sx } = props;
    const ariaLabel = `Clock with ${segments} segments. ${value} filled.`;

    if (onClick) {
      return (
        <ButtonBase sx={sx} onClick={onClick} aria-label={ariaLabel}>
          {children}
        </ButtonBase>
      );
    }
    return (
      <Box sx={sx} aria-label={ariaLabel}>
        {children}
      </Box>
    );
  };

  return (
    <Wrapper
      sx={[
        {
          borderRadius: 999,
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      onClick={onClick}
    >
      <svg
        width={sizes[size]}
        height={sizes[size]}
        viewBox="-2 -2 104 104"
        stroke={theme.palette.grey[theme.palette.mode === "light" ? 700 : 500]}
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
    </Wrapper>
  );
}
