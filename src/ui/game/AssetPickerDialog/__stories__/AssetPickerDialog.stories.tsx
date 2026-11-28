import type { Datasworn } from "@datasworn-community/core";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useMemo, useState } from "react";

import { Button } from "ui/components/Button";
import { Text } from "ui/components/Text";
import { Stack } from "ui/primitives";

import {
  classicRules,
  starforgedRules,
} from "../../../docs/fixtures/datasworn";
import { AssetPickerDialog } from "../AssetPickerDialog";
import { AssetPickerGroup } from "../assetPickerSearch";

/**
 * Picks an asset to add: one list of collapsible groups, one per asset
 * type, like the reference's categories, with the chosen asset's card
 * beside it. Below 640px of dialog the card opens in place of the list
 * instead, with a Back button. Every group starts closed and nothing is
 * chosen until you pick an asset.
 */
const meta: Meta<typeof AssetPickerDialog> = {
  title: "Game/AssetPickerDialog",
  component: AssetPickerDialog,
  parameters: { layout: "fullscreen" },
};

export default meta;
type Story = StoryObj<typeof AssetPickerDialog>;

function getGroups(
  rules: { assets: Record<string, Datasworn.AssetCollection> },
  source?: string,
): AssetPickerGroup[] {
  return Object.values(rules.assets).map((collection) => ({
    id: collection._id,
    name: collection.name,
    assets: Object.values(collection.contents ?? {}),
    source,
  }));
}

function Demo(props: { groups: AssetPickerGroup[] }) {
  const { groups } = props;
  const [open, setOpen] = useState(true);
  const [added, setAdded] = useState<string>();
  return (
    <Stack gap="3" padding="6" alignItems="flex-start">
      <Button variant="primary" onClick={() => setOpen(true)}>
        Add Asset
      </Button>
      <Text variant="bodySm" color="muted" role="status">
        {added ? `Added ${added}.` : ""}
      </Text>
      <AssetPickerDialog
        groups={groups}
        open={open}
        onClose={() => setOpen(false)}
        onAdd={(asset) => setAdded(asset.name)}
      />
    </Stack>
  );
}

/**
 * Starforged's assets. The dialog grows to 900px (less a margin on smaller
 * screens): wide enough for the groups and the card side by side, narrow
 * enough that the card stays card sized. Long lines end in an ellipsis
 * rather than widening the list. Search opens every group, counts the
 * results and marks the match in each row; when only an ability matches,
 * the row's second line shows that ability from the match. Narrow the
 * window below about 700px to see the phone layout: one pane, and picking
 * an asset opens its card with Back, and Add in the footer.
 */
export const Starforged: Story = {
  render: function Render() {
    const groups = useMemo(() => getGroups(starforgedRules), []);
    return <Demo groups={groups} />;
  },
};

/** Ironsworn's assets, with its four types. */
export const Ironsworn: Story = {
  render: function Render() {
    const groups = useMemo(() => getGroups(classicRules), []);
    return <Demo groups={groups} />;
  },
};

/** Types from two rulesets, headed by where they come from. */
export const TwoRulesets: Story = {
  render: function Render() {
    const groups = useMemo(
      () => [
        ...getGroups(starforgedRules, "Starforged"),
        ...getGroups(classicRules, "Ironsworn"),
      ],
      [],
    );
    return <Demo groups={groups} />;
  },
};
