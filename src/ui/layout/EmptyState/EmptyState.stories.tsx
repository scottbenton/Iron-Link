import { GlobeHemisphereWestIcon, NotePencilIcon } from "@phosphor-icons/react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { Button } from "../../components/Button";
import { EmptyState } from "./EmptyState";

const meta: Meta<typeof EmptyState> = {
  title: "Layout/EmptyState",
  component: EmptyState,
  args: {
    icon: <GlobeHemisphereWestIcon />,
    title: "No Worlds Yet",
    message:
      "A world holds the places, people and truths your games share. Create one to start building.",
    action: <Button variant="primary">Create World</Button>,
    size: "md",
  },
  argTypes: { size: { control: "inline-radio", options: ["sm", "md"] } },
};

export default meta;
type Story = StoryObj<typeof EmptyState>;

export const Playground: Story = {};

/** Two ways forward: the main action and a quieter one beside it. */
export const WithSecondaryAction: Story = {
  args: {
    secondaryAction: <Button variant="ghost">Import a World</Button>,
  },
};

/** Small, for a sidebar or a column. */
export const Small: Story = {
  args: {
    size: "sm",
    icon: <NotePencilIcon />,
    title: "No Notes",
    message: "Notes you add to this game show here.",
    action: <Button size="sm">Add Note</Button>,
  },
};
