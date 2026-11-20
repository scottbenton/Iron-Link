import type { Meta, StoryObj } from "@storybook/react-vite";

import { Stack } from "ui/primitives";

import { Progress } from "../Progress";

const meta = {
  title: "Components/Progress",
  component: Progress,
  parameters: { layout: "padded" },
} satisfies Meta<typeof Progress>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The page-loading bar: indeterminate and named "Loading". */
export const PageLoading: Story = {};

export const Determinate: Story = {
  args: {
    value: 40,
    label: "Uploading portrait",
    showLabel: true,
    showValue: true,
    size: "md",
  },
};

export const Tones: Story = {
  render: () => (
    <Stack gap="4" maxWidth="480px">
      <Progress value={70} label="Accent" showLabel />
      <Progress value={100} tone="success" label="Imported" showLabel />
      <Progress value={55} tone="warning" label="Storage" showLabel />
      <Progress value={90} tone="danger" label="Upload limit" showLabel />
    </Stack>
  ),
};
