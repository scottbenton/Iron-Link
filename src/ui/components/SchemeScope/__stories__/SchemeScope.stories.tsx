import type { Meta, StoryObj } from "@storybook/react-vite";

import { HStack } from "ui/primitives";

import { Button } from "../../Button";
import { SchemeScope } from "../SchemeScope";

const meta = {
  title: "Components/SchemeScope",
  component: SchemeScope,
  parameters: { layout: "centered" },
  args: {
    scheme: "cinder",
    children: <Button variant="primary">Face Danger</Button>,
  },
} satisfies Meta<typeof SchemeScope>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Pick a scheme in the controls; the toolbar sets the page's. */
export const Playground: Story = {};

/** Each button wears its own scheme, Default included, whatever the page's. */
export const SideBySide: Story = {
  render: () => (
    <HStack gap="3">
      <SchemeScope scheme="default">
        <Button variant="primary">Sunrise</Button>
      </SchemeScope>
      <SchemeScope scheme="eidolon">
        <Button variant="primary">Eidolon</Button>
      </SchemeScope>
      <SchemeScope scheme="hinterlands">
        <Button variant="primary">Hinterlands</Button>
      </SchemeScope>
    </HStack>
  ),
};
