import { Box, Stack } from "ui/primitives";

import { css } from "styled-system/css";

import { TabPanel, Tabs } from "../../components/Tabs";
import {
  MoveCategoryTree,
  OracleCollectionTree,
  starforgedMoveCategories,
  starforgedOracleCollections,
} from "../../docs/fixtures/referenceTrees";
import { ColumnTabList } from "./ColumnTabList";
import { GameLogPanel } from "./GameLogPanel";
import { referenceSections } from "./columnSections";
import { ColumnTabsProps } from "./gamePageColumnShared";

/* ------------------------------------------------------------------------ */
/* Reference                                                                */
/* ------------------------------------------------------------------------ */

/** Categories open at first: one of each, so the rows show. */
const openReferenceIds = new Set([
  "move_category:starforged/adventure",
  "oracle_collection:starforged/core",
  "oracle_collection:starforged/planet",
]);

/** Moves, Oracles and Game Log behind tabs, the row pinned over each. */
const referenceTabsStyles = css({
  display: "flex",
  flexDirection: "column",
  height: "100%",
});

const referencePanelStyles = css({
  flex: "1 1 auto",
  minHeight: 0,
  overflowY: "auto",
  paddingInline: "4",
  paddingBlockEnd: "6",
  "&[hidden]": { display: "none" },
});

const logPanelStyles = css({
  display: "flex",
  flexDirection: "column",
  flex: "1 1 auto",
  minHeight: 0,
  "&[hidden]": { display: "none" },
});

/** The reference: Moves, Oracles and the Game Log, as in the live app. */
export function ReferenceColumn(props: ColumnTabsProps) {
  const { section, onSectionChange } = props;
  return (
    <Tabs
      defaultValue="moves"
      value={section}
      onValueChange={(value) => onSectionChange?.(String(value))}
      className={referenceTabsStyles}
    >
      <ColumnTabList label="Reference Sections" sections={referenceSections} />
      <TabPanel value="moves" className={referencePanelStyles}>
        <Stack gap="2">
          {starforgedMoveCategories.map((category) => (
            <MoveCategoryTree
              key={category._id}
              category={category}
              openIds={openReferenceIds}
            />
          ))}
        </Stack>
      </TabPanel>
      <TabPanel value="oracles" className={referencePanelStyles}>
        <Stack gap="2">
          {starforgedOracleCollections.map((collection) => (
            <OracleCollectionTree
              key={collection._id}
              collection={collection}
              openIds={openReferenceIds}
            />
          ))}
        </Stack>
      </TabPanel>
      <TabPanel value="log" className={logPanelStyles}>
        <Box
          flex="1 1 auto"
          minHeight="0"
          display="flex"
          flexDirection="column"
        >
          <GameLogPanel />
        </Box>
      </TabPanel>
    </Tabs>
  );
}
