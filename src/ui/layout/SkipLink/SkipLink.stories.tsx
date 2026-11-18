import type { Meta, StoryObj } from "@storybook/react-vite";

import { Box, Stack } from "ui/primitives";

import { Text } from "../../components/Text";
import { SkipLink } from "./SkipLink";

const meta: Meta<typeof SkipLink> = {
  title: "Layout/SkipLink",
  component: SkipLink,
  args: { targetId: "skip-link-story-main" },
};

export default meta;
type Story = StoryObj<typeof SkipLink>;

/**
 * Hidden until focused: press Tab in the canvas to show it, then Enter to
 * move focus to the content. AppShell renders one for its main region.
 */
export const Playground: Story = {
  render: (args) => (
    <Box position="relative" paddingBlockStart="16">
      <SkipLink {...args} />
      <Stack
        id="skip-link-story-main"
        tabIndex={-1}
        gap="2"
        padding="4"
        borderWidth="1px"
        borderStyle="dashed"
        borderColor="border.default"
        borderRadius="md"
      >
        <Text variant="h3" as="p">
          The Iron Expanse
        </Text>
        <Text color="muted">The skip link moves focus here.</Text>
      </Stack>
    </Box>
  ),
};
