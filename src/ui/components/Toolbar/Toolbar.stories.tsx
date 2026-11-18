import {
  ArrowClockwise,
  ArrowCounterClockwise,
  ImageSquare,
  LinkSimple,
  ListBullets,
  ListNumbers,
  Quotes,
  TextB,
  TextItalic,
  TextStrikethrough,
} from "@phosphor-icons/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import { Stack } from "styled-system/jsx";

import {
  Toolbar,
  ToolbarButton,
  ToolbarGroup,
  ToolbarLink,
  ToolbarSeparator,
  ToolbarStatus,
} from "./Toolbar";

const meta: Meta<typeof Toolbar> = {
  title: "Components/Toolbar",
  component: Toolbar,
};

export default meta;
type Story = StoryObj<typeof Toolbar>;

/** The rich text editor's toolbar: one Tab stop, arrows move inside. */
export const RichTextEditor: Story = {
  render: function Render() {
    const [marks, setMarks] = useState<Record<string, boolean>>({
      bold: true,
    });
    const toggle = (mark: string) =>
      setMarks((current) => ({ ...current, [mark]: !current[mark] }));
    return (
      <Stack maxWidth="720px">
        <Toolbar aria-label="Formatting">
          <ToolbarGroup aria-label="History">
            <ToolbarButton
              label="Undo"
              shortcut="Ctrl+Z"
              icon={<ArrowCounterClockwise />}
            />
            <ToolbarButton
              label="Redo"
              shortcut="Ctrl+Shift+Z"
              icon={<ArrowClockwise />}
              disabled
            />
          </ToolbarGroup>
          <ToolbarSeparator />
          <ToolbarGroup aria-label="Text style">
            <ToolbarButton
              label="Bold"
              shortcut="Ctrl+B"
              icon={<TextB />}
              pressed={!!marks.bold}
              onClick={() => toggle("bold")}
            />
            <ToolbarButton
              label="Italic"
              shortcut="Ctrl+I"
              icon={<TextItalic />}
              pressed={!!marks.italic}
              onClick={() => toggle("italic")}
            />
            <ToolbarButton
              label="Strikethrough"
              icon={<TextStrikethrough />}
              pressed={!!marks.strike}
              onClick={() => toggle("strike")}
            />
          </ToolbarGroup>
          <ToolbarSeparator />
          <ToolbarGroup aria-label="Blocks">
            <ToolbarButton label="Bulleted List" icon={<ListBullets />} />
            <ToolbarButton label="Numbered List" icon={<ListNumbers />} />
            <ToolbarButton label="Quote" icon={<Quotes />} />
          </ToolbarGroup>
          <ToolbarSeparator />
          <ToolbarGroup aria-label="Insert">
            <ToolbarButton
              label="Link"
              shortcut="Ctrl+K"
              icon={<LinkSimple />}
            />
            <ToolbarButton label="Image" icon={<ImageSquare />} showLabel />
          </ToolbarGroup>
          <ToolbarStatus>Saved</ToolbarStatus>
        </Toolbar>
      </Stack>
    );
  },
};

export const Plain: Story = {
  render: () => (
    <Toolbar aria-label="Note actions" variant="plain">
      <ToolbarButton label="Share" />
      <ToolbarButton label="Move" />
      <ToolbarSeparator />
      <ToolbarLink href="#help">Help</ToolbarLink>
    </Toolbar>
  ),
};
