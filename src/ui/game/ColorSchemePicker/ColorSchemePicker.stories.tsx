import type { Meta, StoryObj } from "@storybook/react-vite";
import { useId, useState } from "react";

import { Text } from "ui/components/Text";
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
    const labelId = useId();
    return (
      <Stack gap="3" maxWidth="560px">
        <Text id={labelId} variant="label" color="muted">
          Colour scheme
        </Text>
        <ColorSchemePicker
          value={scheme}
          onValueChange={setScheme}
          aria-labelledby={labelId}
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
 * swatch and second line show what it falls back to. ThemeDialog uses it for
 * "Use the game's theme".
 */
export const WithFallback: Story = {
  render: function Render() {
    const [scheme, setScheme] = useState<SchemeName | null>(null);
    const labelId = useId();
    return (
      <Stack gap="3" maxWidth="560px">
        <Text id={labelId} variant="label" color="muted">
          Theme for Kira Vale
        </Text>
        <ColorSchemePicker
          value={scheme}
          onValueChange={setScheme}
          fallback={{
            label: "Use the game's theme",
            scheme: "eidolon",
            description: `${schemes.eidolon.label}, from this game`,
          }}
          aria-labelledby={labelId}
        />
      </Stack>
    );
  },
};
