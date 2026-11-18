import type { Meta, StoryObj } from "@storybook/react-vite";

import { Stack } from "styled-system/jsx";

import { TextField } from "../TextField";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  FieldRoot,
} from "./Field";

const meta = {
  title: "Components/Field",
  component: Field,
  args: {
    label: "Character Name",
    description: "Shown on your character sheet and in the game log.",
    children: null,
  },
} satisfies Meta<typeof Field>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Field labels any control: here a TextField that would label itself. */
export const Playground: Story = {
  args: { required: true },
  render: (args) => (
    <Stack maxWidth="360px">
      <Field {...args}>
        <TextField placeholder="Kayu Stonehand" />
      </Field>
    </Stack>
  ),
};

export const Parts: Story = {
  render: () => (
    <Stack maxWidth="360px">
      <FieldRoot invalid>
        <FieldLabel required>Pronouns</FieldLabel>
        <TextField />
        <FieldDescription>For example: she/her, they/them.</FieldDescription>
        <FieldError>Enter pronouns, or leave the field blank.</FieldError>
      </FieldRoot>
    </Stack>
  ),
};

export const Invalid: Story = {
  args: {
    label: "Game Name",
    error: "Give your game a name before you create it.",
    required: true,
  },
  render: (args) => (
    <Stack maxWidth="360px">
      <Field {...args}>
        <TextField />
      </Field>
    </Stack>
  ),
};
