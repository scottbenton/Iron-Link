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
  title: ReactNode;
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
        <ActionToolbar breadcrumbs={breadcrumbs}>
          {hasActions && (
            <>
              {actions?.start}
              <Box
                flexGrow={1}
                display="flex"
                justifyContent="flex-end"
                alignItems="center"
                gap={1}
              >
                {actions?.end}
              </Box>
            </>
          )}
        </ActionToolbar>
        <Box sx={{ flexGrow: 1, overflow: "auto", pt: 1, pb: 2 }}>
          {children}
        </Box>
      </Box>
    );
  }

  return (
    <Box>
      {breadcrumbs}
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
        {hasActions && (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 1,
            }}
          >
            {actions?.start}
            {actions?.end}
          </Box>
        )}
      </Box>
      {children}
    </Box>
  );
}
