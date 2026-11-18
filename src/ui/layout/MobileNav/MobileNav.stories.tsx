import type { Meta, StoryObj } from "@storybook/react-vite";

import { Flex } from "styled-system/jsx";

import { PhoneFrame } from "../Examples/StoryPlaceholders";
import { getNavItems } from "../Examples/storyData";
import { MobileNav } from "./MobileNav";

const meta: Meta<typeof MobileNav> = {
  title: "Layout/MobileNav",
  component: MobileNav,
  args: { items: getNavItems("worlds") },
};

export default meta;
type Story = StoryObj<typeof MobileNav>;

/** The phone's bottom bar, 56px tall with full-width targets. */
export const Playground: Story = {};

export const InAPhone: Story = {
  render: (args) => (
    <PhoneFrame>
      <Flex minHeight="100%" direction="column" justify="flex-end">
        <MobileNav {...args} />
      </Flex>
    </PhoneFrame>
  ),
};
