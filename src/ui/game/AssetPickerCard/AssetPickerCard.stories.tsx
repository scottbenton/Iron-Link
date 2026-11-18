import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import { Grid } from "styled-system/jsx";

import { sampleAssets } from "../../stories/fixtures/datasworn";
import { AssetPickerCard } from "./AssetPickerCard";

const meta: Meta<typeof AssetPickerCard> = {
  title: "Game/AssetPickerCard",
  component: AssetPickerCard,
  args: { asset: sampleAssets.ace },
};

export default meta;
type Story = StoryObj<typeof AssetPickerCard>;

export const Playground: Story = {
  render: (args) => (
    <Grid maxWidth="360px">
      <AssetPickerCard {...args} />
    </Grid>
  ),
};

/** Choosing paths: each card presses as one button. */
export const Picking: Story = {
  render: function Render() {
    const [picked, setPicked] = useState<string[]>([]);
    const assets = [
      sampleAssets.ace,
      sampleAssets.navigator,
      sampleAssets.starship,
      sampleAssets.protocolBot,
      sampleAssets.ironswornHawk,
      sampleAssets.ironswornDuelist,
    ];
    return (
      <Grid columns={{ base: 1, md: 2, xl: 3 }} gap="4" alignItems="start">
        {assets.map((asset) => (
          <AssetPickerCard
            key={asset._id}
            asset={asset}
            selected={picked.includes(asset._id)}
            onSelect={() =>
              setPicked((current) =>
                current.includes(asset._id)
                  ? current.filter((id) => id !== asset._id)
                  : [...current, asset._id],
              )
            }
          />
        ))}
      </Grid>
    );
  },
};

export const Disabled: Story = {
  args: { disabled: true },
  render: (args) => (
    <Grid maxWidth="360px">
      <AssetPickerCard {...args} />
    </Grid>
  ),
};
