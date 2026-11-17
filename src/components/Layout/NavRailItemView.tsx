import { Box, BoxProps, Typography } from "@mui/material";
import { ReactNode } from "react";

import { GradientBox } from "components/GradientBox";

export interface NavRailItemViewProps extends Omit<BoxProps, "children"> {
  icon: ReactNode;
  label: ReactNode;
  isSelected: boolean;
  // For a link root.
  href?: string;
  // For a button root.
  type?: "button";
}

// A nav item's look: an icon pill over its label, the selected one ringed by
// the rotating gradient (still under reduced motion, through GradientBox).
// It sits on the dark nav surface (grey.900, white text). The caller picks
// the element (a link in the nav rail, a button in the phone game bar) and
// may size it with `sx`.
export function NavRailItemView(props: NavRailItemViewProps) {
  const { icon, label, isSelected, sx, ...rest } = props;

  return (
    <Box
      display={"flex"}
      flexDirection={"column"}
      alignItems={"center"}
      sx={[
        {
          color: "common.white",
          textDecoration: "none",
          // Touch screens keep a hover after a tap, so only real hovers count.
          "@media (hover: hover)": {
            "&:hover .pill": {
              bgcolor: "grey.800",
            },
          },
        },
        {
          "& .pill": {
            bgcolor: isSelected ? "grey.800" : "grey.900",
            px: isSelected ? 2.25 : 2.5,
            py: isSelected ? 0.5 : 0.75,
            border: "1px solid",
            borderColor: isSelected ? "transparent" : "grey.900",
          },
          "& .pill-gradient": {
            padding: isSelected ? 0.25 : 0,
            background: isSelected ? undefined : "none",
          },
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...rest}
    >
      <GradientBox
        className="pill-gradient"
        sx={{
          overflow: "hidden",
          borderRadius: 999,
        }}
        hide={!isSelected}
      >
        <Box className="pill" display={"flex"} borderRadius={999}>
          {icon}
        </Box>
      </GradientBox>
      <Typography
        variant="caption"
        noWrap
        sx={{
          maxWidth: "100%",
          color: isSelected ? "common.white" : "grey.300",
        }}
      >
        {label}
      </Typography>
    </Box>
  );
}
