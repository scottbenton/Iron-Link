import { Info } from "@phosphor-icons/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import { IconButton } from "ui/components/IconButton";
import { Text } from "ui/components/Text";

import { Grid, Stack } from "styled-system/jsx";

import { classicAsset, sampleAssets } from "../../stories/fixtures/datasworn";
import { AssetPickerCard } from "./AssetPickerCard";

const ironclad = classicAsset("combat_talent", "ironclad");

const meta: Meta<typeof AssetPickerCard> = {
  title: "Game/AssetPickerCard",
  component: AssetPickerCard,
  args: { asset: ironclad },
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

/**
 * Choosing paths, several at once. Each card has a Select button whose hit
 * area covers the card, so a click anywhere selects it; Select again to
 * clear. The button is a toggle named for the asset ("Select Ace",
 * pressed or not). Hover a card and press it: the accent outline shows at
 * once, while the pointer is still on the card.
 */
export const Picking: Story = {
  render: function Render() {
    const [picked, setPicked] = useState<string[]>([sampleAssets.ace._id]);
    const assets = [
      sampleAssets.ace,
      sampleAssets.navigator,
      sampleAssets.starship,
      sampleAssets.protocolBot,
      sampleAssets.ironswornHawk,
      ironclad,
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

/**
 * Hovered, then selected, held still for review. `data-hover` stands in
 * for the pointer: the left card is hovered and not selected (darker
 * border, Select in its hover colour), the right is hovered and selected
 * (the accent outline wins over the hover border).
 */
export const HoveredThenSelected: Story = {
  render: () => (
    <Grid columns={{ base: 1, md: 2 }} gap="4" alignItems="start">
      <HoveredCard selected={false} />
      <HoveredCard selected />
    </Grid>
  ),
};

function HoveredCard(props: { selected: boolean }) {
  const { selected } = props;
  return (
    <Stack
      gap="2"
      ref={(node: HTMLDivElement | null) =>
        node
          ?.querySelector("[data-card-overlay]")
          ?.setAttribute("data-hover", "")
      }
    >
      <Text variant="caption" color="muted">
        {selected ? "Hovered and selected" : "Hovered"}
      </Text>
      <AssetPickerCard
        asset={sampleAssets.navigator}
        selected={selected}
        onSelect={() => {}}
      />
    </Stack>
  );
}

/**
 * A compact list: abilities stay hidden until the info button shows them.
 * The info button is its own control above the card's hit area, so
 * pressing it does not select the asset.
 */
export const WithInfoToggle: Story = {
  render: function Render() {
    const [picked, setPicked] = useState<string>();
    const [open, setOpen] = useState<string[]>([]);
    const assets = [
      ironclad,
      sampleAssets.ironswornDuelist,
      sampleAssets.ironswornHawk,
    ];
    return (
      <Grid columns={{ base: 1, md: 3 }} gap="4" alignItems="start">
        {assets.map((asset) => {
          const shown = open.includes(asset._id);
          return (
            <AssetPickerCard
              key={asset._id}
              asset={asset}
              showAbilities={shown}
              selected={picked === asset._id}
              onSelect={() =>
                setPicked((current) =>
                  current === asset._id ? undefined : asset._id,
                )
              }
              headerActions={
                <IconButton
                  label={
                    shown
                      ? `Hide abilities of ${asset.name}`
                      : `Show abilities of ${asset.name}`
                  }
                  size="sm"
                  aria-pressed={shown}
                  onClick={() =>
                    setOpen((current) =>
                      shown
                        ? current.filter((id) => id !== asset._id)
                        : [...current, asset._id],
                    )
                  }
                >
                  <Info />
                </IconButton>
              }
            />
          );
        })}
      </Grid>
    );
  },
};

/**
 * One press picks the asset and moves on (a dialog that closes): leave
 * `selected` undefined and Select is a plain button, not a toggle.
 */
export const PickOne: Story = {
  render: function Render() {
    const [picked, setPicked] = useState<string>();
    return (
      <Stack gap="3" maxWidth="720px">
        <Text variant="bodySm" color="muted" aria-live="polite">
          {picked ? `Added ${picked}` : "Pick a path to add it"}
        </Text>
        <Grid columns={{ base: 1, md: 2 }} gap="4" alignItems="start">
          {[sampleAssets.ace, sampleAssets.navigator].map((asset) => (
            <AssetPickerCard
              key={asset._id}
              asset={asset}
              onSelect={() => setPicked(asset.name)}
            />
          ))}
        </Grid>
      </Stack>
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
