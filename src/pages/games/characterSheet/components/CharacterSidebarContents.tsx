import { StyledTab, StyledTabs } from "components/StyledTabs";
import { useTranslation } from "react-i18next";
import { CharacterSection } from "./CharacterSection";
import { Box, Typography } from "@mui/material";
import { useState } from "react";
import { CharacterSettingsMenu } from "./CharacterSettingsMenu";

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

  return (
    <>
      <Box display="flex" justifyContent="space-between">
        <Typography fontFamily={"fontFamilyTitle"} textTransform={"uppercase"}>
          {t("Character")}
        </Typography>
        <CharacterSettingsMenu />
      </Box>
      <StyledTabs
        sx={{ mx: -2, mb: 2 }}
        centered
        value={currentTab}
        onChange={(_, value) => setCurrentTab(value as unknown as Tabs)}
      >
        <StyledTab label={t("Overview")} {...tabProps(Tabs.Overview)} />
        <StyledTab label={t("Assets")} {...tabProps(Tabs.Assets)} />
        <StyledTab label={t("Tracks")} {...tabProps(Tabs.Tracks)} />
      </StyledTabs>
      <div {...tabPanelProps(Tabs.Overview, currentTab)}>
        <CharacterSection />
      </div>
      <div {...tabPanelProps(Tabs.Assets, currentTab)}>
        <Typography>Assets</Typography>
      </div>
      <div {...tabPanelProps(Tabs.Tracks, currentTab)}>
        <Typography>Tracks</Typography>
      </div>
    </>
  );
}