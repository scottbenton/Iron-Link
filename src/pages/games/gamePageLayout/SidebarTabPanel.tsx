import { Box, SxProps, Theme } from "@mui/material";
import { PropsWithChildren } from "react";

export interface SidebarTabPanelProps<TabType> {
  currentOpenTab: TabType;
  tab: TabType;
  sx?: SxProps<Theme>;
  isInTabView: boolean;
}

export function SidebarTabPanel<T>(
  props: PropsWithChildren<SidebarTabPanelProps<T>>,
) {
  const { currentOpenTab, tab, sx, children, isInTabView } = props;

  const areContentsVisible = !isInTabView || currentOpenTab === tab;

  // On phones one panel shows at a time, chosen in the bottom nav; each
  // starts with its own heading, so it is not a tab panel.
  return (
    <Box
      hidden={!areContentsVisible}
      id={`tabpanel-${tab}`}
      sx={[
        {
          display: areContentsVisible ? "flex" : "none",
          flexDirection: "column",
          overflow: "auto",
          flexGrow: 1,
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {children}
    </Box>
  );
}
