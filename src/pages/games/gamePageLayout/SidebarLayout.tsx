import { Box } from "@mui/material";
import { Outlet } from "react-router";

import { useIsBreakpoint } from "hooks/useIsBreakpoint";

import { NotesSection } from "../characterSheet/components/NotesSection";
import { ReferenceSidebarContents } from "../characterSheet/components/ReferenceSidebarContents";
import { MobileTabs } from "./MobileTabs";
import { SidebarTabPanel } from "./SidebarTabPanel";

export interface SidebarLayoutProps {
  currentOpenTab: MobileTabs;
}

export function SidebarLayout(props: SidebarLayoutProps) {
  const { currentOpenTab } = props;

  const isLargeScreen = useIsBreakpoint("greater-than", "lg");
  const isMediumScreen = useIsBreakpoint("equal-to", "md");
  const isSmallScreen = useIsBreakpoint("smaller-than", "md");

  return (
    <Box display="flex" alignItems="stretch" height="100%" flexGrow={1}>
      <Box
        sx={{
          flexGrow: 1,
          display: "grid",
          gridTemplateColumns: isLargeScreen
            ? "350px 1fr 350px"
            : isMediumScreen
              ? "350px 1fr"
              : "1fr",
          gridTemplateRows: isMediumScreen ? "auto auto" : "1fr",
          rowGap: 1,
        }}
      >
        <SidebarTabPanel
          tab={MobileTabs.Outlet}
          currentOpenTab={currentOpenTab}
          isInTabView={isSmallScreen}
          sx={(theme) => ({
            bgcolor: isSmallScreen ? undefined : "background.default",
            gridRow: "1",
            gridColumn: "1",
            resize: isMediumScreen ? "vertical" : undefined,
            height: isMediumScreen ? "100%" : undefined,
            border: isSmallScreen
              ? undefined
              : `1px solid ${theme.palette.divider}`,
          })}
        >
          <Box
            overflow="auto"
            px={2}
            pb={2}
            pt={isSmallScreen ? 0 : 2}
            height="100%"
          >
            <Outlet />
          </Box>
        </SidebarTabPanel>
        <SidebarTabPanel
          tab={MobileTabs.Reference}
          currentOpenTab={currentOpenTab}
          isInTabView={isSmallScreen}
          sx={(theme) => ({
            bgcolor: isSmallScreen ? undefined : "background.default",
            gridRow: isMediumScreen ? "2" : "1",
            gridColumn: isLargeScreen ? "3" : "1",
            border: isSmallScreen
              ? undefined
              : `1px solid ${theme.palette.divider}`,
          })}
        >
          <Box overflow="auto" height={"100%"}>
            <ReferenceSidebarContents />
          </Box>
        </SidebarTabPanel>

        <SidebarTabPanel
          tab={MobileTabs.Notes}
          currentOpenTab={currentOpenTab}
          isInTabView={isSmallScreen}
          sx={{
            overflow: !isSmallScreen ? "hidden" : "initial",
            flexGrow: 1,
            mt: 1,
            gridRow: isMediumScreen ? "1 / span 2" : "1",
            gridColumn: isSmallScreen ? "1" : "2",
            px: 2,
            maxWidth: "100vw",
          }}
        >
          <NotesSection />
        </SidebarTabPanel>
      </Box>
    </Box>
  );
}
