import { At, User } from "@phosphor-icons/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import { Grid, Stack } from "styled-system/jsx";

import { TextField } from "./TextField";

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

export const Sizes: Story = {
  render: () => (
    <Stack gap="4">
      <TextField size="sm" label="Small" defaultValue="Iron Vow" />
      <TextField size="md" label="Medium" defaultValue="Iron Vow" />
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
