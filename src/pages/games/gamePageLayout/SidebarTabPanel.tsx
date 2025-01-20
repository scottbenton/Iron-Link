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

  return (
    <Box
      hidden={!areContentsVisible}
      role={isInTabView ? "tabpanel" : undefined}
      id={`tabpanel-${tab}`}
      aria-labelledby={isInTabView ? `tab-${tab}` : undefined}
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
