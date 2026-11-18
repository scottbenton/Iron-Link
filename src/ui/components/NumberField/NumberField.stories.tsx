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
  argTypes: { size: { control: "inline-radio", options: ["sm", "md"] } },
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
