import {
  BookOpenIcon,
  ClockCounterClockwiseIcon,
  DiceFiveIcon,
  FileTextIcon,
  UserIcon,
} from "@phosphor-icons/react";
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

/**
 * A game's sections on a phone: buttons that switch the page in place
 * (marked `aria-current`), with an unread count on Log.
 */
export const GameSections: Story = {
  name: "Game sections, with badge",
  args: {
    label: "Game Sections",
    items: [
      {
        id: "sheet",
        label: "Sheet",
        icon: <UserIcon />,
        currentIcon: <UserIcon weight="fill" />,
        current: true,
        onSelect: () => {},
      },
      {
        id: "notes",
        label: "Notes",
        icon: <FileTextIcon />,
        currentIcon: <FileTextIcon weight="fill" />,
        onSelect: () => {},
      },
      {
        id: "moves",
        label: "Moves",
        icon: <BookOpenIcon />,
        currentIcon: <BookOpenIcon weight="fill" />,
        onSelect: () => {},
      },
      {
        id: "oracles",
        label: "Oracles",
        icon: <DiceFiveIcon />,
        currentIcon: <DiceFiveIcon weight="fill" />,
        onSelect: () => {},
      },
      {
        id: "log",
        label: "Log",
        icon: <ClockCounterClockwiseIcon />,
        currentIcon: <ClockCounterClockwiseIcon weight="fill" />,
        badge: 3,
        onSelect: () => {},
      },
    ],
  },
  render: (args) => (
    <PhoneFrame>
      <Flex minHeight="100%" direction="column" justify="flex-end">
        <MobileNav {...args} />
      </Flex>
    </PhoneFrame>
  ),
};
