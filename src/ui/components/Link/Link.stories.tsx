import type { Meta, StoryObj } from "@storybook/react-vite";

import { Stack } from "ui/primitives";

import { Text } from "../Text";
import { Link } from "./Link";

const meta: Meta<typeof Link> = {
  title: "Components/Link",
  component: Link,
  args: { children: "View the Starforged rules", href: "#rules" },
  argTypes: {
    color: {
      control: "inline-radio",
      options: ["accent", "default", "muted", "inherit"],
    },
    underline: { control: "inline-radio", options: ["always", "hover"] },
  },
};

export default meta;
type Story = StoryObj<typeof Link>;

export const Playground: Story = {};

export const InText: Story = {
  render: () => (
    <Stack gap="3" maxWidth="480px">
      <Text variant="bodySm">
        When you attempt something risky, <Link href="#face">Face Danger</Link>.
        On a miss, <Link href="#pay">Pay the Price</Link>.
      </Text>
      <Text variant="bodySm" color="muted">
        Iron Link is a fan project.{" "}
        <Link color="inherit" href="https://ironswornrpg.com" external>
          Ironsworn by Shawn Tomkin
        </Link>
      </Text>
      <Text variant="bodySm">
        <Link color="muted" underline="hover" href="#privacy">
          Privacy Policy
        </Link>
      </Text>
    </Stack>
  ),
};

/** A router link renders through `render`, keeping the link styles. */
export const RouterLink: Story = {
  render: () => (
    <Link render={<a href="#/games" data-router="" />}>Back to Games</Link>
  ),
};
