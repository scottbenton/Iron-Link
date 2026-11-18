import type { Meta, StoryObj } from "@storybook/react-vite";
import { useId, useState } from "react";

import { Text } from "ui/components/Text";
import { SchemeName } from "ui/theme";

import { Stack } from "styled-system/jsx";

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
