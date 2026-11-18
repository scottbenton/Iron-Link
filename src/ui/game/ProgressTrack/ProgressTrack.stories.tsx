import { DotsThree } from "@phosphor-icons/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { fn } from "storybook/test";

import { Box, HStack, Stack } from "ui/primitives";

import { Button } from "../../components/Button";
import { IconButton } from "../../components/IconButton";
import { sampleMoves } from "../../stories/fixtures/datasworn";
import { RollButton } from "../RollButton";
import { ProgressBoxes } from "./ProgressBoxes";
import { ProgressTrack } from "./ProgressTrack";
import { MAX_TICKS } from "./progress";
import { TickAnimation } from "./tickAnimation";

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
    tickAnimation: {
      control: "inline-radio",
      options: ["sequence", "box", "together", "fade", "none"],
    },
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

const tickAnimations: { animation: TickAnimation; note: string }[] = [
  {
    animation: "sequence",
    note: "The default. Each line draws in tick order, like a pen: one tick takes 160ms; more ticks shorten each line and the gap between them to fit 240ms.",
  },
  {
    animation: "box",
    note: "A box's new lines draw together, then the next box. Reads as whole boxes filling; a single tick looks the same as sequence.",
  },
  {
    animation: "together",
    note: "Every new line draws at once in 180ms. The old animation, shortened; 12 ticks land as one sweep.",
  },
  {
    animation: "fade",
    note: "Each line starts half drawn and fades in as it finishes, in tick order. The softest; less of a pen stroke.",
  },
  {
    animation: "none",
    note: "No animation, for comparison. Reduced motion looks like this in every variant.",
  },
];

/**
 * The tick animations side by side, all on one count so each button plays
 * them together. Add 1 is an Epic mark, 4 Formidable, 12 Troublesome. Every
 * change finishes within 240ms however many ticks it adds; only CSS
 * transitions run (stroke-dashoffset, plus opacity for fade), with a delay
 * per line, so 40 lines cost no more than one. Erasing draws lines back out
 * together in 140ms.
 */
export const TickAnimations: Story = {
  decorators: [(Story) => <Story />],
  render: function Render() {
    const [ticks, setTicks] = useState(0);
    const add = (amount: number) =>
      setTicks((current) => Math.min(current + amount, MAX_TICKS));
    return (
      <Stack gap="5" maxWidth="720px">
        <HStack gap="2" flexWrap="wrap">
          <Button size="sm" onClick={() => add(1)}>
            Add 1 Tick
          </Button>
          <Button size="sm" onClick={() => add(4)}>
            Add 4 Ticks
          </Button>
          <Button size="sm" onClick={() => add(12)}>
            Add 12 Ticks
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setTicks((current) => Math.max(current - 4, 0))}
          >
            Erase 4 Ticks
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setTicks(0)}>
            Clear
          </Button>
          <Box fontSize="sm" color="fg.muted" alignSelf="center">
            {ticks} of 40 ticks
          </Box>
        </HStack>
        {tickAnimations.map(({ animation, note }) => (
          <Stack key={animation} gap="1.5">
            <Box fontFamily="heading" fontWeight="bold">
              {animation}
            </Box>
            <ProgressBoxes ticks={ticks} animation={animation} />
            <Box fontSize="sm" color="fg.muted" maxWidth="60ch">
              {note}
            </Box>
          </Stack>
        ))}
      </Stack>
    );
  },
};

/** A track marking progress at each rank, with the default animation. */
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
