import type { Meta, StoryObj } from "@storybook/react-vite";

import { css } from "styled-system/css";

import { CornerHandle } from "../CornerHandle";

const meta = {
  title: "Components/CornerHandle",
  component: CornerHandle,
  parameters: { layout: "centered" },
  args: { vertical: "bottom", horizontal: "right" },
} satisfies Meta<typeof CornerHandle>;

export default meta;
type Story = StoryObj<typeof meta>;

const frame = css({
  position: "relative",
  width: "240px",
  height: "160px",
  borderWidth: "2px",
  borderStyle: "solid",
  borderColor: "accent.solid",
  borderRadius: "sm",
  background: "bg.muted",
});

const corners = [
  { vertical: "top", horizontal: "left" },
  { vertical: "top", horizontal: "right" },
  { vertical: "bottom", horizontal: "left" },
  { vertical: "bottom", horizontal: "right" },
] as const;

/** A selected image's frame: all four corners, shown. */
export const Shown: Story = {
  render: () => (
    <div className={frame}>
      {corners.map((corner) => (
        <CornerHandle
          key={`${corner.vertical}-${corner.horizontal}`}
          {...corner}
          shown
          aria-hidden
          tabIndex={-1}
        />
      ))}
    </div>
  ),
};

/** Hidden until the pointer is over the frame. */
export const OnHover: Story = {
  render: () => (
    <div className={frame} data-corner-handles="">
      {corners.map((corner) => (
        <CornerHandle
          key={`${corner.vertical}-${corner.horizontal}`}
          {...corner}
          aria-hidden
          tabIndex={-1}
        />
      ))}
    </div>
  ),
};
