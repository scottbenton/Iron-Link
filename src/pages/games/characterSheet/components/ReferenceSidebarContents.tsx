import { Box, Typography } from "@mui/material";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { StyledTab, StyledTabs } from "components/StyledTabs";
import { MoveTree } from "components/datasworn/MoveTree";
import { OracleTree } from "components/datasworn/OracleTree";

import { useIsMobile } from "hooks/useIsMobile";

import { GameLog } from "./GameLog";

enum Tabs {
  Moves = "moves",
  Oracles = "oracles",
  GameLog = "game-log",
}

function tabProps(tab: Tabs) {
  return {
    value: tab,
    id: `tab-${tab}`,
    "aria-controls": `tabpanel-${tab}`,
  };
}

function tabPanelProps(tab: Tabs, value: Tabs, reversed?: boolean) {
  return {
    hidden: tab !== value,
    role: "tabpanel",
    id: `tabpanel-${tab}`,
    "aria-labelledby": `tab-${tab}`,
    pb: 2,
    sx: {
      display: tab !== value ? "none" : "flex",
      flexDirection: reversed ? "column-reverse" : "column",
      overflow: "auto",
      flexGrow: 1,
    },
  };
}

export function ReferenceSidebarContents() {
  const { t } = useTranslation();

  const isMobile = useIsMobile();

  const [currentTab, setCurrentTab] = useState<Tabs>(Tabs.Moves);
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
        onChange={(_, value) => setCurrentTab(value as unknown as Tabs)}
      >
        <StyledTab
          label={t("character.reference-sidebar-moves", "Moves")}
          {...tabProps(Tabs.Moves)}
        />
        <StyledTab
          label={t("character.reference-sidebar-oracles", "Oracles")}
          {...tabProps(Tabs.Oracles)}
        />
        <StyledTab
          label={t("character.reference-sidebar-game-log", "Game Log")}
          {...tabProps(Tabs.GameLog)}
        />
      </StyledTabs>
      <Box {...tabPanelProps(Tabs.Moves, currentTab)}>
        <MoveTree />
      </Box>
      <Box {...tabPanelProps(Tabs.Oracles, currentTab)}>
        <OracleTree />
      </Box>
      <Box {...tabPanelProps(Tabs.GameLog, currentTab, true)}>
        <GameLog />
      </Box>
    </>
  );
}
