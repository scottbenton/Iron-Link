import { Box } from "@mui/material";
import { PropsWithChildren } from "react";

import { ScrollFadeRow } from "./ScrollFadeRow";

// The grey strip of actions under the Notes breadcrumbs, also used on its own
// above an entry's Notes so both editors share one toolbar. Actions that don't
// fit scroll sideways inside the strip.
export function ActionToolbarStrip(props: PropsWithChildren) {
  const { children } = props;

  return (
    <Box
      px={1}
      pr={0.5}
      py={0.5}
      bgcolor={(theme) =>
        theme.palette.grey[theme.palette.mode === "light" ? "200" : "800"]
      }
      borderRadius={1}
      width={"100%"}
    >
      <ScrollFadeRow sx={{ alignItems: "center", gap: 0.5 }}>
        {children}
      </ScrollFadeRow>
    </Box>
  );
}
