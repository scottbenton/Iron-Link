import { DotsThree } from "@phosphor-icons/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { fn } from "storybook/test";

import { Box, Stack } from "styled-system/jsx";

import { IconButton } from "../../components/IconButton";
import { sampleMoves } from "../../stories/fixtures/datasworn";
import { RollButton } from "../RollButton";
import { ProgressTrack } from "./ProgressTrack";

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
  decorators: [
    (Story) => (
      <Box maxWidth="480px">
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
          xpSpent={4}
        />
        <ProgressTrack label="Bonds" legacy ticks={9} onChange={fn()} />
        <ProgressTrack
          label="Discoveries"
          legacy
          ticks={40}
          xpSpent={12}
          onChange={fn()}
        />
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
