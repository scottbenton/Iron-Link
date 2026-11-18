import type { Meta, StoryObj } from "@storybook/react-vite";

import { Box } from "styled-system/jsx";

import { Text } from "../../components/Text";
import { PhoneFrame } from "../Examples/StoryPlaceholders";
import { getNavItems } from "../Examples/storyData";
import { MobileNav } from "../MobileNav";
import { NavBar } from "../NavBar";
import { NavRail } from "../NavRail";
import { PageContent } from "../PageContent";
import { AppShell } from "./AppShell";

const meta: Meta<typeof AppShell> = {
  title: "Layout/AppShell",
  component: AppShell,
  parameters: { layout: "fullscreen" },
};

export default meta;
type Story = StoryObj<typeof AppShell>;

function Shell(props: { fill?: boolean }) {
  return (
    <AppShell
      fill={props.fill}
      rail={<NavRail items={getNavItems("worlds")} homeHref="#games" />}
      topBar={<NavBar title="Worlds" />}
      bottomNav={<MobileNav items={getNavItems("worlds")} />}
    >
      <PageContent paddingBlock="md">
        <Text>
          The page goes here. Press Tab from the top of the canvas for the skip
          link.
        </Text>
        <Box
          height="900px"
          borderRadius="md"
          borderWidth="1px"
          borderStyle="dashed"
          borderColor="border.default"
        />
      </PageContent>
    </AppShell>
  );
}

/**
 * The rail beside the page on wide screens; the bar over it and the bottom
 * navigation under it on phones. Resize the window past 900px to switch.
 */
export const Playground: Story = { render: () => <Shell /> };

/** The same shell in a phone-sized box. */
export const Phone: Story = {
  parameters: { layout: "padded" },
  render: () => (
    <PhoneFrame>
      <Shell />
    </PhoneFrame>
  ),
};

/** `fill`: the shell is exactly the screen, and the page scrolls inside. */
export const Fill: Story = { render: () => <Shell fill /> };
