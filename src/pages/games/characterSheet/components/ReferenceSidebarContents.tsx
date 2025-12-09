import { Badge, Box, Typography } from "@mui/material";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

import { StyledTab, StyledTabs } from "components/StyledTabs";
import { MoveTree } from "components/datasworn/MoveTree";
import { OracleTree } from "components/datasworn/OracleTree";

import { useGamePermissions } from "pages/games/gamePageLayout/hooks/usePermissions";

import { useSecondScreenFeature } from "hooks/advancedFeatures/useSecondScreenFeature";
import { useIsMobile } from "hooks/useIsMobile";

import { ReferenceTabs, useAppState } from "stores/appState.store";

import { GameType } from "repositories/game.repository";

import { GameLog } from "./GameLog";
import { SecondScreenSectionSettings } from "./SecondScreenSection";

function tabProps(tab: ReferenceTabs) {
  return {
    value: tab,
    id: `tab-${tab}`,
    "aria-controls": `tabpanel-${tab}`,
  };
}

function tabPanelProps(
  tab: ReferenceTabs,
  value: ReferenceTabs,
  reversed?: boolean,
) {
  return {
    hidden: tab !== value,
    role: "tabpanel",
    id: `tabpanel-${tab}`,
    "aria-labelledby": `tab-${tab}`,
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

  const secondScreenToggleIsActive = useSecondScreenFeature();

  useEffect(() => {
    if (
      !secondScreenToggleIsActive &&
      currentTab === ReferenceTabs.SecondScreen
    ) {
      setCurrentTab(ReferenceTabs.Moves);
    }
  }, [secondScreenToggleIsActive, currentTab, setCurrentTab]);

  return (
    <>
      {!isMobile && (
        <Box display="flex" justifyContent="space-between" px={2} pt={2}>
          <Typography
            fontFamily={"fontFamilyTitle"}
            textTransform={"uppercase"}
          >
            {t("character.reference-sidebar-title", "Reference")}
          </Typography>
        </Box>
      )}
      <StyledTabs
        centered
        value={currentTab}
        onChange={(_, value) =>
          setCurrentTab(value as unknown as ReferenceTabs)
        }
      >
        <StyledTab
          label={t("character.reference-sidebar-moves", "Moves")}
          {...tabProps(ReferenceTabs.Moves)}
        />
        <StyledTab
          label={t("character.reference-sidebar-oracles", "Oracles")}
          {...tabProps(ReferenceTabs.Oracles)}
        />
        <StyledTab
          label={t("character.reference-sidebar-game-log", "Game Log")}
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
        {secondScreenToggleIsActive && (
          <StyledTab
            label={t("character.reference-sidebar-second-screen-tab", "Screen")}
            {...tabProps(ReferenceTabs.SecondScreen)}
          />
        )}
      </StyledTabs>
      {/* <Box flexGrow={1}> */}
      <Box {...tabPanelProps(ReferenceTabs.Moves, currentTab)}>
        <MoveTree />
      </Box>
      <Box {...tabPanelProps(ReferenceTabs.Oracles, currentTab)}>
        <OracleTree />
      </Box>
      <Box
        {...tabPanelProps(ReferenceTabs.GameLog, currentTab, true)}
        style={{ overflowAnchor: "none" }}
      >
        <GameLog open={currentTab === ReferenceTabs.GameLog} />
      </Box>
      {secondScreenToggleIsActive && (
        <Box {...tabPanelProps(ReferenceTabs.SecondScreen, currentTab)}>
          <SecondScreenSectionSettings
            open={currentTab === ReferenceTabs.SecondScreen}
          />
        </Box>
      )}
    </>
  );
}
