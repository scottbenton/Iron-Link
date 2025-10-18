import { Badge, Box, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

import { StyledTab, StyledTabs } from "components/StyledTabs";
import { MoveTree } from "components/datasworn/MoveTree";
import { OracleTree } from "components/datasworn/OracleTree";

import { useGamePermissions } from "pages/games/gamePageLayout/hooks/usePermissions";

import { useIsMobile } from "hooks/useIsMobile";

import { ReferenceTabs, useAppState } from "stores/appState.store";

import { GameType } from "repositories/game.repository";

import { GameLog } from "./GameLog";

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
      {/* </Box> */}
    </>
  );
}
