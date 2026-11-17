import { Badge, Box, Typography } from "@mui/material";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

import { ScreenReaderOnly } from "components/ScreenReaderOnly";
import { StyledTab, StyledTabs } from "components/StyledTabs";
import { MoveTree } from "components/datasworn/MoveTree";
import { OracleTree } from "components/datasworn/OracleTree";

import { useGamePermissions } from "pages/games/gamePageLayout/hooks/usePermissions";

import { useSecondScreenFeature } from "hooks/advancedFeatures/useSecondScreenFeature";
import { useIsMobile } from "hooks/useIsMobile";

import {
  ReferenceTabs,
  getReferenceTabId,
  useAppState,
  useIsGameLogVisible,
} from "stores/appState.store";

import { GameType } from "repositories/game.repository";

import { GameLog } from "./GameLog";
import { SecondScreenSectionSettings } from "./SecondScreenSection";

function tabProps(tab: ReferenceTabs) {
  return {
    value: tab,
    id: getReferenceTabId(tab),
    "aria-controls": `tabpanel-${tab}`,
  };
}

function tabPanelProps(
  tab: ReferenceTabs,
  value: ReferenceTabs,
  hasTabs: boolean,
  reversed?: boolean,
) {
  return {
    hidden: tab !== value,
    // Phones have no tab strip: the bottom nav chooses the panel.
    role: hasTabs ? "tabpanel" : undefined,
    id: `tabpanel-${tab}`,
    "aria-labelledby": hasTabs ? `tab-${tab}` : undefined,
    pb: reversed ? 0 : 2,
    sx: {
      display: tab !== value ? "none" : "flex",
      flexDirection: reversed ? "column-reverse" : "column",
      overflow: "auto",
      maxHeight: "100%",
      flexGrow: 1,
      position: "relative",
    },
  };
}

export function ReferenceSidebarContents() {
  const { t } = useTranslation();

  const isMobile = useIsMobile();

  const currentTab = useAppState((state) => state.currentReferenceTab);
  const setCurrentTab = useAppState((state) => state.setCurrentReferenceTab);
  const { gameType } = useGamePermissions();
  const gameLogNotificationCount = useAppState(
    (state) => state.gameLogNotificationCount,
  );

  const isGameLogOpen = useIsGameLogVisible();

  // Phones open the Second Screen settings from the game settings menu
  // instead of a tab here.
  const showSecondScreenTab = useSecondScreenFeature() && !isMobile;

  useEffect(() => {
    if (!showSecondScreenTab && currentTab === ReferenceTabs.SecondScreen) {
      setCurrentTab(ReferenceTabs.Moves);
    }
  }, [showSecondScreenTab, currentTab, setCurrentTab]);

  const tabLabels: Record<ReferenceTabs, string> = {
    [ReferenceTabs.Moves]: t("character.reference-sidebar-moves", "Moves"),
    [ReferenceTabs.Oracles]: t(
      "character.reference-sidebar-oracles",
      "Oracles",
    ),
    [ReferenceTabs.GameLog]: t(
      "character.reference-sidebar-game-log",
      "Game Log",
    ),
    [ReferenceTabs.SecondScreen]: t(
      "character.reference-sidebar-second-screen-tab",
      "Screen",
    ),
  };

  // On phones the bottom nav opens the column on one of its tabs, with no
  // visible heading, so the heading names that tab for screen readers only.
  const heading = (
    <Typography
      component={"h2"}
      fontFamily={"fontFamilyTitle"}
      textTransform={"uppercase"}
    >
      {isMobile
        ? tabLabels[currentTab]
        : t("character.reference-sidebar-title", "Reference")}
    </Typography>
  );

  return (
    <>
      {isMobile ? (
        <ScreenReaderOnly>{heading}</ScreenReaderOnly>
      ) : (
        <Box display="flex" justifyContent="space-between" px={2} pt={2}>
          {heading}
        </Box>
      )}
      {!isMobile && (
        <StyledTabs
          centered
          value={currentTab}
          onChange={(_, value) =>
            setCurrentTab(value as unknown as ReferenceTabs)
          }
        >
          <StyledTab
            label={tabLabels[ReferenceTabs.Moves]}
            {...tabProps(ReferenceTabs.Moves)}
          />
          <StyledTab
            label={tabLabels[ReferenceTabs.Oracles]}
            {...tabProps(ReferenceTabs.Oracles)}
          />
          <StyledTab
            label={tabLabels[ReferenceTabs.GameLog]}
            icon={
              gameLogNotificationCount > 0 && gameType !== GameType.Solo ? (
                <Badge badgeContent={gameLogNotificationCount} color="primary">
                  <Box ml={1} />
                </Badge>
              ) : undefined
            }
            iconPosition="end"
            {...tabProps(ReferenceTabs.GameLog)}
          />
          {showSecondScreenTab && (
            <StyledTab
              label={tabLabels[ReferenceTabs.SecondScreen]}
              {...tabProps(ReferenceTabs.SecondScreen)}
            />
          )}
        </StyledTabs>
      )}
      <Box {...tabPanelProps(ReferenceTabs.Moves, currentTab, !isMobile)}>
        <MoveTree />
      </Box>
      <Box {...tabPanelProps(ReferenceTabs.Oracles, currentTab, !isMobile)}>
        <OracleTree />
      </Box>
      <Box
        {...tabPanelProps(ReferenceTabs.GameLog, currentTab, !isMobile, true)}
        style={{ overflowAnchor: "none" }}
      >
        <GameLog open={isGameLogOpen} />
      </Box>
      {showSecondScreenTab && (
        <Box
          {...tabPanelProps(ReferenceTabs.SecondScreen, currentTab, !isMobile)}
        >
          <SecondScreenSectionSettings
            open={currentTab === ReferenceTabs.SecondScreen}
          />
        </Box>
      )}
    </>
  );
}
