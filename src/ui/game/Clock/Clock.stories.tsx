import { DotsThree } from "@phosphor-icons/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import { Box, Grid, HStack, Stack } from "styled-system/jsx";

import { IconButton } from "../../components/IconButton";
import { sampleMoves } from "../../stories/fixtures/datasworn";
import { ProgressTrack } from "../ProgressTrack";
import { RollButton } from "../RollButton";
import { Clock, ClockProps, ClockVariant } from "./Clock";

const variants: ClockVariant[] = [
  "ring",
  "wedges",
  "pips",
  "sweep",
  "bar",
  "classic",
];

const variantNotes: Record<ClockVariant, string> = {
  wedges:
    "A pie of wedges parted by a thin gap, so there are no lines to fight the fill.",
  ring: "The default. A segmented donut with the count in the middle. Reads well small, on asset cards.",
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
    variant: "ring",
  },
  argTypes: {
    segments: { control: "inline-radio", options: [4, 6, 8, 10] },
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
    variant: { control: "inline-radio", options: variants },
    presentation: { control: "inline-radio", options: ["bare", "card"] },
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
      {(["ring", "wedges", "bar"] as const).map((variant) => (
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

/**
 * Click or tap the middle of a dial to add one segment; its tooltip and name
 * say "Advance" and the clock's name, and the change is announced. Hovering
 * the middle previews the next segment. A pie (wedges, sweep, classic) shows
 * a plus there on hover, as it has no count in the middle. Full clocks rest:
 * no tint, and the tooltip says the clock is full. Clicking a segment still
 * sets the clock to it. The bar has no middle, so no centre.
 */
export const CentreAdvances: Story = {
  render: () => (
    <Stack gap="6">
      {variants
        .filter((variant) => variant !== "bar")
        .map((variant) => (
          <HStack key={variant} gap="6" alignItems="flex-start" flexWrap="wrap">
            <Box width="96px" fontFamily="heading" fontWeight="bold">
              {variant}
            </Box>
            <Interactive
              variant={variant}
              label="Guards notice"
              segments={4}
              start={0}
            />
            <Interactive
              variant={variant}
              label="The storm arrives"
              segments={6}
              start={3}
            />
            <Interactive
              variant={variant}
              label="The Forgeborn awaken"
              segments={10}
              start={9}
            />
            <Interactive
              variant={variant}
              label="The bridge collapses"
              segments={6}
              start={6}
            />
            <Interactive
              variant={variant}
              size="sm"
              label="Ruin at Thornhold"
              segments={8}
              start={2}
            />
          </HStack>
        ))}
    </Stack>
  ),
};

function CardClock(
  props: Omit<ClockProps, "value" | "onChange" | "presentation"> & {
    start: number;
  },
) {
  const { start, ...rest } = props;
  const [value, setValue] = useState(start);
  return (
    <Clock
      {...rest}
      presentation="card"
      value={value}
      onChange={setValue}
      headerAction={
        <IconButton label={`${rest.label} options`} size="sm">
          <DotsThree weight="bold" />
        </IconButton>
      }
    />
  );
}

/**
 * The card presentation, with ProgressTrack's header: eyebrow, name and
 * description on the left; minus, plus and the menu at the top right. The
 * dial sits under the header where a track has its boxes, with room beside
 * it for actions (here the clock's Roll Progress). Minus and plus step one
 * segment, are disabled at the ends and grow to 44px on touch; the centre
 * still advances by one for a mouse or a large finger.
 */
export const Card: Story = {
  render: () => (
    <Box width="336px" maxWidth="100%">
      <CardClock
        label="The archive floods"
        typeLabel="Tension Clock"
        description="Advance when you Pay the Price inside the archive."
        segments={6}
        start={2}
        actions={<RollButton size="sm">Roll Progress</RollButton>}
      />
    </Box>
  ),
};

/**
 * A vow, a clock and a journey in one list: the same eyebrow, title type,
 * spacing and controls in the same corner, so the eye and the thumb find
 * them in the same place on every card.
 */
export const CardBesideTracks: Story = {
  render: function Render() {
    const [vow, setVow] = useState(14);
    const [journey, setJourney] = useState(16);
    const menu = (name: string) => (
      <IconButton label={`Options for ${name}`} size="sm">
        <DotsThree weight="bold" />
      </IconButton>
    );
    return (
      <Stack width="336px" maxWidth="100%" gap="3">
        <ProgressTrack
          label="Recover the Hollow Crown"
          typeLabel="Vow"
          rank="formidable"
          description="Sworn at the gates of Thornhold, before the elders."
          ticks={vow}
          onChange={setVow}
          headerAction={menu("Recover the Hollow Crown")}
          actions={
            <RollButton size="sm">{sampleMoves.fulfillYourVow.name}</RollButton>
          }
        />
        <CardClock
          label="The archive floods"
          typeLabel="Tension Clock"
          description="Advance when you Pay the Price inside the archive."
          segments={6}
          start={2}
          actions={<RollButton size="sm">Roll Progress</RollButton>}
        />
        <ProgressTrack
          label="Cross the Shattered Reach to Bleakhold"
          typeLabel="Journey"
          rank="dangerous"
          ticks={journey}
          onChange={setJourney}
          headerAction={menu("Cross the Shattered Reach to Bleakhold")}
        />
      </Stack>
    );
  },
};

/**
 * Empty (minus disabled), full (plus disabled, the centre rests), completed
 * (a badge, no minus or plus, the dial an image) and read-only (no
 * controls at all, as a viewer sees it).
 */
export const CardStates: Story = {
  render: () => (
    <Stack width="336px" maxWidth="100%" gap="3">
      <CardClock
        label="Rumours spread"
        typeLabel="Campaign Clock"
        segments={8}
        start={0}
      />
      <CardClock
        label="The bridge collapses"
        typeLabel="Tension Clock"
        segments={4}
        start={4}
      />
      <Clock
        presentation="card"
        label="The Forgeborn awaken"
        typeLabel="Campaign Clock"
        segments={10}
        value={10}
        completed
        onChange={() => {}}
        headerAction={
          <IconButton label="Options for The Forgeborn awaken" size="sm">
            <DotsThree weight="bold" />
          </IconButton>
        }
      />
      <Clock
        presentation="card"
        label="Supplies run out"
        typeLabel="Tension Clock"
        description="Advance each day the convoy is stranded."
        segments={6}
        value={3}
      />
    </Stack>
  ),
};

/**
 * Card clocks among progress tracks' widths: the game sidebar at its
 * narrowest (280px), default (360px) and a mid width, on its muted
 * background. Long names wrap beside the controls, as a track's do; at
 * 280px the Roll Progress action wraps under the dial. Full clocks rest.
 */
export const CardsInSidebar: Story = {
  render: () => (
    <HStack gap="6" alignItems="flex-start" flexWrap="wrap">
      {[280, 320, 360].map((width) => (
        <Stack
          key={width}
          width={`${width}px`}
          gap="3"
          padding="3"
          background="bg.muted"
          borderWidth="1px"
          borderStyle="solid"
          borderColor="border.default"
        >
          <Box fontSize="xs" color="fg.muted">
            {width}px sidebar
          </Box>
          <CardClock
            label="The archive floods"
            typeLabel="Tension Clock"
            segments={6}
            start={2}
            actions={<RollButton size="sm">Roll Progress</RollButton>}
          />
          <CardClock
            label="The Iron Prophet's cult takes the Havens of Ashfall"
            typeLabel="Campaign Clock"
            description="Advance at the end of each session."
            segments={8}
            start={5}
          />
          <CardClock
            label="The bridge collapses"
            typeLabel="Tension Clock"
            segments={4}
            start={4}
          />
          <CardClock
            label="Raiders reach the village"
            typeLabel="Campaign Clock"
            variant="wedges"
            segments={10}
            start={3}
          />
          <CardClock label="Rumours spread" segments={6} start={0} size="sm" />
        </Stack>
      ))}
    </HStack>
  ),
};
