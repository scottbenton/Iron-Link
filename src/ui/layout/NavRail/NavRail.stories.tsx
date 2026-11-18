import { GearSixIcon } from "@phosphor-icons/react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { css } from "styled-system/css";

import { IconButton } from "../../components/IconButton";
import { getNavItems } from "../Examples/storyData";
import { NavRail } from "./NavRail";

const meta: Meta<typeof NavRail> = {
  title: "Layout/NavRail",
  component: NavRail,
  parameters: { layout: "fullscreen" },
  args: { items: getNavItems("games"), homeHref: "#games" },
};

export default meta;
type Story = StoryObj<typeof NavRail>;

const frame = css({ height: "560px", "--app-shell-height": "100%" });

export const Playground: Story = {
  render: (args) => (
    <div className={frame}>
      <NavRail {...args} />
    </div>
  ),
};

/** Settings pinned to the foot of the rail. */
export const WithActions: Story = {
  ...Playground,
  args: {
    items: getNavItems("reference"),
    actions: (
      <IconButton label="Settings" tooltipSide="right">
        <GearSixIcon />
      </IconButton>
    ),
  },
};

/** Without a home link the logo is decoration. */
export const NoCurrentPage: Story = {
  ...Playground,
  args: { items: getNavItems(), homeHref: undefined },
};
