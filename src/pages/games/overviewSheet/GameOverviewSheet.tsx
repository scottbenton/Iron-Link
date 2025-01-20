import { Box, Typography } from "@mui/material";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { StyledTab, StyledTabs } from "components/StyledTabs";

import { useIsMobile } from "hooks/useIsMobile";

import { AssetsSection } from "../characterSheet/components/AssetsSection";
import { TracksSection } from "../characterSheet/components/TracksSection";
import { CharactersAndUsersTab } from "./CharactersAndUsersTab";
import { GameSettingsMenu } from "./gameSettings/GameSettingsMenu";

enum Tabs {
  Characters = "characters",
  Assets = "assets",
  Tracks = "tracks",
}

function tabProps(tab: Tabs) {
  return {
    value: tab,
    id: `tab-${tab}`,
    "aria-controls": `tabpanel-${tab}`,
  };
}

function tabPanelProps(tab: Tabs, value: Tabs) {
  return {
    hidden: tab !== value,
    role: "tabpanel",
    id: `tabpanel-${tab}`,
    "aria-labelledby": `tab-${tab}`,
  };
}

export default function GameOverviewSheet() {
  const { t } = useTranslation();

  const isMobile = useIsMobile();

  const [currentTab, setCurrentTab] = useState(Tabs.Characters);

  return (
    <>
      {!isMobile && (
        <Box display="flex" justifyContent="space-between">
          <Typography
            fontFamily={"fontFamilyTitle"}
            textTransform={"uppercase"}
          >
            {t("game.overview-sidebar.header", "Game Overview")}
          </Typography>
          <GameSettingsMenu />
        </Box>
      )}
      <StyledTabs
        sx={{ mx: -2, mb: 2 }}
        centered
        value={currentTab}
        onChange={(_, value) => setCurrentTab(value as unknown as Tabs)}
      >
        <StyledTab
          label={t("character.character-sidebar.characters", "Characters")}
          {...tabProps(Tabs.Characters)}
        />
        <StyledTab
          label={t("character.character-sidebar.assets", "Assets")}
          {...tabProps(Tabs.Assets)}
        />
        <StyledTab
          label={t("character.character-sidebar.tracks", "Tracks")}
          {...tabProps(Tabs.Tracks)}
        />
      </StyledTabs>
      <div {...tabPanelProps(Tabs.Characters, currentTab)}>
        <CharactersAndUsersTab />
      </div>
      <div {...tabPanelProps(Tabs.Assets, currentTab)}>
        <AssetsSection />
      </div>
      <div {...tabPanelProps(Tabs.Tracks, currentTab)}>
        <TracksSection />
      </div>
    </>
  );
}
