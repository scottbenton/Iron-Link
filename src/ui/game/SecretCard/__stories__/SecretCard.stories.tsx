import { Trash } from "@phosphor-icons/react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { Box, Stack } from "ui/primitives";

import { IconButton } from "../../../components/IconButton";
import { SecretCard } from "../SecretCard";

const meta = {
  title: "Game/SecretCard",
  component: SecretCard,
  args: {
    label: "Secret",
    children:
      "The ferryman is the Warden's brother, and he keeps the ledger of every soul he carried across.",
  },
  decorators: [
    (Story) => (
      <Box maxWidth="28rem">
        <Story />
      </Box>
    ),
  ],
} satisfies Meta<typeof SecretCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** A rich text secret: delete in the header, the sharing note under it. */
export const WithActionAndNote: Story = {
  args: {
    action: (
      <IconButton label="Delete secret" size="sm" variant="ghost">
        <Trash />
      </IconButton>
    ),
    note: "Shared only with you so far. Players won't see this secret once it's shared.",
  },
};

/** A world entry's Guide only fields, folded away until needed. */
export const Collapsible: Story = {
  args: {
    label: "Guide only",
    collapsible: true,
    headingAs: "h3",
    children: (
      <Stack gap="2">
        <span>Motive: revenge for the burning of Thornhold.</span>
        <span>Weakness: cannot cross running water.</span>
      </Stack>
    ),
  },
};

/** As the game log uses it: no landmark, no icon. */
export const InLog: Story = {
  args: { label: "Guide only", landmark: false, icon: null },
};
