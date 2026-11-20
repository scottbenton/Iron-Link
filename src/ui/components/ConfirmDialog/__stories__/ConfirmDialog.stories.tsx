import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import { HStack, Stack } from "ui/primitives";

import { Button } from "../../Button";
import { Text } from "../../Text";
import { ConfirmDialog } from "../ConfirmDialog";
import { useConfirm } from "../useConfirm";

const meta = {
  title: "Components/ConfirmDialog",
  component: ConfirmDialog,
  parameters: { layout: "centered" },
  args: { open: false, onConfirm: () => {}, onCancel: () => {} },
} satisfies Meta<typeof ConfirmDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

/** `useConfirm()` returns a promise of `{ confirmed }`. */
export const RemoveAsset: Story = {
  render: function Render() {
    const confirm = useConfirm();
    const [result, setResult] = useState("");
    return (
      <Stack gap="3" alignItems="center">
        <Button
          variant="danger"
          onClick={async () => {
            const { confirmed } = await confirm({
              title: "Remove Asset",
              description:
                "Remove Ironclad from Kara Ironhand? Its marked abilities are lost.",
              confirmationText: "Remove Asset",
              cancellationText: "Keep Asset",
              tone: "danger",
            });
            setResult(confirmed ? "Removed" : "Kept");
          }}
        >
          Remove Asset
        </Button>
        <Text variant="caption" color="muted">
          {result}
        </Text>
      </Stack>
    );
  },
};

export const LeaveGame: Story = {
  render: function Render() {
    const confirm = useConfirm();
    return (
      <Button
        onClick={() =>
          confirm({
            title: "Leave Game",
            description:
              "Leave The Iron Wardens? Your characters in it are deleted. The Guide can invite you again.",
            confirmationText: "Leave Game",
            tone: "danger",
          })
        }
      >
        Leave Game
      </Button>
    );
  },
};

/** A non-destructive confirm has a primary button and focuses it. */
export const ChangeWorld: Story = {
  render: function Render() {
    const confirm = useConfirm();
    return (
      <Button
        onClick={() =>
          confirm({
            title: "Change World",
            description:
              "Link The Iron Wardens to Ashen Reach instead of Hollowmere?",
            confirmationText: "Change World",
          })
        }
      >
        Change World
      </Button>
    );
  },
};

/** The component, controlled, for questions that need live state. */
export const Controlled: Story = {
  render: function Render() {
    const [open, setOpen] = useState(false);
    return (
      <HStack>
        <Button onClick={() => setOpen(true)}>Delete Vow</Button>
        <ConfirmDialog
          open={open}
          title="Delete Vow"
          description="Delete Recover the Hollow Crown? Its progress is lost."
          confirmationText="Delete Vow"
          cancellationText="Keep Vow"
          tone="danger"
          onConfirm={() => setOpen(false)}
          onCancel={() => setOpen(false)}
        />
      </HStack>
    );
  },
};
