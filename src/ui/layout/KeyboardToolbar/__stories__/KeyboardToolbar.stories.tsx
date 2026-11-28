import type { Meta, StoryObj } from "@storybook/react-vite";

import { ToolbarButton, ToolbarSeparator } from "../../../components/Toolbar";
import {
  ImageSquareIcon,
  ListBulletsIcon,
  ListNumbersIcon,
  LockIcon,
  QuotesIcon,
  TextBIcon,
  TextItalicIcon,
  TextStrikethroughIcon,
} from "../../../icons";
import { KeyboardToolbar } from "../KeyboardToolbar";

const meta: Meta<typeof KeyboardToolbar> = {
  title: "Layout/KeyboardToolbar",
  component: KeyboardToolbar,
  args: { "aria-label": "Formatting" },
  parameters: { viewport: { defaultViewport: "mobile1" } },
};

export default meta;
type Story = StoryObj<typeof KeyboardToolbar>;

/**
 * Fixed to the bottom of the window. On a phone the app raises it onto the
 * keyboard; here it stays at the bottom edge. Narrow the canvas to see the
 * row scroll with a fade.
 */
export const Playground: Story = {
  render: (args) => (
    <KeyboardToolbar {...args}>
      <ToolbarButton label="Bold" icon={<TextBIcon />} pressed />
      <ToolbarButton label="Italic" icon={<TextItalicIcon />} />
      <ToolbarButton label="Strikethrough" icon={<TextStrikethroughIcon />} />
      <ToolbarSeparator />
      <ToolbarButton label="Bulleted List" icon={<ListBulletsIcon />} />
      <ToolbarButton label="Numbered List" icon={<ListNumbersIcon />} />
      <ToolbarButton label="Quote" icon={<QuotesIcon />} />
      <ToolbarSeparator />
      <ToolbarButton label="Upload Image" icon={<ImageSquareIcon />} />
      <ToolbarButton label="Insert secret" icon={<LockIcon />} />
    </KeyboardToolbar>
  ),
};
