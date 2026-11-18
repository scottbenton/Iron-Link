import { Box } from "@mui/material";
import { PropsWithChildren, ReactNode } from "react";

import { useHeadingComponent } from "components/HeadingLevel";
import { ActionToolbarStrip } from "components/Layout/ActionToolbarStrip";
import { NOTES_PANE_GUTTER } from "components/Layout/notesPaneGutter";
import { ScreenReaderOnly } from "components/ScreenReaderOnly";

// "page" is the standalone /worlds route; "embedded" is a Notes tab. Both look
// the same (the breadcrumbs name the destination over the grey strip of
// actions); a Notes tab's headings sit under the game's h1 and the Notes
// column's h2, so the layout sets where the heading levels start.
export type WorldLayout = "page" | "embedded";

export interface WorldViewActions {
  // Contextual actions for the current destination (settings, delete, ...).
  start?: ReactNode;
  // Primary actions, right aligned (add category, search, ...).
  end?: ReactNode;
  // In a Notes tab, wrap the actions onto a second row when they don't fit,
  // rather than scrolling them sideways.
  wrap?: boolean;
}

export interface WorldViewLayoutProps extends PropsWithChildren {
  breadcrumbs: ReactNode;
  // Omitted when the destination renders its own header (an entry's name is
  // edited in place on both surfaces).
  title?: ReactNode;
  actions?: WorldViewActions;
}

export function WorldViewLayout(props: WorldViewLayoutProps) {
  const { breadcrumbs, title, actions, children } = props;
  const hasActions = !!(actions?.start || actions?.end);
  const TitleComponent = useHeadingComponent(1);

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
        {/* The breadcrumbs name the destination on screen; its heading
              is for screen readers. */}
        {title && (
          <ScreenReaderOnly>
            <TitleComponent>{title}</TitleComponent>
          </ScreenReaderOnly>
        )}
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
            <ActionToolbarStrip wrap={actions?.wrap}>
              {actions?.start}
              {actions?.end && (
                // Pushed right with a margin rather than grown, so when
                // the start actions already end in a spacer (an entry's
                // More menu) the two sit together with a normal gap.
                <Box
                  ml="auto"
                  pl={0.5}
                  display="flex"
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
