import { Box } from "@mui/material";
import React, { useCallback, useEffect, useRef } from "react";
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

  const gridRef = useRef<HTMLDivElement>(null);

  const handleResizeStart = useCallback(
    (evt: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      evt.preventDefault();

      const gridDiv = gridRef.current;
      if (!gridDiv) {
        return;
      }

      const handleResize = (evt: MouseEvent) => {
        const totalHeight = gridDiv.clientHeight;
        const top = gridDiv.getBoundingClientRect().top;

        const currentY = evt.clientY - top;

        let percentage = (currentY / totalHeight) * 100;
        if (percentage < 25) {
          percentage = 25;
        } else if (percentage > 75) {
          percentage = 75;
        }

        gridDiv.style.gridTemplateRows = `${percentage}% 6px auto`;
      };

      const handleResizeEnd = () => {
        gridDiv.removeEventListener("mousemove", handleResize);
        gridDiv.removeEventListener("mouseup", handleResizeEnd);
        gridDiv.removeEventListener("mouseleave", handleResizeEnd);
      };

      gridDiv.addEventListener("mousemove", handleResize);
      gridDiv.addEventListener("mouseleave", handleResizeEnd);
      gridDiv.addEventListener("mouseup", handleResizeEnd);
    },
    [],
  );

  useEffect(() => {
    if (!isMediumScreen) {
      gridRef.current?.style.removeProperty("grid-template-rows");
    }
  }, [isMediumScreen]);

  return (
    <Box display="flex" alignItems="stretch" height="100%" flexGrow={1}>
      <Box
        ref={gridRef}
        sx={{
          flexGrow: 1,
          display: "grid",
          gridTemplateColumns: isLargeScreen
            ? "350px 1fr 350px"
            : isMediumScreen
              ? "350px 1fr"
              : "1fr",
          gridTemplateRows: isMediumScreen ? "1fr 6px 1fr" : "1fr",
          rowGap: 0.5,
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

        {isMediumScreen && (
          <Box
            borderRadius={1}
            height={"100%"}
            display="flex"
            justifyContent={"center"}
          >
            <Box
              onMouseDown={handleResizeStart}
              borderRadius={1}
              bgcolor="grey.400"
              height={"100%"}
              px={4}
              sx={{ cursor: "ns-resize" }}
            />
          </Box>
        )}

        <SidebarTabPanel
          tab={MobileTabs.Reference}
          currentOpenTab={currentOpenTab}
          isInTabView={isSmallScreen}
          sx={(theme) => ({
            bgcolor: isSmallScreen ? undefined : "background.default",
            gridRow: isMediumScreen ? "3" : "1",
            gridColumn: isLargeScreen ? "3" : "1",
            border: isSmallScreen
              ? undefined
              : `1px solid ${theme.palette.divider}`,
          })}
        >
          <Box
            overflow="hidden"
            height={"100%"}
            display="flex"
            flexDirection={"column"}
          >
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
            gridRow: isMediumScreen ? "1 / span 3" : "1",
            gridColumn: isSmallScreen ? "1" : "2",
            maxWidth: "100vw",
          }}
        >
          <NotesSection />
        </SidebarTabPanel>
      </Box>
    </Box>
  );
}
