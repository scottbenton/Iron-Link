import type { Meta, StoryObj } from "@storybook/react-vite";

import { Stack } from "ui/primitives";

import { RelativeTime } from "../RelativeTime";

const minutesAgo = (minutes: number) => new Date(Date.now() - minutes * 60_000);
const clock = (date: Date) =>
  date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });

const meta: Meta<typeof RelativeTime> = {
  title: "Components/RelativeTime",
  component: RelativeTime,
  args: {
    date: minutesAgo(0),
    absolute: clock(minutesAgo(0)),
  },
};

export default meta;
type Story = StoryObj<typeof RelativeTime>;

/**
 * Starts at "Just now" and moves to "1 minute ago" on its own: leave the
 * story open for a minute or two. Hover for the clock time.
 */
export const Playground: Story = {};

/** Every label reads one shared clock, so they all move on the same tick. */
export const Ages: Story = {
  render: () => (
    <Stack gap="2">
      {[0, 3, 45, 150, 60 * 30].map((minutes) => {
        const date = minutesAgo(minutes);
        return (
          <RelativeTime key={minutes} date={date} absolute={clock(date)} />
        );
      })}
    </Stack>
  ),
};

/** A time in the future shows the absolute time. */
export const Future: Story = {
  args: {
    date: minutesAgo(-30),
    absolute: clock(minutesAgo(-30)),
  },
};
