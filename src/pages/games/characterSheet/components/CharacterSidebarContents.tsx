import { Box, Typography } from "@mui/material";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { StyledTab, StyledTabs } from "components/StyledTabs";

import { useIsMobile } from "hooks/useIsMobile";

import { AssetsSection } from "./AssetsSection";
import { CharacterSection } from "./CharacterSection";
import { CharacterSettingsMenu } from "./CharacterSettingsMenu";
import { TracksSection } from "./TracksSection";

enum Tabs {
  Overview = "overview",
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

export function CharacterSidebarContents() {
  const { t } = useTranslation();

  const [currentTab, setCurrentTab] = useState<Tabs>(Tabs.Overview);
  const isMobile = useIsMobile();

  return (
    <>
      {!isMobile && (
        <Box display="flex" justifyContent="space-between">
          <Typography
            fontFamily={"fontFamilyTitle"}
            textTransform={"uppercase"}
          >
            {t("character.character-sidebar.header", "Character")}
          </Typography>
          <CharacterSettingsMenu />
        </Box>
      )}
      <StyledTabs
        sx={{ mx: -2, mb: 2 }}
        centered
        value={currentTab}
        onChange={(_, value) => setCurrentTab(value as unknown as Tabs)}
      >
        <StyledTab
          label={t("character.character-sidebar.overview", "Overview")}
          {...tabProps(Tabs.Overview)}
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
      <div {...tabPanelProps(Tabs.Overview, currentTab)}>
        <CharacterSection />
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
