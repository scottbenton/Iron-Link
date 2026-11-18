import {
  Eraser,
  HandGrabbing,
  ListBullets,
  MapPin,
  PaintBrush,
  SquaresFour,
  TextB,
  TextItalic,
  TextStrikethrough,
} from "@phosphor-icons/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import { HStack, Stack } from "ui/primitives";

import { SegmentedControl } from "./SegmentedControl";
import {
  ToggleGroup,
  ToggleGroupItem,
  ToggleGroupSingleProps,
} from "./ToggleGroup";

type Tool = "pan" | "paint" | "erase" | "pin";

const meta = {
  title: "Components/ToggleGroup",
  args: {
    "aria-label": "Tool",
    children: null,
    tone: "accent",
    variant: "outline",
    size: "md",
  },
  argTypes: {
    tone: { control: "inline-radio", options: ["accent", "neutral"] },
    variant: { control: "inline-radio", options: ["outline", "ghost"] },
    size: { control: "inline-radio", options: ["sm", "md"] },
  },
} satisfies Meta<ToggleGroupSingleProps<Tool>>;

export default meta;
type Story = StoryObj<typeof meta>;

function MapTools() {
  return (
    <>
      <ToggleGroupItem<Tool> value="pan" label="Pan">
        <HandGrabbing />
      </ToggleGroupItem>
      <ToggleGroupItem<Tool> value="paint" label="Paint">
        <PaintBrush />
      </ToggleGroupItem>
      <ToggleGroupItem<Tool> value="erase" label="Erase">
        <Eraser />
      </ToggleGroupItem>
      <ToggleGroupItem<Tool> value="pin" label="Add pin">
        <MapPin />
      </ToggleGroupItem>
    </>
  );
}

/** A map tool picker: one tool is always chosen. */
export const MapToolPicker: Story = {
  render: function Render(args) {
    const [tool, setTool] = useState<Tool | null>("pan");
    return (
      <ToggleGroup<Tool> {...args} value={tool} onValueChange={setTool}>
        <MapTools />
      </ToggleGroup>
    );
  },
};

export const TextLabels: Story = {
  render: () => (
    <Stack gap="3" alignItems="flex-start">
      <ToggleGroup aria-label="Grid" defaultValue="hex_pointy">
        <ToggleGroupItem value="hex_pointy">Pointy hexes</ToggleGroupItem>
        <ToggleGroupItem value="hex_flat">Flat hexes</ToggleGroupItem>
        <ToggleGroupItem value="square">Squares</ToggleGroupItem>
        <ToggleGroupItem value="none">None</ToggleGroupItem>
      </ToggleGroup>
      <ToggleGroup aria-label="Grid" size="sm" defaultValue="square" fullWidth>
        <ToggleGroupItem value="hex_pointy">Pointy</ToggleGroupItem>
        <ToggleGroupItem value="hex_flat">Flat</ToggleGroupItem>
        <ToggleGroupItem value="square">Square</ToggleGroupItem>
      </ToggleGroup>
    </Stack>
  ),
};

function FormattingItems() {
  return (
    <>
      <ToggleGroupItem value="bold" label="Bold">
        <TextB />
      </ToggleGroupItem>
      <ToggleGroupItem value="italic" label="Italic">
        <TextItalic />
      </ToggleGroupItem>
      <ToggleGroupItem value="strike" label="Strikethrough" disabled>
        <TextStrikethrough />
      </ToggleGroupItem>
    </>
  );
}

/** Any number pressed. Text formatting is quieter neutral and ghost. */
export const Multiple: Story = {
  render: () => (
    <HStack gap="4">
      <ToggleGroup
        multiple
        aria-label="Text formatting, accent"
        defaultValue={["bold"]}
      >
        <FormattingItems />
      </ToggleGroup>
      <ToggleGroup
        multiple
        tone="neutral"
        variant="ghost"
        aria-label="Text formatting"
        defaultValue={["bold"]}
      >
        <FormattingItems />
      </ToggleGroup>
    </HStack>
  ),
};

/**
 * The accent tone marks a choice that matters on screen, like the map tool.
 * The neutral tone keeps grey for controls that sit among content, like text
 * formatting. Ghost drops the border and tightens the gaps, for toolbars.
 * Hover lightens the pressed look (accent text on a faint tint, or a faint
 * grey), so pressing an item changes its fill once; a pressed item hovered
 * gets a stronger fill.
 */
export const TonesAndVariants: Story = {
  render: () => (
    <Stack gap="4" alignItems="flex-start">
      {(["outline", "ghost"] as const).map((variant) => (
        <HStack key={variant} gap="4">
          {(["accent", "neutral"] as const).map((tone) => (
            <ToggleGroup<Tool>
              key={tone}
              aria-label={`Tool, ${tone} ${variant}`}
              tone={tone}
              variant={variant}
              defaultValue="paint"
            >
              <MapTools />
            </ToggleGroup>
          ))}
        </HStack>
      ))}
    </Stack>
  ),
};

/**
 * A sunken track with a thumb that slides to the choice, for switching
 * between views. It is a radio group to assistive technology.
 */
export const Segmented: Story = {
  render: function Render() {
    const [view, setView] = useState<"moves" | "oracles">("moves");
    const [layout, setLayout] = useState<"list" | "grid">("list");
    return (
      <Stack gap="4" alignItems="flex-start" maxWidth="420px">
        <SegmentedControl
          aria-label="Reference"
          value={view}
          onValueChange={setView}
          options={[
            { value: "moves", label: "Moves" },
            { value: "oracles", label: "Oracles" },
          ]}
        />
        <SegmentedControl
          aria-label="Layout"
          size="sm"
          value={layout}
          onValueChange={setLayout}
          options={[
            { value: "list", label: "List", icon: <ListBullets /> },
            { value: "grid", label: "Grid", icon: <SquaresFour /> },
          ]}
        />
        <SegmentedControl
          aria-label="Ruleset"
          fullWidth
          defaultValue="starforged"
          options={[
            { value: "ironsworn", label: "Ironsworn" },
            { value: "starforged", label: "Starforged" },
            { value: "sundered-isles", label: "Sundered Isles" },
          ]}
        />
      </Stack>
    );
  },
};
