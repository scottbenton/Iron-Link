import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import { HStack, Stack } from "ui/primitives";

import { InitiativeChip } from "../InitiativeChip";
import { InitiativeOption, InitiativeStatus } from "../initiativeLabels";

const meta = {
  title: "Game/InitiativeChip",
  component: InitiativeChip,
  args: { status: "hasInitiative", wording: "starforged" },
  argTypes: {
    status: {
      control: "inline-radio",
      options: ["hasInitiative", "noInitiative", "outOfCombat"],
    },
    wording: { control: "inline-radio", options: ["starforged", "ironsworn"] },
  },
} satisfies Meta<typeof InitiativeChip<InitiativeStatus>>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: function Render(args) {
    const [status, setStatus] = useState(args.status as InitiativeStatus);
    return (
      <InitiativeChip
        {...args}
        status={status}
        onStatusChange={(next) => setStatus(next as InitiativeStatus)}
      />
    );
  },
};

const statuses: InitiativeStatus[] = [
  "hasInitiative",
  "noInitiative",
  "outOfCombat",
];

/**
 * No icons and no good or bad colours: statuses in a fight share the accent
 * look and differ by their words; Out of Combat is muted.
 */
export const Wording: Story = {
  render: () => (
    <Stack gap="3">
      <HStack gap="2" flexWrap="wrap">
        {statuses.map((status) => (
          <InitiativeChip key={status} status={status} wording="starforged" />
        ))}
      </HStack>
      <HStack gap="2" flexWrap="wrap">
        {statuses.map((status) => (
          <InitiativeChip key={status} status={status} wording="ironsworn" />
        ))}
      </HStack>
    </Stack>
  ),
};

/**
 * The menu version: the chip opens a menu of the statuses. Being a button,
 * it stands on a ledge and sinks onto it when pressed, like a Button; the
 * plain chips above are flat.
 */
export const Changeable: Story = {
  render: function Render() {
    const [starforged, setStarforged] =
      useState<InitiativeStatus>("noInitiative");
    const [ironsworn, setIronsworn] = useState<InitiativeStatus>("outOfCombat");
    return (
      <HStack gap="2" flexWrap="wrap">
        <InitiativeChip status={starforged} onStatusChange={setStarforged} />
        <InitiativeChip
          status={ironsworn}
          onStatusChange={setIronsworn}
          wording="ironsworn"
        />
      </HStack>
    );
  },
};

/**
 * Statuses passed in as data, the way rules data could supply them. The chip
 * takes any values and labels; it only needs to know which one is the
 * resting state. "Boarding Action" is a made-up fourth status, there to
 * show the menu taking more than three.
 */
const seaFight: InitiativeOption[] = [
  { value: "in_control", label: "In Control" },
  { value: "bad_spot", label: "In a Bad Spot" },
  { value: "boarding", label: "Boarding Action" },
  { value: "out_of_combat", label: "Out of Combat", resting: true },
];

export const FromData: Story = {
  render: function Render() {
    const [status, setStatus] = useState("boarding");
    return (
      <Stack gap="3">
        <InitiativeChip
          status={status}
          options={seaFight}
          onStatusChange={setStatus}
        />
        <HStack gap="2" flexWrap="wrap">
          {seaFight.map((option) => (
            <InitiativeChip
              key={option.value}
              status={option.value}
              options={seaFight}
            />
          ))}
        </HStack>
      </Stack>
    );
  },
};
