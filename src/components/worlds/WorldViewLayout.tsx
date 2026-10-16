import { Box, Typography } from "@mui/material";
import { PropsWithChildren, ReactNode } from "react";

import { ActionToolbar } from "components/Layout/ActionToolbar";

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
          // The Notes tab panel adds no room of its own below the tabs, so
          // match the side padding the standalone page gets from its
          // container. The page layout leaves padding to that container.
          pt: 2,
          px: { xs: 1, sm: 2 },
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
        <Box sx={{ flexGrow: 1, overflow: "auto", pt: 2, pb: 2 }}>
          {children}
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
