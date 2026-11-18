import { PencilSimple, Trash } from "@phosphor-icons/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import { Button } from "ui/components/Button";
import { IconButton } from "ui/components/IconButton";

import { Grid, Stack } from "styled-system/jsx";

import {
  sampleAssets,
  starforgedAsset,
} from "../../stories/fixtures/datasworn";
import { AssetCard, AssetCardProps } from "./AssetCard";
import { AssetCardState } from "./assetData";

const meta: Meta<typeof AssetCard> = {
  title: "Game/AssetCard",
  component: AssetCard,
  args: { asset: sampleAssets.starship },
};

export default meta;
type Story = StoryObj<typeof AssetCard>;

/** An asset the character holds, with every change kept in state. */
function Interactive(props: AssetCardProps) {
  const [state, setState] = useState<AssetCardState>(props.state ?? {});
  return (
    <AssetCard
      {...props}
      state={state}
      onAbilityToggle={(index, enabled) =>
        setState((current) => ({
          ...current,
          enabledAbilities: { ...current.enabledAbilities, [index]: enabled },
        }))
      }
      onOptionChange={(key, value) =>
        setState((current) => ({
          ...current,
          optionValues: { ...current.optionValues, [key]: value },
        }))
      }
      onControlChange={(key, value) =>
        setState((current) => ({
          ...current,
          controlValues: { ...current.controlValues, [key]: value },
        }))
      }
      onRollControl={() => {}}
    />
  );
}

const actions = (
  <Button size="sm" variant="ghost" startIcon={<Trash />}>
    Remove
  </Button>
);

/** The Starforged starship: its name field, abilities and Integrity. */
export const Playground: Story = {
  render: (args) => (
    <Stack maxWidth="400px">
      <Interactive
        {...args}
        state={{ optionValues: { name: "Wayfinder" } }}
        headerActions={
          <IconButton label="Customize" size="sm">
            <PencilSimple />
          </IconButton>
        }
        actions={actions}
      />
    </Stack>
  ),
};

/** Starforged and classic assets side by side. */
export const Gallery: Story = {
  render: () => (
    <Grid columns={{ base: 1, md: 2, xl: 3 }} gap="4" alignItems="start">
      <Interactive asset={sampleAssets.ace} actions={actions} />
      <Interactive
        asset={sampleAssets.protocolBot}
        state={{ optionValues: { name: "Tock" } }}
        actions={actions}
      />
      <Interactive asset={sampleAssets.marked} actions={actions} />
      <Interactive
        asset={sampleAssets.ironswornHawk}
        state={{ optionValues: { name: "Swiftwing" } }}
        actions={actions}
      />
      <Interactive asset={sampleAssets.ironswornDuelist} actions={actions} />
      <Interactive asset={sampleAssets.navigator} actions={actions} />
    </Grid>
  ),
};

/** A module marked Broken is out of use until repaired. */
export const Marked: Story = {
  render: () => (
    <Stack maxWidth="400px">
      <Interactive
        asset={starforgedAsset("module", "engine_upgrade")}
        state={{ controlValues: { broken: true } }}
      />
    </Stack>
  ),
};

/** Read-only, as on someone else's sheet: the second ability is ticked. */
export const ReadOnly: Story = {
  args: {
    asset: sampleAssets.protocolBot,
    readOnly: true,
    state: {
      enabledAbilities: { 1: true },
      optionValues: { name: "Tock" },
      controlValues: { health: 2 },
    },
  },
  render: (args) => (
    <Stack maxWidth="400px">
      <AssetCard {...args} />
    </Stack>
  ),
};

/**
 * Collapsed, as on the character sheet: only the unchecked abilities hide.
 * The name field, the checked abilities and Integrity stay, and stay
 * editable. Expand from the header to see and check the rest; uncheck one
 * while collapsed and it hides.
 */
export const Collapsed: Story = {
  render: function Render() {
    const [collapsed, setCollapsed] = useState(true);
    return (
      <Stack maxWidth="400px">
        <Interactive
          asset={sampleAssets.starship}
          state={{
            enabledAbilities: { 1: true },
            optionValues: { name: "Wayfinder" },
            controlValues: { integrity: 3, battered: true },
          }}
          collapsed={collapsed}
          onCollapsedChange={setCollapsed}
        />
      </Stack>
    );
  },
};

/** Collapsed side by side with the same asset expanded, a companion. */
export const CollapsedAndExpanded: Story = {
  render: () => (
    <Grid columns={{ base: 1, md: 2 }} gap="4" alignItems="start">
      <Interactive
        asset={sampleAssets.protocolBot}
        state={{
          enabledAbilities: { 1: true },
          optionValues: { name: "Tock" },
          controlValues: { health: 3 },
        }}
        collapsed
      />
      <Interactive
        asset={sampleAssets.protocolBot}
        state={{
          enabledAbilities: { 1: true },
          optionValues: { name: "Tock" },
          controlValues: { health: 3 },
        }}
      />
    </Grid>
  ),
};
