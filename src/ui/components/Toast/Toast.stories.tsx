import { DiceFiveIcon } from "@phosphor-icons/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useEffect } from "react";

import { Grid } from "ui/primitives";

import { Button } from "../Button";
import { ToastCard } from "./ToastCard";
import { toast } from "./toast";
import { useToast } from "./useToast";

const meta = {
  title: "Components/Toast",
  component: ToastCard,
  parameters: { layout: "centered" },
  args: { message: "Character saved", onDismiss: () => {} },
} satisfies Meta<typeof ToastCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Every kind of toast. None closes by itself; each has Dismiss. */
export const Playground: Story = {
  render: function Render() {
    const toasts = useToast();
    return (
      <Grid gap="2" gridTemplateColumns="repeat(2, minmax(0, 1fr))">
        <Button onClick={() => toasts.success("Character saved")}>
          Success
        </Button>
        <Button
          onClick={() =>
            toasts.error(
              "Could not save your notes. Check your connection and try again.",
            )
          }
        >
          Error
        </Button>
        <Button onClick={() => toasts.info("Invite link copied")}>Info</Button>
        <Button
          onClick={() =>
            toasts.warning("Starsmith is off, so its oracles are hidden")
          }
        >
          Warning
        </Button>
        <Button
          onClick={() =>
            toasts.success("Asset removed", {
              action: {
                label: "Undo",
                onClick: () => toasts.info("Asset restored"),
              },
            })
          }
        >
          Undo
        </Button>
        <Button
          onClick={() =>
            toast.promise(new Promise((resolve) => setTimeout(resolve, 2500)), {
              loading: "Uploading portrait",
              success: "Portrait uploaded",
              error: "Could not upload your portrait",
            })
          }
        >
          Loading
        </Button>
        <Button
          onClick={() =>
            toasts.custom(
              ({ dismiss }) => (
                <ToastCard
                  elevated
                  icon={<DiceFiveIcon weight="fill" />}
                  message="Face Danger: Strong Hit"
                  description="Action 5 + Edge 2 = 7 vs 3 and 6"
                  onDismiss={dismiss}
                />
              ),
              { announcement: "Face Danger, strong hit. 7 against 3 and 6." },
            )
          }
        >
          Roll Result
        </Button>
        <Button variant="ghost" onClick={() => toasts.dismissAll()}>
          Dismiss All
        </Button>
      </Grid>
    );
  },
};

/** The card itself, as each toast renders it. */
export const Cards: Story = {
  render: () => (
    <Grid gap="3" width="400px">
      <ToastCard
        elevated
        tone="success"
        message="Character saved"
        onDismiss={() => {}}
      />
      <ToastCard
        elevated
        tone="error"
        message="Could not save your notes. Check your connection and try again."
        onDismiss={() => {}}
      />
      <ToastCard
        elevated
        tone="info"
        message="Invite link copied"
        onDismiss={() => {}}
      />
      <ToastCard
        elevated
        tone="success"
        message="Asset removed"
        action={{ label: "Undo", onClick: () => {} }}
        onDismiss={() => {}}
      />
      <ToastCard
        elevated
        tone="loading"
        message="Uploading portrait"
        onDismiss={() => {}}
      />
    </Grid>
  ),
};

function showFourToasts(toasts: ReturnType<typeof useToast>) {
  toasts.info("Invite link copied");
  toasts.error(
    "Could not save your notes. Check your connection and try again.",
  );
  toasts.success("Asset removed", {
    action: {
      label: "Undo",
      onClick: () => toasts.info("Asset restored"),
    },
  });
  toasts.warning("Starsmith is off, so its oracles are hidden");
}

/**
 * Sonner's own stacking, in our cards: the newest toast in front, the two
 * before it peeking out above it, each a little smaller, with "1 more" and
 * Clear All under the stack. Hover the stack, or Tab into it, to fan the
 * toasts out with a gap between them. Nothing closes by itself (the error
 * stays until dismissed). The toasts open with the story; the button shows
 * them again.
 */
export const Stacked: Story = {
  render: function Render() {
    const toasts = useToast();
    useEffect(() => {
      showFourToasts(toasts);
      return () => toasts.dismissAll();
    }, [toasts]);
    return (
      <Button onClick={() => showFourToasts(toasts)}>Show Four Toasts</Button>
    );
  },
};
