import { At, User } from "@phosphor-icons/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import { Grid, Stack } from "ui/primitives";

import { TextField } from "../TextField";

const meta = {
  title: "Components/TextField",
  component: TextField,
  args: {
    label: "Character Name",
    placeholder: "Kayu Stonehand",
    description: "Shown on your character sheet and in the game log.",
  },
  argTypes: {
    size: { control: "inline-radio", options: ["sm", "md"] },
    variant: { control: "inline-radio", options: ["outline", "quiet"] },
  },
  decorators: [
    (Story) => (
      <Stack maxWidth="380px">
        <Story />
      </Stack>
    ),
  ],
} satisfies Meta<typeof TextField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const NameAndPronouns: Story = {
  render: () => (
    <Grid columns={{ base: 1, sm: 2 }} gap="4">
      <TextField label="Character Name" required defaultValue="Kayu" />
      <TextField
        label="Pronouns"
        placeholder="they/them"
        description="Optional."
      />
    </Grid>
  ),
};

export const Adornments: Story = {
  render: function Render() {
    const [name, setName] = useState("Ash Riverborn");
    return (
      <Stack gap="4">
        <TextField
          label="Character Name"
          value={name}
          onValueChange={setName}
          startAdornment={<User />}
          clearable
        />
        <TextField
          label="Invite by Email"
          type="email"
          startAdornment={<At />}
          placeholder="friend@example.com"
        />
        <TextField label="Supply" defaultValue="5" endAdornment="of 5" />
      </Stack>
    );
  },
};

/** Help text sits under the label; the error sits under the field. */
export const HelpAndError: Story = {
  render: () => (
    <TextField
      label="Character Name"
      description="Shown on your character sheet and in the game log."
      defaultValue="Kayu"
      error="A character in this game already has that name."
    />
  ),
};

/** `sm` is the compact size, with a smaller, muted label. */
export const Sizes: Story = {
  render: () => (
    <Stack gap="4">
      <TextField
        size="sm"
        label="Small"
        description="For dense panels."
        defaultValue="Iron Vow"
      />
      <TextField
        size="md"
        label="Medium"
        description="Everywhere else."
        defaultValue="Iron Vow"
      />
    </Stack>
  ),
};

/**
 * `variant="quiet"` shows no border until hovered or focused, so a value
 * reads as text. Its text lines up with the label. See Field, World entry
 * fields.
 */
export const Quiet: Story = {
  render: () => (
    <Stack gap="3">
      <TextField
        size="sm"
        variant="quiet"
        label="Trouble"
        defaultValue="Raiders prey on the weak"
      />
      <TextField
        size="sm"
        variant="quiet"
        label="First look"
        placeholder="Empty"
      />
      <TextField
        size="sm"
        variant="quiet"
        label="Leader"
        defaultValue=""
        placeholder="Empty"
        error="Name the settlement's leader."
      />
    </Stack>
  ),
};

export const States: Story = {
  render: () => (
    <Stack gap="4">
      <TextField
        label="Game Name"
        required
        defaultValue=""
        description="Players see it when they join."
        error="Give your game a name before you create it."
      />
      <TextField
        label="Character Name"
        defaultValue="Thorn the Unbroken, Last Warden of the Shattered Hold"
        error="Character names can be at most 40 characters."
      />
      <TextField label="Game ID" defaultValue="g8Kq2rTz" readOnly />
      <TextField label="Ruleset" defaultValue="Ironsworn" disabled />
    </Stack>
  ),
};
