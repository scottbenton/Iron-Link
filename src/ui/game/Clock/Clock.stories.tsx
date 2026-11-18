import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import { Box, Grid, HStack, Stack } from "styled-system/jsx";

import { Clock, ClockProps, ClockVariant } from "./Clock";

const variants: ClockVariant[] = [
  "wedges",
  "ring",
  "pips",
  "sweep",
  "bar",
  "classic",
];

const variantNotes: Record<ClockVariant, string> = {
  wedges:
    "Recommended default. A pie of wedges parted by a thin gap, so there are no lines to fight the fill.",
  ring: "A segmented donut with the count in the middle. Reads well small, on asset cards.",
  pips: "A dot per segment around the count. The lightest; best at 8 or more segments.",
  sweep:
    "One solid fill, with segment ticks on the rim instead of lines across the face.",
  bar: "A notched bar for tight rows: lists of clocks, a sidebar, a table.",
  classic:
    "The current outlined pie, with lighter lines that soften over the fill.",
};

const meta = {
  title: "Game/Clock",
  component: Clock,
  args: {
    label: "The Iron Siege falls",
    segments: 6,
    value: 2,
    variant: "wedges",
  },
  argTypes: {
    segments: { control: "inline-radio", options: [4, 6, 8, 10] },
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
    variant: { control: "inline-radio", options: variants },
  },
} satisfies Meta<typeof Clock>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: function Render(args) {
    const [value, setValue] = useState(args.value);
    return <Clock {...args} value={value} onChange={setValue} />;
  },
};

function Interactive(
  props: Omit<ClockProps, "value" | "onChange"> & { start: number },
) {
  const { start, ...rest } = props;
  const [value, setValue] = useState(start);
  return <Clock {...rest} value={value} onChange={setValue} />;
}

const comparison = [
  { label: "Guards notice", segments: 4, start: 1 },
  { label: "The storm arrives", segments: 6, start: 3 },
  { label: "Raiders reach the village", segments: 8, start: 6 },
  { label: "The Forgeborn awaken", segments: 10, start: 7 },
  { label: "The bridge collapses", segments: 6, start: 6 },
  { label: "Rumours spread", segments: 8, start: 0 },
];

/**
 * Every style side by side at 4, 6, 8 and 10 segments, full and empty. All
 * are live: click a segment, or tab to one and use the arrow keys.
 */
export const StyleComparison: Story = {
  render: () => (
    <Stack gap="8">
      {variants.map((variant) => (
        <Stack key={variant} gap="3">
          <Stack gap="0.5">
            <Box fontFamily="heading" fontWeight="semibold" fontSize="lg">
              {variant}
            </Box>
            <Box fontSize="sm" color="fg.muted" maxWidth="60ch">
              {variantNotes[variant]}
            </Box>
          </Stack>
          <HStack gap="6" alignItems="flex-start" flexWrap="wrap">
            {comparison.map((clock) => (
              <Box key={clock.label} width="112px">
                <Interactive
                  variant={variant}
                  label={clock.label}
                  segments={clock.segments}
                  start={clock.start}
                />
              </Box>
            ))}
          </HStack>
        </Stack>
      ))}
    </Stack>
  ),
};

/** The same clocks at the small size used on asset cards. */
export const StyleComparisonSmall: Story = {
  render: () => (
    <Grid
      gridTemplateColumns="auto repeat(4, max-content)"
      columnGap="6"
      rowGap="4"
      alignItems="center"
    >
      {variants.map((variant) => (
        <Box key={variant} display="contents">
          <Box fontFamily="heading" fontWeight="semibold">
            {variant}
          </Box>
          {comparison.slice(0, 4).map((clock) => (
            <Interactive
              key={clock.label}
              variant={variant}
              size="sm"
              hideLabel
              label={clock.label}
              segments={clock.segments}
              start={clock.start}
            />
          ))}
        </Box>
      ))}
    </Grid>
  ),
};

/**
 * The gaps are real gaps, not lines in the surface colour, so the clocks sit
 * cleanly on the sidebar's muted background as well as on cards.
 */
export const OnMutedBackground: Story = {
  render: () => (
    <Stack gap="4" background="bg.muted" padding="4" borderRadius="lg">
      {variants.map((variant) => (
        <HStack key={variant} gap="6" alignItems="flex-start" flexWrap="wrap">
          <Interactive
            variant={variant}
            size="sm"
            label="Ruin at Thornhold"
            segments={6}
            start={4}
          />
          <Interactive
            variant={variant}
            size="sm"
            label="The Long Winter"
            segments={10}
            start={3}
          />
        </HStack>
      ))}
    </Stack>
  ),
};

export const SegmentCounts: Story = {
  render: () => (
    <HStack gap="6" alignItems="flex-start" flexWrap="wrap">
      <Interactive label="Guards notice the breach" segments={4} start={1} />
      <Interactive label="The storm arrives" segments={6} start={3} />
      <Interactive label="Raiders reach the village" segments={8} start={5} />
      <Interactive label="The Forgeborn awaken" segments={10} start={7} />
    </HStack>
  ),
};

/** A full clock stays in the accent colour; it no longer turns red. */
export const Full: Story = {
  render: () => (
    <HStack gap="6" alignItems="flex-start" flexWrap="wrap">
      {variants.map((variant) => (
        <Clock
          key={variant}
          variant={variant}
          label="The bridge collapses"
          segments={4}
          value={4}
        />
      ))}
    </HStack>
  ),
};

export const ReadOnly: Story = {
  render: () => (
    <HStack gap="6" alignItems="flex-start">
      <Clock label="Rumours spread" segments={6} value={2} />
      <Clock label="Supplies run out" segments={10} value={10} />
      <Clock label="Rumours spread" segments={6} value={2} variant="ring" />
    </HStack>
  ),
};

export const Sizes: Story = {
  render: () => (
    <Stack gap="6">
      {(["wedges", "ring", "bar"] as const).map((variant) => (
        <HStack key={variant} gap="6" alignItems="flex-end">
          <Clock
            label="Small"
            segments={6}
            value={2}
            size="sm"
            variant={variant}
          />
          <Clock
            label="Medium"
            segments={6}
            value={3}
            size="md"
            variant={variant}
          />
          <Clock
            label="Large"
            segments={8}
            value={5}
            size="lg"
            variant={variant}
          />
        </HStack>
      ))}
    </Stack>
  ),
};

export const LongLabel: Story = {
  render: () => (
    <HStack gap="6" alignItems="flex-start">
      <Box width="120px">
        <Interactive
          label="The Iron Prophet's cult takes the Havens of Ashfall"
          segments={8}
          start={3}
        />
      </Box>
      <Box width="120px">
        <Interactive
          variant="bar"
          label="The Iron Prophet's cult takes the Havens of Ashfall"
          segments={8}
          start={3}
        />
      </Box>
    </HStack>
  ),
};

export const Disabled: Story = {
  args: { disabled: true, onChange: () => {} },
};
