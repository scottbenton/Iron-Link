import type { Meta, StoryObj } from "@storybook/react-vite";

import { Box } from "ui/primitives";

import { Text } from "../../../components/Text";
import { PageContent } from "../PageContent";

const meta: Meta<typeof PageContent> = {
  title: "Layout/PageContent",
  component: PageContent,
  parameters: { layout: "fullscreen" },
  args: { maxWidth: "xl" },
  argTypes: {
    maxWidth: { control: "inline-radio", options: ["sm", "xl"] },
  },
};

export default meta;
type Story = StoryObj<typeof PageContent>;

/**
 * The page's side margins and content rail: the content is centred at the
 * rail's width and keeps the page inset at every size.
 */
export const Playground: Story = {
  render: (args) => (
    <PageContent {...args}>
      <Text>
        Orrin swore an iron vow to recover the starchart before the next flood.
      </Text>
      <Box
        height="240px"
        borderRadius="md"
        borderWidth="1px"
        borderStyle="dashed"
        borderColor="border.default"
      />
    </PageContent>
  ),
};

/** A narrow rail, for settings and forms. */
export const Narrow: Story = { ...Playground, args: { maxWidth: "sm" } };
