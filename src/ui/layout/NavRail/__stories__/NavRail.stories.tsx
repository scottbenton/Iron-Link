import type { Meta, StoryObj } from "@storybook/react-vite";

import { css } from "styled-system/css";

import { getNavItems } from "../../Examples/storyData";
import { DemoSettingsMenu } from "../../SettingsMenu/DemoSettingsMenu";
import { gamesListScenario } from "../../SettingsMenu/settingsMenuScenarios";
import { NavRail } from "../NavRail";

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

/**
 * The light and dark mode toggle and the settings gear pinned to the foot of
 * the rail. The gear opens the combined SettingsMenu beside the rail; on
 * Reference it has only the app's settings and Change Theme, without Dark
 * Mode, which is the toggle here.
 */
export const WithActions: Story = {
  ...Playground,
  args: {
    items: getNavItems("reference"),
    actions: (
      <DemoSettingsMenu
        rail
        scenario={gamesListScenario}
        side="inline-end"
        align="end"
        tooltipSide="right"
      />
    ),
  },
};

/** Without a home link the logo is decoration. */
export const NoCurrentPage: Story = {
  ...Playground,
  args: { items: getNavItems(), homeHref: undefined },
};
