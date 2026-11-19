import type { Meta, StoryObj } from "@storybook/react-vite";

import { HStack } from "ui/primitives";
import { schemeNames, schemes } from "ui/theme";

import { IronLinkMark } from "./IronLinkMark";

const meta = {
  title: "Components/IronLinkMark",
  component: IronLinkMark,
  args: { colors: schemes.default.icon, width: "64px", height: "64px" },
} satisfies Meta<typeof IronLinkMark>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** The logo in each scheme's icon gradient. */
export const Schemes: Story = {
  render: () => (
    <HStack gap="3" flexWrap="wrap">
      {schemeNames.map((name) => (
        <IronLinkMark
          key={name}
          colors={schemes[name].icon}
          label={schemes[name].label}
          width="48px"
          height="48px"
        />
      ))}
    </HStack>
  ),
};
