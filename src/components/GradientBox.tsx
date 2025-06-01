import { Box, BoxProps } from "@mui/material";

import { usePrefersReducedMotion } from "hooks/usePrefersReducedMotion";

export interface GradientBoxProps extends BoxProps {
  hide?: boolean;
}

export function GradientBox(props: GradientBoxProps) {
  const { hide, sx, children, ...rest } = props;
  const prefersReducedMotion = usePrefersReducedMotion();

  return (
    <Box
      sx={[
        {
          position: "relative",
          overflow: "hidden",
          "&:before": hide
            ? {}
            : {
                content: '""',
                position: "absolute",
                display: "block",
                left: "-10%",
                right: "-10%",
                top: 0,
                bottom: 0,
                margin: "auto 0",
                minWidth: "calc(100% * sqrt(2))", // Diagonal length
                minHeight: "calc(100% * sqrt(2))", // Diagonal length
                aspectRatio: "1 / 1",
                background: (theme) => theme.palette.gradients.outline,
                animation: prefersReducedMotion
                  ? "none"
                  : "spin-gradient 5s linear infinite",
                zIndex: 1,
              },
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...rest}
    >
      <Box sx={{ zIndex: 2, position: "relative" }}>{children}</Box>
    </Box>
  );
}
