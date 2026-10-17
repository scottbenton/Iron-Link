import { Box, SxProps, Theme } from "@mui/material";
import { PropsWithChildren } from "react";

import { NOTES_PANE_GUTTER } from "components/Layout/notesPaneGutter";

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
      <Box px={NOTES_PANE_GUTTER} pt={2}>
        {children}
      </Box>
    </Box>
  );
}
