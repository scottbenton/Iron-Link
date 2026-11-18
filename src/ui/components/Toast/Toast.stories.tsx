import { DiceFiveIcon } from "@phosphor-icons/react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { Grid } from "styled-system/jsx";

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

/** The chip itself, as each toast renders it. */
export const Cards: Story = {
  render: () => (
    <Grid gap="3" width="400px">
      <ToastCard
        tone="success"
        message="Character saved"
        onDismiss={() => {}}
      />
      <ToastCard
        tone="error"
        message="Could not save your notes. Check your connection and try again."
        onDismiss={() => {}}
      />
      <ToastCard
        tone="info"
        message="Invite link copied"
        onDismiss={() => {}}
      />
      <ToastCard
        tone="success"
        message="Asset removed"
        action={{ label: "Undo", onClick: () => {} }}
        onDismiss={() => {}}
      />
      <ToastCard
        tone="loading"
        message="Uploading portrait"
        onDismiss={() => {}}
      />
    </Grid>
  ),
};

/**
 * Several toasts stack front to back: the newest in front, two older ones
 * peeking out behind it, the rest behind "N more". Hover the stack, or Tab
 * into it, to fan it out.
 */
export const Stacked: Story = {
  render: function Render() {
    const toasts = useToast();
    return (
      <Button
        onClick={() => {
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
        }}
      >
        Show Four Toasts
      </Button>
    );
  },
};
