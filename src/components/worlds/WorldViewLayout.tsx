import { Box, Typography } from "@mui/material";
import { PropsWithChildren, ReactNode } from "react";

import { ActionToolbarStrip } from "components/Layout/ActionToolbarStrip";
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
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          flexGrow: 1,
          minHeight: 0,
        }}
      >
        <Box
          mx={NOTES_PANE_GUTTER}
          pt={2}
          pb={hasActions ? 0.5 : 2}
          borderBottom={
            hasActions
              ? undefined
              : (theme) => `1px solid ${theme.palette.divider}`
          }
        >
          {breadcrumbs}
        </Box>
        {/* One full width scroller, so the scrollbar sits at the column's
            edge. The breadcrumbs stay put; the actions scroll away with the
            page, and an entry's Notes bar pins on its own. */}
        <Box
          sx={{
            flexGrow: 1,
            minHeight: 0,
            overflow: "auto",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {hasActions && (
            <Box
              mx={NOTES_PANE_GUTTER}
              pb={1}
              flexShrink={0}
              borderBottom={(theme) => `1px solid ${theme.palette.divider}`}
            >
              <ActionToolbarStrip>
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
              </ActionToolbarStrip>
            </Box>
          )}
          {/* A flex column down to the content, so Notes can take the rest
              of the page. */}
          <Box
            sx={{
              pt: 2,
              pb: 2,
              px: NOTES_PANE_GUTTER,
              flex: "1 0 auto",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {children}
          </Box>
        </Box>
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
