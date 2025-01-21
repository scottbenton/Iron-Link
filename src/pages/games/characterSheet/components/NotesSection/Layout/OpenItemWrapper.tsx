import { Box, SxProps, Theme } from "@mui/material";
import { PropsWithChildren } from "react";

export interface OpenItemWrapperProps {
  sx?: SxProps<Theme>;
}

export function OpenItemWrapper(
  props: PropsWithChildren<OpenItemWrapperProps>,
) {
  const { children, sx } = props;
  return (
    <Box
      sx={[
        {
          display: "flex",
          flexDirection: "column",
          // flexGrow: 1,
          overflow: "auto",
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      <Box px={1} pt={1}>
        {children}
      </Box>
    </Box>
  );
}
