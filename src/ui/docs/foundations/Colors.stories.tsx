import type { Meta, StoryObj } from "@storybook/react-vite";

import { Text } from "../../components/Text";
import { grayStepNames } from "../../theme";
import { Swatch } from "./Swatch";
import {
  pageStyles,
  sectionStyles,
  swatchGridStyles,
  tokenVar,
} from "./foundationStyles";

const meta: Meta = {
  title: "Foundations/Colour",
  parameters: { layout: "fullscreen" },
};
export default meta;

type Group = {
  title: string;
  description: string;
  tokens: { name: string; note?: string }[];
};

const groups: Group[] = [
  {
    title: "Backgrounds",
    description:
      "The canvas sits behind everything; surfaces are cards and pages on it. Field is the inset well of a text field. Chip and stat are the dark pressable blocks.",
    tokens: [
      { name: "bg.canvas", note: "App background" },
      { name: "bg.surface", note: "Cards, dialogs, menus" },
      { name: "bg.muted", note: "Dialog footers, quiet bands" },
      { name: "bg.emphasized", note: "Hover on muted areas" },
      { name: "bg.strip", note: "Note tab strip" },
      { name: "bg.field", note: "Inset text fields" },
      { name: "bg.chip", note: "Dark chips, toasts" },
      { name: "bg.stat", note: "Stat cards" },
    ],
  },
  {
    title: "Text",
    description:
      "Default for body text, muted for secondary text, subtle for hints.",
    tokens: [
      { name: "fg.default" },
      { name: "fg.muted" },
      { name: "fg.subtle" },
      { name: "fg.disabled" },
    ],
  },
  {
    title: "Borders",
    description:
      "Edge is the colour of a ledge, the solid bottom edge of anything you can press and of everything that floats.",
    tokens: [
      { name: "border.subtle" },
      { name: "border.default" },
      { name: "border.control", note: "Field outlines (3:1)" },
      { name: "border.edge", note: "Ledges" },
    ],
  },
  {
    title: "Overlays",
    description:
      "Translucent fills for rows, menu items and toolbar buttons, which never move on press.",
    tokens: [
      { name: "overlay.hover" },
      { name: "overlay.pressed" },
      { name: "overlay.selected" },
    ],
  },
  {
    title: "Accent",
    description:
      "From the colour scheme. Switch schemes in the toolbar to see each one.",
    tokens: [
      { name: "accent.fg", note: "Text and icons" },
      { name: "accent.solid", note: "Primary buttons" },
      { name: "accent.onSolid" },
      { name: "accent.soft", note: "Tints, pressed toggles" },
      { name: "accent.edge", note: "Primary ledge" },
      { name: "focusRing" },
    ],
  },
  {
    title: "Status",
    description:
      "Each meets WCAG AA on surfaces: the 700 stop in light mode and the 400 stop in dark.",
    tokens: [
      { name: "success.fg" },
      { name: "success.soft" },
      { name: "warning.fg" },
      { name: "warning.soft" },
      { name: "danger.fg" },
      { name: "danger.soft" },
      { name: "info.fg" },
      { name: "info.soft" },
      { name: "cursed.fg", note: "Cursed die" },
      { name: "cursed.soft" },
    ],
  },
];

export const SemanticColours: StoryObj = {
  name: "Semantic colours",
  render: () => (
    <div className={pageStyles}>
      <div>
        <Text variant="eyebrow">Foundations</Text>
        <Text variant="h1">Colour</Text>
        <Text color="muted">
          Use these names in components. Each one has a light and a dark value,
          and the accent follows the colour scheme. Use the Mode and Scheme
          controls in the toolbar.
        </Text>
      </div>
      {groups.map((group) => (
        <section key={group.title} className={sectionStyles}>
          <Text variant="h2">{group.title}</Text>
          <Text variant="bodySm" color="muted">
            {group.description}
          </Text>
          <div className={swatchGridStyles}>
            {group.tokens.map((token) => (
              <Swatch
                key={token.name}
                name={token.name}
                note={token.note}
                value={tokenVar("colors", token.name)}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  ),
};

export const Grays: StoryObj = {
  name: "Gray ramp",
  render: () => (
    <div className={pageStyles}>
      <div>
        <Text variant="eyebrow">Foundations</Text>
        <Text variant="h1">Gray ramp</Text>
        <Text color="muted">
          Zinc lightness with a faint tint toward the scheme&apos;s hue, so each
          scheme&apos;s neutrals lean its way. Prefer the semantic names above
          in components.
        </Text>
      </div>
      <div className={swatchGridStyles}>
        {grayStepNames.map((step) => (
          <Swatch
            key={step}
            name={`gray.${step}`}
            value={`var(--colors-gray-${step})`}
          />
        ))}
      </div>
    </div>
  ),
};

export const Gradients: StoryObj = {
  render: () => (
    <div className={pageStyles}>
      <div>
        <Text variant="eyebrow">Foundations</Text>
        <Text variant="h1">Gradients</Text>
        <Text color="muted">
          The ring gradient marks roll and oracle buttons and the current page
          tab. The icon gradient fills the logo and character portraits.
        </Text>
      </div>
      <div className={swatchGridStyles}>
        <Swatch name="gradients.ring" value="var(--gradients-ring)" />
        <Swatch name="gradients.icon" value="var(--gradients-icon)" />
        <Swatch name="ring.start" value="var(--colors-ring-start)" />
        <Swatch name="ring.end" value="var(--colors-ring-end)" />
      </div>
    </div>
  ),
};
