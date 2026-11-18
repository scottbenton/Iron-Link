import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import { HStack, Stack } from "styled-system/jsx";

import { InitiativeChip } from "./InitiativeChip";
import { InitiativeStatus } from "./initiativeLabels";

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
} satisfies Meta<typeof InitiativeChip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: function Render(args) {
    const [status, setStatus] = useState<InitiativeStatus>(args.status);
    return (
      <InitiativeChip {...args} status={status} onStatusChange={setStatus} />
    );
  },
};

const statuses: InitiativeStatus[] = [
  "hasInitiative",
  "noInitiative",
  "outOfCombat",
];

export const Wording: Story = {
  render: () => (
    <Stack gap="3">
      <HStack gap="2">
        {statuses.map((status) => (
          <InitiativeChip key={status} status={status} wording="starforged" />
        ))}
      </HStack>
      <HStack gap="2">
        {statuses.map((status) => (
          <InitiativeChip key={status} status={status} wording="ironsworn" />
        ))}
      </HStack>
    </Stack>
  ),
};
