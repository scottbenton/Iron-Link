import type { Meta, StoryObj } from "@storybook/react-vite";

import { Stack } from "styled-system/jsx";

import { Text } from "../Text";
import { Kbd, KbdCombo } from "./Kbd";

const meta: Meta<typeof Kbd> = {
  title: "Components/Kbd",
  component: Kbd,
};

export default meta;
type Story = StoryObj<typeof Kbd>;

export const Hints: Story = {
  render: () => (
    <Stack gap="3">
      <Text variant="bodySm">
        Press <Kbd>Delete</Kbd> to close the note.
      </Text>
      <Text variant="bodySm">
        Bold: <KbdCombo keys={["Ctrl", "B"]} />. Search:{" "}
        <KbdCombo keys={["Ctrl", "K"]} />.
      </Text>
      <Text variant="bodySm">
        Move between tabs with <Kbd>←</Kbd> and <Kbd>→</Kbd>.
      </Text>
    </Stack>
  ),
};
