import { DiceFive, Gear, PencilSimple, Trash } from "@phosphor-icons/react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { Grid, HStack, Stack } from "ui/primitives";

import { Button } from "../../Button";
import { IconButton } from "../../IconButton";
import { Text } from "../../Text";
import { Tooltip } from "../Tooltip";

/**
 * A short hint shown on hover and on keyboard focus. Touch screens never
 * show it, so a tooltip only repeats or adds to what is already there; an
 * explanation the reader needs goes in a Popover opened by a button instead
 * (see AddsControl's help button). Icon buttons name themselves with
 * `label` and show the same words as their tooltip.
 */
const meta = {
  title: "Components/Tooltip",
  component: Tooltip,
  args: {
    title: "Rolls +iron, adds included",
    side: "top",
    children: <Button startIcon={<DiceFive />}>Roll Iron</Button>,
  },
  argTypes: {
    side: {
      control: "inline-radio",
      options: ["top", "bottom", "left", "right"],
    },
    children: { control: false },
  },
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** Each side, so a tooltip near an edge can open away from it. */
export const Sides: Story = {
  render: () => (
    <Grid
      gridTemplateColumns="repeat(auto-fit, minmax(120px, max-content))"
      gap="6"
      padding="10"
    >
      {(["top", "right", "bottom", "left"] as const).map((side) => (
        <Tooltip key={side} title={`Opens ${side}`} side={side}>
          <Button>{side}</Button>
        </Tooltip>
      ))}
    </Grid>
  ),
};

/**
 * Icon buttons: the label is the button's name and its tooltip, so a screen
 * reader hears it once.
 */
export const IconButtons: Story = {
  render: () => (
    <HStack gap="1">
      <IconButton label="Edit Character">
        <PencilSimple />
      </IconButton>
      <IconButton label="Game Settings">
        <Gear />
      </IconButton>
      <IconButton label="Delete Character" tooltipSide="bottom">
        <Trash />
      </IconButton>
    </HStack>
  ),
};

/**
 * A tooltip that adds to a visible label. The text becomes the trigger's
 * description, so it is read after the name.
 */
export const Description: Story = {
  render: () => (
    <Stack gap="2" alignItems="start">
      <Tooltip title="Burn momentum to set a die to your momentum value">
        <Button variant="outline">Burn Momentum</Button>
      </Tooltip>
      <Text variant="caption" color="muted">
        Hover or focus the button. Nothing here depends on the tooltip.
      </Text>
    </Stack>
  ),
};
