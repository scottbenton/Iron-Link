import {
  CopyIcon,
  PencilSimpleIcon,
  PushPinIcon,
  TrashIcon,
} from "@phosphor-icons/react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { css } from "styled-system/css";

import { MenuItem, MenuSeparator } from "../../Menu";
import { Text } from "../../Text";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuTrigger,
} from "../ContextMenu";

const meta = {
  title: "Components/ContextMenu",
  component: ContextMenu,
  parameters: { layout: "centered" },
} satisfies Meta<typeof ContextMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Right-click (or long press) the note. It uses Menu's items. */
export const NoteActions: Story = {
  render: () => (
    <ContextMenu>
      <ContextMenuTrigger
        className={css({
          display: "grid",
          placeItems: "center",
          width: "320px",
          height: "160px",
          borderRadius: "lg",
          border: "1px dashed token(colors.border.control)",
          background: "bg.muted",
        })}
      >
        <Text variant="bodySm" color="muted">
          Session 12: The Broken Keep
        </Text>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <MenuItem icon={<PencilSimpleIcon />}>Rename Note</MenuItem>
        <MenuItem icon={<CopyIcon />}>Duplicate</MenuItem>
        <MenuItem icon={<PushPinIcon />}>Pin to Top</MenuItem>
        <MenuSeparator />
        <MenuItem icon={<TrashIcon />} tone="danger">
          Delete Note
        </MenuItem>
      </ContextMenuContent>
    </ContextMenu>
  ),
};
