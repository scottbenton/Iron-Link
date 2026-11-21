import { PlusIcon } from "@phosphor-icons/react";

import { Flex, Stack } from "ui/primitives";

import { Button } from "../../components/Button";
import { Checkbox } from "../../components/Checkbox";
import {
  SectionTab,
  SectionTabList,
  TabPanel,
  Tabs,
} from "../../components/Tabs";
import { sampleAssets } from "../../docs/fixtures/datasworn";
import { AssetCard } from "../../game/AssetCard";
import { TracksPanelDemo } from "../../game/TracksPanel/TracksPanelDemo";
import { OverviewCharacters } from "./OverviewCharacters";
import { screenPanelStyles, screenTabsStyles } from "./phoneGameScreens";

/**
 * The game overview: Characters (the game's characters, then its players),
 * Assets and Tracks, the game's own and shared by everyone.
 */
export function OverviewScreen() {
  return (
    <Tabs defaultValue="characters">
      <div className={screenTabsStyles}>
        <SectionTabList
          aria-label="Game Overview Sections"
          variant="underline"
          size="lg"
        >
          <SectionTab value="characters">Characters</SectionTab>
          <SectionTab value="assets">Assets</SectionTab>
          <SectionTab value="tracks">Tracks</SectionTab>
        </SectionTabList>
      </div>
      <TabPanel value="characters" className={screenPanelStyles}>
        <OverviewCharacters />
      </TabPanel>
      <TabPanel value="assets" className={screenPanelStyles}>
        <Stack gap="3">
          <Flex justifyContent="space-between" alignItems="center" gap="2">
            <Checkbox label="Show all abilities" size="sm" />
            <Button size="sm" startIcon={<PlusIcon />}>
              Add Assets
            </Button>
          </Flex>
          <AssetCard
            asset={sampleAssets.starship}
            state={{ controlValues: { integrity: 5 } }}
            headingAs="h3"
          />
        </Stack>
      </TabPanel>
      <TabPanel value="tracks" className={screenPanelStyles}>
        <TracksPanelDemo initialConnections={null} />
      </TabPanel>
    </Tabs>
  );
}
