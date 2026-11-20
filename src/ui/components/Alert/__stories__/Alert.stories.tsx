import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import { Stack } from "ui/primitives";

import { Button } from "../../Button";
import { Alert } from "../Alert";

const meta = {
  title: "Components/Alert",
  component: Alert,
  parameters: { layout: "padded" },
  args: { tone: "info" },
} satisfies Meta<typeof Alert>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A warning with a title and an action. */
export const RulesTurnedOff: Story = {
  args: {
    tone: "warning",
    title: "This game uses rules you have turned off",
    children:
      "Ironsworn: Delve is on for this game but off in your settings, so some moves and oracles are hidden.",
    action: (
      <Button size="sm" variant="outline">
        Turn On Delve
      </Button>
    ),
  },
};

/**
 * Each tone. The tone colours the icon and the title; the message stays
 * default text so it keeps full contrast on the tint, even over several
 * lines. An alert without a title is tone-coloured only by its icon and
 * border.
 */
export const Tones: Story = {
  render: () => (
    <Stack gap="3" maxWidth="560px">
      <Alert tone="info" title="Guide only">
        Players cannot see this location or its notes. Share it from the
        location's menu when the party discovers it.
      </Alert>
      <Alert tone="success">Your character was imported.</Alert>
      <Alert tone="warning">This world is shared with 3 players.</Alert>
      <Alert tone="danger" title="Could not load this game">
        Check your connection and try again.
      </Alert>
      <Alert tone="cursed" title="Cursed">
        The Cursed Die shows 10. Envision the curse taking hold.
      </Alert>
    </Stack>
  ),
};

/** With a Dismiss button. */
export const Dismissible: Story = {
  render: function Render() {
    const [open, setOpen] = useState(true);
    return open ? (
      <Alert
        tone="info"
        title="New: Sundered Isles"
        onClose={() => setOpen(false)}
        style={{ maxWidth: 560 }}
      >
        Sundered Isles is now available for new games.
      </Alert>
    ) : (
      <Button onClick={() => setOpen(true)}>Show Again</Button>
    );
  },
};
