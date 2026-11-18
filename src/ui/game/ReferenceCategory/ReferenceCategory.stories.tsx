import type { Meta, StoryObj } from "@storybook/react-vite";
import { ReactNode } from "react";

import { Box, Stack } from "styled-system/jsx";

import { starforgedRules } from "../../stories/fixtures/datasworn";
import {
  LooseOracleCollection,
  MoveCategoryTree,
  OracleCollectionTree,
  countOracles,
  nestedCustomMoves,
  oracleCountLabel,
  starforgedMoveCategories,
  starforgedOracleCollections,
} from "../../stories/fixtures/referenceTrees";
import { OracleListItem } from "../OracleListItem";
import { ReferenceCategory } from "./ReferenceCategory";

const oracles = starforgedRules.oracles as Record<
  string,
  LooseOracleCollection
>;
const core = Object.values(oracles.core.contents ?? {});

const meta = {
  title: "Game/ReferenceCategory",
  component: ReferenceCategory,
  args: {
    title: "Core Oracles",
    count: core.length,
    countLabel: oracleCountLabel,
    defaultOpen: true,
    children: null,
  },
} satisfies Meta<typeof ReferenceCategory>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A reference column: 16px in from its edges, the surface colour. */
function Column(props: { narrow?: boolean; children: ReactNode }) {
  return (
    <Box
      width={props.narrow ? "260px" : "360px"}
      maxWidth="100%"
      padding="4"
      borderWidth="1px"
      borderColor="border.default"
      borderRadius="lg"
      background="bg.surface"
    >
      <Stack gap="2">{props.children}</Stack>
    </Box>
  );
}

/** One category of rows. Press the band to close and open it. */
export const Playground: Story = {
  render: (args) => (
    <Column>
      <ReferenceCategory {...args}>
        {core.map((oracle) => (
          <OracleListItem
            key={oracle._id}
            name={oracle.name}
            onRoll={() => {}}
          />
        ))}
      </ReferenceCategory>
    </Column>
  ),
};

/**
 * Three levels deep, everything open: Launching Your Campaign holds Create
 * Your Character, which holds Step 5: Board Your Starship; Planet Oracles
 * holds each world type, each holding its Settlements roll. The top level
 * is the band, the next a bold name, deeper a small uppercase label, and
 * each level's rows hang from a rule under its caret.
 */
export const AllOpen: Story = {
  render: () => (
    <Column>
      <OracleCollectionTree
        collection={oracles.launching_your_campaign}
        defaultOpen
      />
      <OracleCollectionTree collection={oracles.planet} defaultOpen />
    </Column>
  ),
};

/** Every Starforged oracle collection, closed: the column at rest. */
export const AllClosed: Story = {
  render: () => (
    <Column>
      {starforgedOracleCollections.map((collection) => (
        <OracleCollectionTree key={collection._id} collection={collection} />
      ))}
    </Column>
  ),
};

/**
 * Mixed, as someone left it: Planet Oracles and Desert World open, the
 * other worlds closed inside it; Derelict Oracles open with its zones
 * closed.
 */
export const DeepNesting: Story = {
  render: () => (
    <Column>
      <OracleCollectionTree
        collection={oracles.planet}
        openIds={
          new Set([
            "oracle_collection:starforged/planet",
            "oracle_collection:starforged/planet/desert",
          ])
        }
      />
      <OracleCollectionTree
        collection={oracles.derelict}
        openIds={new Set(["oracle_collection:starforged/derelict"])}
      />
      <OracleCollectionTree
        collection={oracles.launching_your_campaign}
        openIds={
          new Set([
            "oracle_collection:starforged/launching_your_campaign",
            "oracle_collection:starforged/launching_your_campaign/character",
            "oracle_collection:starforged/launching_your_campaign/character/starship",
          ])
        }
      />
    </Column>
  ),
};

/**
 * Moves nest the same way. No published ruleset nests move categories, so
 * this is real Starforged moves regrouped as a homebrew pack might: Fight
 * and Bleed holds Combat Moves and Suffer Moves, and Suffer Moves splits
 * again. Under it, the ordinary flat categories, closed.
 */
export const NestedMoves: Story = {
  render: () => (
    <Column>
      <MoveCategoryTree category={nestedCustomMoves} defaultOpen />
      {starforgedMoveCategories.slice(0, 4).map((category) => (
        <MoveCategoryTree key={category._id} category={category} />
      ))}
    </Column>
  ),
};

/** Long names wrap at every depth in a 260px column; the count stays put. */
export const NarrowColumn: Story = {
  render: () => (
    <Column narrow>
      <OracleCollectionTree collection={oracles.precursor_vault} defaultOpen />
      <OracleCollectionTree
        collection={oracles.launching_your_campaign}
        defaultOpen
      />
    </Column>
  ),
};

/** A disabled category, such as one from a ruleset still loading. */
export const Disabled: Story = {
  args: {
    title: "Location Theme Oracles",
    count: countOracles(oracles.location_theme),
    disabled: true,
    defaultOpen: false,
  },
  render: (args) => (
    <Column>
      <ReferenceCategory {...args}>
        <OracleListItem name="Theme Type" onRoll={() => {}} />
      </ReferenceCategory>
    </Column>
  ),
};
