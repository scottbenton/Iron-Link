import {
  ArrowClockwise,
  ArrowCounterClockwise,
  Eye,
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

import { Stack } from "ui/primitives";

import {
  Toolbar,
  ToolbarButton,
  ToolbarGroup,
  ToolbarLink,
  ToolbarSeparator,
  ToolbarStatus,
} from "..";
import { ToggleGroup, ToggleGroupItem } from "../../ToggleGroup";

const meta: Meta<typeof Toolbar> = {
  title: "Components/Toolbar",
  component: Toolbar,
};

export default meta;
type Story = StoryObj<typeof Toolbar>;

type Mark = "bold" | "italic" | "strike";

/**
 * The rich text editor's toolbar: one Tab stop, arrows move inside. Text
 * style is a ghost, neutral ToggleGroup, so its toggles join the toolbar's
 * arrow keys and match its buttons: an overlay fill, no accent, no movement.
 */
export const RichTextEditor: Story = {
  render: function Render() {
    const [marks, setMarks] = useState<Mark[]>(["bold"]);
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
          <ToggleGroup<Mark>
            multiple
            variant="ghost"
            tone="neutral"
            aria-label="Text style"
            value={marks}
            onValueChange={setMarks}
          >
            <ToggleGroupItem<Mark>
              value="bold"
              label="Bold"
              aria-keyshortcuts="Ctrl+B"
            >
              <TextB />
            </ToggleGroupItem>
            <ToggleGroupItem<Mark>
              value="italic"
              label="Italic"
              aria-keyshortcuts="Ctrl+I"
            >
              <TextItalic />
            </ToggleGroupItem>
            <ToggleGroupItem<Mark> value="strike" label="Strikethrough">
              <TextStrikethrough />
            </ToggleGroupItem>
          </ToggleGroup>
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

/** ToolbarButton's own `pressed` toggle, for a lone toggle in a bar. */
export const PressedButton: Story = {
  render: function Render() {
    const [preview, setPreview] = useState(false);
    return (
      <Toolbar aria-label="Note view">
        <ToolbarButton label="Share" />
        <ToolbarButton
          label="Preview"
          showLabel
          icon={<Eye />}
          pressed={preview}
          onClick={() => setPreview((current) => !current)}
        />
      </Toolbar>
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
