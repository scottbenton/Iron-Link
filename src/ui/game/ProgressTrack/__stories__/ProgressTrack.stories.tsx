import { DotsThree } from "@phosphor-icons/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { fn } from "storybook/test";

import { Box, HStack, Stack } from "ui/primitives";

import { IconButton } from "../../../components/IconButton";
import { sampleMoves } from "../../../docs/fixtures/datasworn";
import { RollButton } from "../../RollButton";
import { ProgressTrack } from "../ProgressTrack";

const meta = {
  title: "Game/ProgressTrack",
  component: ProgressTrack,
  args: {
    label: "Recover the Hollow Crown",
    typeLabel: "Vow",
    rank: "formidable",
    ticks: 14,
  },
  argTypes: {
    rank: {
      control: "select",
      options: ["troublesome", "dangerous", "formidable", "extreme", "epic"],
    },
    ticks: { control: { type: "range", min: 0, max: 40 } },
  },
  // The game sidebar's default width (Sidebar: 280 to 560, 360 by default),
  // less its panel padding.
  decorators: [
    (Story) => (
      <Box width="336px" maxWidth="100%">
        <Story />
      </Box>
    ),
  ],
} satisfies Meta<typeof ProgressTrack>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: function Render(args) {
    const [ticks, setTicks] = useState(args.ticks);
    return <ProgressTrack {...args} ticks={ticks} onChange={setTicks} />;
  },
};

export const Vow: Story = {
  render: function Render() {
    const [ticks, setTicks] = useState(14);
    return (
      <ProgressTrack
        label="Recover the Hollow Crown"
        typeLabel="Vow"
        rank="formidable"
        description="Taken at the gates of Thornhold, before the elders."
        ticks={ticks}
        onChange={setTicks}
        headerAction={
          <IconButton label="Vow options" size="sm">
            <DotsThree weight="bold" />
          </IconButton>
        }
        actions={
          <RollButton size="sm">{sampleMoves.fulfillYourVow.name}</RollButton>
        }
      />
    );
  },
};

/**
 * A track with several actions under its boxes, at the sidebar's narrowest
 * (280px) and default widths. Minus and plus live in the header's corner,
 * so the actions have the row to themselves and wrap onto a second line
 * rather than crowding the stepper.
 */
export const ManyActions: Story = {
  decorators: [(Story) => <Story />],
  render: function Render() {
    const [ticks, setTicks] = useState(22);
    return (
      <HStack gap="6" alignItems="flex-start" flexWrap="wrap">
        {[280, 336].map((width) => (
          <Box key={width} width={`${width}px`}>
            <ProgressTrack
              label="Defeat the Iron Wraith"
              typeLabel="Combat"
              rank="extreme"
              ticks={ticks}
              onChange={setTicks}
              headerAction={
                <IconButton label="Combat options" size="sm">
                  <DotsThree weight="bold" />
                </IconButton>
              }
              actions={
                <>
                  <RollButton size="sm">Take Decisive Action</RollButton>
                  <RollButton size="sm">Strike</RollButton>
                  <RollButton size="sm">Clash</RollButton>
                  <RollButton size="sm">React Under Fire</RollButton>
                </>
              }
            />
          </Box>
        ))}
      </HStack>
    );
  },
};

export const EveryRank: Story = {
  render: () => (
    <Stack gap="3">
      <ProgressTrack
        label="Escape the Wreck"
        typeLabel="Combat"
        rank="troublesome"
        ticks={24}
        onChange={fn()}
      />
      <ProgressTrack
        label="Cross the Shattered Wastes"
        typeLabel="Journey"
        rank="dangerous"
        ticks={16}
        onChange={fn()}
      />
      <ProgressTrack
        label="Duel with the Blood Raider"
        typeLabel="Combat"
        rank="formidable"
        ticks={8}
        onChange={fn()}
      />
      <ProgressTrack
        label="Unmask the Iron Prophet"
        typeLabel="Vow"
        rank="extreme"
        ticks={6}
        onChange={fn()}
      />
      <ProgressTrack
        label="End the Long Winter"
        typeLabel="Vow"
        rank="epic"
        ticks={3}
        onChange={fn()}
      />
    </Stack>
  ),
};

