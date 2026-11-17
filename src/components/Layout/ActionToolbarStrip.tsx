import { Box } from "@mui/material";
import { PropsWithChildren } from "react";

import { ScrollFadeRow } from "./ScrollFadeRow";

export interface ActionToolbarStripProps extends PropsWithChildren {
  // Wrap actions that don't fit onto further rows instead of scrolling them
  // sideways, for strips whose actions should all stay in view (a search
  // field beside its buttons).
  wrap?: boolean;
}

// The grey strip of actions under the Notes breadcrumbs, also used on its own
// above an entry's Notes so both editors share one toolbar. Actions that don't
// fit scroll sideways inside the strip, or wrap with `wrap`.
export function ActionToolbarStrip(props: ActionToolbarStripProps) {
  const { wrap, children } = props;

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
      {wrap ? (
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 0.5,
          }}
        >
          {children}
        </Box>
      ) : (
        <ScrollFadeRow sx={{ alignItems: "center", gap: 0.5 }}>
          {children}
        </ScrollFadeRow>
      )}
    </Box>
  );
}
