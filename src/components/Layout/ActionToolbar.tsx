import { Box } from "@mui/material";
import { PropsWithChildren, ReactNode } from "react";

import { ActionToolbarStrip } from "./ActionToolbarStrip";
import { NOTES_PANE_GUTTER } from "./notesPaneGutter";

export interface ActionToolbarProps extends PropsWithChildren {
  breadcrumbs: ReactNode;
}

// Breadcrumbs above a grey strip of item actions. Notes folders, notes, and
// linked worlds share it so every Notes tab has the same chrome.
export function ActionToolbar(props: ActionToolbarProps) {
  const { breadcrumbs, children } = props;

  return (
    <Box
      bgcolor="background.paper"
      zIndex={(theme) => theme.zIndex.appBar - 1}
      mx={NOTES_PANE_GUTTER}
      borderBottom={(theme) => `1px solid ${theme.palette.divider}`}
      pb={children ? 0 : 2}
    >
      <Box>{breadcrumbs}</Box>
      {children && (
        <Box mt={0.5} pb={1} overflow="hidden">
          <ActionToolbarStrip>{children}</ActionToolbarStrip>
        </Box>
      )}
    </Box>
  );
}
