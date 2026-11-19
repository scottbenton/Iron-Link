import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import { Stack } from "ui/primitives";
import { SchemeName, schemes } from "ui/theme";

import { ColorSchemePicker } from "./ColorSchemePicker";

const meta: Meta<typeof ColorSchemePicker> = {
  title: "Game/ColorSchemePicker",
  component: ColorSchemePicker,
};

export default meta;
type Story = StoryObj<typeof ColorSchemePicker>;

/** The nine schemes; arrow keys move between them. */
export const Playground: Story = {
  render: function Render() {
    const [scheme, setScheme] = useState<SchemeName>("default");
    return (
      <Stack maxWidth="560px">
        <ColorSchemePicker
          label="Colour scheme"
          value={scheme}
          onValueChange={setScheme}
        />
      </Stack>
    );
  },
};

export const Disabled: Story = {
  args: { value: "cinder", onValueChange: () => {}, disabled: true },
  render: (args) => (
    <Stack maxWidth="560px">
      <ColorSchemePicker {...args} />
    </Stack>
  ),
};

/**
 * With `fallback`, a first option sets no scheme of its own (value null). Its
 * logo and second line show what it falls back to. ThemeDialog uses it for
 * "Use the game's theme".
 */
export const WithFallback: Story = {
  render: function Render() {
    const [scheme, setScheme] = useState<SchemeName | null>(null);
    return (
      <Stack maxWidth="560px">
        <ColorSchemePicker
          label="Theme for Kira Vale"
          value={scheme}
          onValueChange={setScheme}
          fallback={{
            label: "Use the game's theme",
            scheme: "eidolon",
            description: `${schemes.eidolon.label}, from this game`,
          }}
        />
      </Stack>
    );
  },
};