export const EpicVow: Story = {
  args: {
    label: "Find the Lost Fleet of the Exodus",
    typeLabel: "Background Vow",
    rank: "epic",
    ticks: 7,
    onChange: fn(),
  },
};

export const Completed: Story = {
  args: {
    label: "Rescue Orrin from the Iron Pits",
    typeLabel: "Vow",
    rank: "dangerous",
    ticks: 40,
    completed: true,
  },
};

export const ReadOnly: Story = {
  args: {
    label: "Track the Wyvern",
    typeLabel: "Journey",
    rank: "extreme",
    ticks: 11,
  },
};

/**
 * Legacy tracks carry no experience pips any more: experience is one meter
 * (XPMeter), since Ironsworn and Starforged earn it so differently.
 */
export const LegacyTracks: Story = {
  render: function Render() {
    const [quests, setQuests] = useState(18);
    return (
      <Stack gap="3">
        <ProgressTrack
          label="Quests"
          legacy
          ticks={quests}
          onChange={setQuests}
        />
        <ProgressTrack label="Bonds" legacy ticks={9} onChange={fn()} />
        <ProgressTrack label="Discoveries" legacy ticks={40} onChange={fn()} />
      </Stack>
    );
  },
};

export const Plain: Story = {
  args: {
    plain: true,
    label: "Map the Drowned Halls",
    typeLabel: "Delve",
    rank: "dangerous",
    ticks: 20,
    onChange: fn(),
  },
};

/**
 * Inside a sidebar at its narrowest (280px), default (360px) and a mid width,
 * on the sidebar's muted background with its panel padding.
 */
export const InSidebar: Story = {
  decorators: [(Story) => <Story />],
  render: function Render() {
    const [vow, setVow] = useState(14);
    const [journey, setJourney] = useState(16);
    return (
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
            <ProgressTrack
              label="Recover the Hollow Crown"
              typeLabel="Vow"
              rank="formidable"
              ticks={vow}
              onChange={setVow}
              headerAction={
                <IconButton label="Vow options" size="sm">
                  <DotsThree weight="bold" />
                </IconButton>
              }
              actions={
                <RollButton size="sm">
                  {sampleMoves.fulfillYourVow.name}
                </RollButton>
              }
            />
            <ProgressTrack
              label="Cross the Shattered Wastes to the Iron Spire of Kael"
              typeLabel="Journey"
              rank="dangerous"
              description="Through the Flooded Lands, before the first snow."
              ticks={journey}
              onChange={setJourney}
            />
            <ProgressTrack label="Quests" legacy ticks={18} onChange={fn()} />
            <ProgressTrack
              label="Rescue Orrin from the Iron Pits"
              typeLabel="Vow"
              rank="dangerous"
              ticks={40}
              completed
            />
          </Stack>
        ))}
      </HStack>
    );
  },
};

/**
 * Tracks marking progress at each rank. New ticks draw in tick order, like
 * a pen; however many a mark adds (1 at Epic, 4 at Formidable, 12 at
 * Troublesome), the change finishes within 240ms, easing out. Tap quickly:
 * a tap finishes the line before it at once, so only the newest line is
 * moving and the drawn lines always match the value. Erasing draws lines
 * back out together.
 */
export const TickAnimationOnTracks: Story = {
  render: function Render() {
    const [epic, setEpic] = useState(5);
    const [formidable, setFormidable] = useState(8);
    const [troublesome, setTroublesome] = useState(0);
    return (
      <Stack gap="3">
        <ProgressTrack
          label="End the Long Winter"
          typeLabel="Vow"
          rank="epic"
          ticks={epic}
          onChange={setEpic}
        />
        <ProgressTrack
          label="Duel with the Blood Raider"
          typeLabel="Combat"
          rank="formidable"
          ticks={formidable}
          onChange={setFormidable}
        />
        <ProgressTrack
          label="Escape the Wreck"
          typeLabel="Combat"
          rank="troublesome"
          ticks={troublesome}
          onChange={setTroublesome}
        />
      </Stack>
    );
  },
};
