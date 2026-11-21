import { PlusIcon } from "@phosphor-icons/react";

import { Flex, Stack } from "ui/primitives";

import { Button } from "../../components/Button";
import { Checkbox } from "../../components/Checkbox";
import { TabPanel, Tabs } from "../../components/Tabs";
import { sampleAssets } from "../../docs/fixtures/datasworn";
import { AssetCard } from "../../game/AssetCard";
import { TracksPanelDemo } from "../../game/TracksPanel/TracksPanelDemo";
import { ColumnTabList } from "./ColumnTabList";
import { OverviewCharacters } from "./OverviewCharacters";
import { overviewSections } from "./columnSections";
import {
  ColumnTabsProps,
  columnTabsStyles,
  sheetPanelStyles,
} from "./gamePageColumnShared";

/**
 * The game overview: Characters, Assets and Tracks, as the live
 * `GameOverviewSheet`. It takes the character column's place on the game's
 * Overview page; its settings are the game's, in the rail's menu.
 */
export function OverviewColumn(props: { solo?: boolean } & ColumnTabsProps) {
  const { solo, section, onSectionChange } = props;
  return (
    <Tabs
      defaultValue="characters"
      value={section}
      onValueChange={(value) => onSectionChange?.(String(value))}
      className={columnTabsStyles}
    >
      <ColumnTabList
        label="Game Overview Sections"
        sections={overviewSections}
      />

      <TabPanel value="characters" className={sheetPanelStyles}>
        <OverviewCharacters solo={solo} />
      </TabPanel>

      <TabPanel value="assets" className={sheetPanelStyles}>
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

      <TabPanel value="tracks" className={sheetPanelStyles}>
        <TracksPanelDemo initialConnections={null} />
      </TabPanel>
    </Tabs>
  );
}
