import { DotsThreeIcon } from "@phosphor-icons/react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { css, cx } from "styled-system/css";

import { IconButton } from "../../components/IconButton";
import { GamePageTabs, PhoneFrame } from "../Examples/StoryPlaceholders";
import { getNavItems } from "../Examples/storyData";
import { shellContainer } from "../shared/shell";
import { NavBar } from "./NavBar";

const meta: Meta<typeof NavBar> = {
  title: "Layout/NavBar",
  component: NavBar,
  parameters: { layout: "fullscreen" },
  args: { title: "The Iron Expanse", items: getNavItems("games") },
};

export default meta;
type Story = StoryObj<typeof NavBar>;

// NavBar switches on the shell's width, so stories frame it in one.
const wideFrame = cx(shellContainer, css({ minHeight: "120px" }));

const moreButton = (
  <IconButton label="More Actions">
    <DotsThreeIcon weight="bold" />
  </IconButton>
);

/**
 * On a phone: the menu button opens the destinations in a drawer, and the
 * title is the page's h1.
 */
export const Phone: Story = {
  parameters: { layout: "padded" },
  render: (args) => (
    <PhoneFrame>
      <div className={shellContainer}>
        <NavBar {...args} />
      </div>
    </PhoneFrame>
  ),
};

/** A page under another: a back link instead of the menu. */
export const PhoneWithBack: Story = {
  ...Phone,
  args: {
    title: "Kira Vale",
    items: undefined,
    backHref: "#iron-expanse",
    actions: moreButton,
  },
};

/** A second row under the bar, such as the game's page tabs. */
export const PhoneWithSecondaryRow: Story = {
  ...Phone,
  args: { secondaryRow: <GamePageTabs current="overview" /> },
};

/**
 * On a wide screen the rail carries the destinations, so the bar keeps only
 * the h1, for screen readers. Nothing shows here on purpose.
 */
export const WideHidden: Story = {
  render: (args) => (
    <div className={wideFrame}>
      <NavBar {...args} />
    </div>
  ),
};
