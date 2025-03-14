import { useGameTranslations } from "@/hooks/i18n/useGameTranslations";
import { Box, Tabs } from "@chakra-ui/react";

import { AssetTabContents } from "../tabs/assets";
import { TracksTabContents } from "../tabs/tracks";
import { OverviewTab } from "./OverviewTab";
import { OverviewTabContents } from "./OverviewTabContents";
import { OverviewTabs } from "./overviewTabs.enum";

export function CharacterOrOverviewContent() {
  const t = useGameTranslations();

  return (
    <Box p={4} pt={2}>
      <Tabs.Root
        defaultValue={OverviewTabs.Overview}
        variant="subtle"
        lazyMount
      >
        <Tabs.List colorPalette="gray" display="flex" justifyContent={"center"}>
          <OverviewTab />
          <Tabs.Trigger value={OverviewTabs.Assets}>
            {t("game-tabs-assets", "Assets")}
          </Tabs.Trigger>
          <Tabs.Trigger value={OverviewTabs.Tracks}>
            {t("game-tabs-tracks", "Tracks")}
          </Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value={OverviewTabs.Overview}>
          <OverviewTabContents />
        </Tabs.Content>
        <Tabs.Content value={OverviewTabs.Assets}>
          <AssetTabContents />
        </Tabs.Content>
        <Tabs.Content value={OverviewTabs.Tracks}>
          <TracksTabContents />
        </Tabs.Content>
      </Tabs.Root>
    </Box>
  );
}
