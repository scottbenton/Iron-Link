import type { Meta, StoryObj } from "@storybook/react-vite";

import { HStack } from "ui/primitives";
import { schemeNames } from "ui/theme";

import { SchemeSwatch } from "../SchemeSwatch";

const meta = {
  title: "Game/SchemeSwatch",
  component: SchemeSwatch,
  parameters: { layout: "centered" },
  args: { scheme: "cinder", size: "md" },
} satisfies Meta<typeof SchemeSwatch>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Pick a scheme and size in the controls. */
export const Playground: Story = {};

/** Every scheme at each size. */
export const AllSchemes: Story = {
  render: () => (
    <HStack gap="4" alignItems="end">
      {(["sm", "md", "lg"] as const).map((size) => (
        <HStack key={size} gap="2" alignItems="end">
          {schemeNames.map((name) => (
            <SchemeSwatch key={name} scheme={name} size={size} />
          ))}
        </HStack>
      ))}
    </HStack>
  ),
};
