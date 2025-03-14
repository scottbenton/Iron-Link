import { useGameTranslations } from "@/hooks/i18n/useGameTranslations";
import { Box, Tabs } from "@chakra-ui/react";

import { OverviewTabs } from "../overview/overviewTabs.enum";
import { AssetTabContents } from "../tabs/assets";
import { TracksTabContents } from "../tabs/tracks";

export function CharacterOverviewContent() {
  const t = useGameTranslations();

  return (
    <Box p={4} pt={2}>
      <Tabs.Root
        defaultValue={OverviewTabs.Characters}
        variant="subtle"
        lazyMount
      >
        <Tabs.List colorPalette="gray" display="flex" justifyContent={"center"}>
          <Tabs.Trigger value={OverviewTabs.Characters}>
            {t("game-tabs-character-overview", "Overview")}
          </Tabs.Trigger>
          <Tabs.Trigger value={OverviewTabs.Assets}>
            {t("game-tabs-assets", "Assets")}
          </Tabs.Trigger>
          <Tabs.Trigger value={OverviewTabs.Tracks}>
            {t("game-tabs-tracks", "Tracks")}
          </Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value={OverviewTabs.Characters}>
          <>Character</>
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
