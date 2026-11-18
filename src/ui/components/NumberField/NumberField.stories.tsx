import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import { Grid, HStack, Stack } from "styled-system/jsx";

import { NumberField } from "./NumberField";

const meta = {
  title: "Components/NumberField",
  component: NumberField,
  args: {
    label: "Momentum",
    defaultValue: 2,
    min: -6,
    max: 10,
    showSign: true,
  },
  argTypes: {
    size: { control: "inline-radio", options: ["sm", "md"] },
    variant: { control: "inline-radio", options: ["outline", "quiet"] },
  },
} satisfies Meta<typeof NumberField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

const stats = ["Edge", "Heart", "Iron", "Shadow", "Wits"] as const;

/** Stat entry: five stats from 1 to 3, as at character creation. */
export const StatEntry: Story = {
  render: function Render() {
    const [values, setValues] = useState<Record<string, number | null>>({
      Edge: 3,
      Heart: 2,
      Iron: 2,
      Shadow: 1,
      Wits: 1,
    });
    const total = Object.values(values).reduce<number>(
      (sum, value) => sum + (value ?? 0),
      0,
    );
    return (
      <Stack gap="3">
        <HStack gap="3" flexWrap="wrap" alignItems="flex-start">
          {stats.map((stat) => (
            <NumberField
              key={stat}
              label={stat}
              min={1}
              max={3}
              chars={1}
              value={values[stat]}
              onValueChange={(value) =>
                setValues((previous) => ({ ...previous, [stat]: value }))
              }
            />
          ))}
        </HStack>
        {total !== 9 && (
          <p>Your stats add up to {total}. Starting stats add up to 9.</p>
        )}
      </Stack>
    );
  },
};

export const Adds: Story = {
  render: () => (
    <Grid columns={{ base: 1, sm: 3 }} gap="4" maxWidth="560px">
      <NumberField label="Adds" defaultValue={0} min={0} max={10} showSign />
      <NumberField label="Supply" defaultValue={5} min={0} max={5} />
      <NumberField
        label="Experience"
        defaultValue={12}
        min={0}
        max={30}
        hideButtons
        description="Earned, out of 30."
      />
    </Grid>
  ),
};

export const States: Story = {
  render: () => (
    <Stack gap="4">
      <NumberField
        label="Edge"
        defaultValue={4}
        min={1}
        max={3}
        error="Stats go from 1 to 3."
      />
      <NumberField label="Health" defaultValue={5} readOnly />
      <NumberField label="Spirit" defaultValue={3} disabled />
      <NumberField size="sm" label="Small" defaultValue={1} showSign />
      <NumberField label="Full width" fullWidth defaultValue={0} />
    </Stack>
  ),
};

/**
 * Label, help, control, error: help text sits under the label and the error
 * under the field, as in every library field.
 */
export const HelpAndError: Story = {
  render: () => (
    <NumberField
      label="Starting Momentum"
      description="Most characters start at +2."
      defaultValue={11}
      min={-6}
      max={10}
      showSign
      error="Momentum goes no higher than +10."
    />
  ),
};

/**
 * `size="sm"` with `variant="quiet"`, as in a world entry's details: the
 * numbers read as text until hovered or focused, and line up with the
 * labels and the quiet text fields beside them.
 */
export const QuietDetails: Story = {
  render: () => (
    <Grid
      columns={2}
      columnGap="6"
      rowGap="3"
      maxWidth="420px"
      padding="4"
      borderWidth="1px"
      borderColor="border.default"
      borderRadius="lg"
      background="bg.surface"
    >
      <NumberField
        size="sm"
        variant="quiet"
        label="Supply"
        defaultValue={3}
        min={0}
        max={5}
      />
      <NumberField
        size="sm"
        variant="quiet"
        label="Bounty"
        defaultValue={150}
        min={0}
        chars={4}
        hideButtons
      />
      <NumberField
        size="sm"
        variant="quiet"
        label="Crew"
        defaultValue={12}
        min={0}
        fullWidth
      />
      <NumberField
        size="sm"
        variant="quiet"
        label="Rank"
        defaultValue={6}
        min={1}
        max={5}
        error="Ranks go from 1 to 5."
      />
    </Grid>
  ),
};
