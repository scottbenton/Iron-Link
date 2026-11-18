import type { Meta, StoryObj } from "@storybook/react-vite";

import { Stack } from "styled-system/jsx";

import { TextArea } from "./TextArea";

const meta = {
  title: "Components/TextArea",
  component: TextArea,
  args: {
    label: "Background",
    placeholder: "Where does your character come from, and what drives them?",
    minRows: 3,
    maxRows: 8,
  },
  decorators: [
    (Story) => (
      <Stack maxWidth="440px">
        <Story />
      </Stack>
    ),
  ],
} satisfies Meta<typeof TextArea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** Type past eight lines: the field stops growing and scrolls. */
export const AutoGrow: Story = {
  args: {
    label: "Vow Description",
    defaultValue:
      "I swore an iron vow to find my sister, taken by raiders from the Hinterlands.\n\nThe trail leads north, past the Havens, into the Tempest Hills.",
  },
};

export const States: Story = {
  render: () => (
    <Stack gap="4">
      <TextArea
        label="Vow Description"
        required
        error="Describe the vow before you swear it."
      />
      <TextArea label="Session Recap" defaultValue="Read only." readOnly />
      <TextArea label="Guide Notes" disabled defaultValue="Disabled." />
    </Stack>
  ),
};
