import { Box, Typography } from "@mui/material";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { ScreenReaderOnly } from "components/ScreenReaderOnly";
import { StyledTab, StyledTabs } from "components/StyledTabs";

import { OVERVIEW_ID } from "pages/games/gamePageLayout/hooks/useGameKeybinds";

import { useIsMobile } from "hooks/useIsMobile";
import {
  PageCategory,
  useSendPageViewEvent,
} from "hooks/useSendPageViewEvents";

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
  useSendPageViewEvent(PageCategory.GameOverview);

  const isMobile = useIsMobile();

  const [currentTab, setCurrentTab] = useState(Tabs.Characters);

  // The column's heading; on phones the column is a tab panel with no
  // visible heading, so it is read by screen readers only.
  const heading = (
    <Typography
      component={"h2"}
      id={OVERVIEW_ID}
      tabIndex={-1}
      fontFamily={"fontFamilyTitle"}
      textTransform={"uppercase"}
    >
      {t("game.overview-sidebar.header", "Game Overview")}
    </Typography>
  );

  return (
    <>
      {isMobile ? (
        <ScreenReaderOnly>{heading}</ScreenReaderOnly>
      ) : (
        <Box display="flex" justifyContent="space-between">
          {heading}
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
