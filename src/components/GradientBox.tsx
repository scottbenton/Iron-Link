import { Box, BoxProps } from "@mui/material";

import { GradientRing } from "components/GradientRing";

export interface GradientBoxProps extends BoxProps {
  hide?: boolean;
}

// A box filled with the rotating gradient (GradientRing) behind its children;
// padding on it shows the gradient as a ring around them.
export function GradientBox(props: GradientBoxProps) {
  const { hide, sx, children, ...rest } = props;

  return (
    <Box
      sx={[
        {
          position: "relative",
          overflow: "hidden",
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...rest}
    >
      {!hide && <GradientRing sx={{ zIndex: 1 }} />}
      <Box sx={{ zIndex: 2, position: "relative" }}>{children}</Box>
    </Box>
  );
}
