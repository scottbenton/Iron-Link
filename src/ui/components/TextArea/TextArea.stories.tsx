import type { Meta, StoryObj } from "@storybook/react-vite";

import { Stack } from "ui/primitives";

import { TextField } from "../TextField";
import { TextArea } from "./TextArea";

const meta = {
  title: "Components/TextArea",
  component: TextArea,
  args: {
    label: "Background",
    placeholder: "Where does your character come from, and what drives them?",
    description: "Only you and the Guide can read it.",
    minRows: 3,
    maxRows: 8,
  },
  argTypes: {
    size: { control: "inline-radio", options: ["sm", "md"] },
    variant: { control: "inline-radio", options: ["outline", "quiet"] },
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
        description="What you swore, and to whom."
        error="Describe the vow before you swear it."
      />
      <TextArea label="Session Recap" defaultValue="Read only." readOnly />
      <TextArea label="Guide Notes" disabled defaultValue="Disabled." />
    </Stack>
  ),
};

/**
 * Its text starts as far in as a TextField's, so the two line up in a
 * form.
 */
export const BesideTextField: Story = {
  render: () => (
    <Stack gap="4">
      <TextField label="Vow" defaultValue="Find my sister" />
      <TextArea
        label="Vow Description"
        minRows={2}
        defaultValue="Taken by raiders from the Hinterlands."
      />
      <TextField size="sm" label="Vow (small)" defaultValue="Find my sister" />
      <TextArea
        size="sm"
        label="Vow Description (small)"
        minRows={2}
        defaultValue="Taken by raiders from the Hinterlands."
      />
    </Stack>
  ),
};

export const Quiet: Story = {
  args: {
    size: "sm",
    variant: "quiet",
    label: "Guide's note",
    description: undefined,
    placeholder: "Empty",
    minRows: 2,
    defaultValue:
      "The reeve hoards the winter stores. The Iron Wardens suspect it.",
  },
};
