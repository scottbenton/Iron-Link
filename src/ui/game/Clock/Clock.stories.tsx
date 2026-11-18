import { DotsThree } from "@phosphor-icons/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import { Box, HStack, Stack } from "ui/primitives";

import { IconButton } from "../../components/IconButton";
import { sampleMoves } from "../../stories/fixtures/datasworn";
import { ProgressTrack } from "../ProgressTrack";
import { RollButton } from "../RollButton";
import { Clock, ClockProps } from "./Clock";

const meta = {
  title: "Game/Clock",
  component: Clock,
  args: {
    label: "The Iron Siege falls",
    segments: 6,
    value: 2,
  },
  argTypes: {
    segments: { control: "inline-radio", options: [4, 6, 8, 10] },
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
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

/**
 * The gaps are real gaps, not lines in the surface colour, so the clocks sit
 * cleanly on the sidebar's muted background as well as on cards.
 */
export const OnMutedBackground: Story = {
  render: () => (
    <HStack
      gap="6"
      alignItems="flex-start"
      flexWrap="wrap"
      background="bg.muted"
      padding="4"
      borderRadius="lg"
    >
      <Interactive size="sm" label="Ruin at Thornhold" segments={6} start={4} />
      <Interactive size="sm" label="The Long Winter" segments={10} start={3} />
    </HStack>
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
      <Clock label="The bridge collapses" segments={4} value={4} />
      <Clock label="The Forgeborn awaken" segments={10} value={10} />
    </HStack>
  ),
};

export const ReadOnly: Story = {
  render: () => (
    <HStack gap="6" alignItems="flex-start">
      <Clock label="Rumours spread" segments={6} value={2} />
      <Clock label="Supplies run out" segments={10} value={10} />
    </HStack>
  ),
};

export const Sizes: Story = {
  render: () => (
    <HStack gap="6" alignItems="flex-end">
      <Clock label="Small" segments={6} value={2} size="sm" />
      <Clock label="Medium" segments={6} value={3} size="md" />
      <Clock label="Large" segments={8} value={5} size="lg" />
    </HStack>
  ),
};

export const LongLabel: Story = {
  render: () => (
    <Box width="120px">
      <Interactive
        label="The Iron Prophet's cult takes the Havens of Ashfall"
        segments={8}
        start={3}
      />
    </Box>
  ),
};

export const Disabled: Story = {
  args: { disabled: true, onChange: () => {} },
};

/**
 * Click or tap the middle of a dial to add one segment; its tooltip and name
 * say "Advance" and the clock's name, and the change is announced. Hovering
 * the middle tints it and previews the next segment. Full clocks rest: no
 * tint, and the tooltip says the clock is full. Clicking a segment still
 * sets the clock to it.
 */
export const CentreAdvances: Story = {
  render: () => (
    <HStack gap="6" alignItems="flex-start" flexWrap="wrap">
      <Interactive label="Guards notice" segments={4} start={0} />
      <Interactive label="The storm arrives" segments={6} start={3} />
      <Interactive label="The Forgeborn awaken" segments={10} start={9} />
      <Interactive label="The bridge collapses" segments={6} start={6} />
      <Interactive size="sm" label="Ruin at Thornhold" segments={8} start={2} />
    </HStack>
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
            segments={10}
            start={3}
          />
          <CardClock label="Rumours spread" segments={6} start={0} size="sm" />
        </Stack>
      ))}
    </HStack>
  ),
};
