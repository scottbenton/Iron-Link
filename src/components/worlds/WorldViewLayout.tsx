import { Box, Typography } from "@mui/material";
import { PropsWithChildren, ReactNode } from "react";

import { ActionToolbar } from "components/Layout/ActionToolbar";
import { NOTES_PANE_GUTTER } from "components/Layout/notesPaneGutter";

// "page" is the standalone /worlds route; "embedded" is a Notes tab, where
// the breadcrumbs name the destination and actions sit in the Notes toolbar.
export type WorldLayout = "page" | "embedded";

export interface WorldViewActions {
  // Contextual actions for the current destination (settings, delete, ...).
  start?: ReactNode;
  // Primary actions, right aligned (add category, search, ...).
  end?: ReactNode;
}

export interface WorldViewLayoutProps extends PropsWithChildren {
  layout: WorldLayout;
  breadcrumbs: ReactNode;
  // Omitted when the destination renders its own header (an entry's name is
  // edited in place on both surfaces).
  title?: ReactNode;
  titleIcon?: ReactNode;
  actions?: WorldViewActions;
}

export function WorldViewLayout(props: WorldViewLayoutProps) {
  const { layout, breadcrumbs, title, titleIcon, actions, children } = props;
  const hasActions = !!(actions?.start || actions?.end);

  if (layout === "embedded") {
    return (
      // One full width scroller, so the scrollbar sits at the column's edge
      // and the breadcrumbs and actions scroll away with the page; an
      // entry's Notes bar pins on its own.
      <Box
        sx={{
          flexGrow: 1,
          minHeight: 0,
          overflow: "auto",
        }}
      >
        <ActionToolbar breadcrumbs={breadcrumbs}>
          {hasActions && (
            <>
              {actions?.start}
              {actions?.end && (
                <Box
                  flexGrow={1}
                  display="flex"
                  justifyContent="flex-end"
                  alignItems="center"
                  gap={1}
                >
                  {actions.end}
                </Box>
              )}
            </>
          )}
        </ActionToolbar>
        <Box sx={{ pt: 2, pb: 2, px: NOTES_PANE_GUTTER }}>{children}</Box>
      </Box>
    );
  }

  return (
    <Box>
      {breadcrumbs}
      {(title || hasActions) && (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 2,
            mb: 3,
          }}
        >
          {title && (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                minWidth: 0,
                flex: "1 1 240px",
              }}
            >
              {titleIcon}
              <Typography
                variant="h4"
                component="h1"
                textTransform="uppercase"
                fontFamily={(theme) => theme.typography.fontFamilyTitle}
                sx={{ overflowWrap: "anywhere" }}
              >
                {title}
              </Typography>
            </Box>
          )}
          {hasActions && (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 1,
                // Without a title, the actions are the whole strip.
                flexGrow: title ? 0 : 1,
              }}
            >
              {actions?.start}
              {actions?.end}
            </Box>
          )}
        </Box>
      )}
      {children}
    </Box>
  );
}
