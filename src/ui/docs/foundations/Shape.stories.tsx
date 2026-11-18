import type { Meta, StoryObj } from "@storybook/react-vite";

import { css } from "styled-system/css";

import { Text } from "../../components/Text";
import { pageStyles, sectionStyles } from "./foundationStyles";

const meta: Meta = {
  title: "Foundations/Space, radius and elevation",
  parameters: { layout: "fullscreen" },
};
export default meta;

const spacing = [
  "0.5",
  "1",
  "1.5",
  "2",
  "3",
  "4",
  "5",
  "6",
  "8",
  "10",
  "12",
  "16",
];
const radii = [
  { name: "xs", use: "Small marks" },
  { name: "sm", use: "Tags, menu rows, buttons inside fields" },
  { name: "md", use: "Controls, fields, menus" },
  { name: "lg", use: "Cards" },
  { name: "xl", use: "Dialogs, sheets" },
  { name: "full", use: "Chips, pills" },
];

const barStyles = css({
  height: "12px",
  borderRadius: "xs",
  background: "accent.solid",
});

export const Spacing: StoryObj = {
  render: () => (
    <div className={pageStyles}>
      <div>
        <Text variant="eyebrow">Foundations</Text>
        <Text variant="h1">Spacing</Text>
        <Text color="muted">
          A 4px scale with 2px and 6px half steps for tight game controls.
        </Text>
      </div>
      <section className={sectionStyles}>
        {spacing.map((step) => (
          <div
            key={step}
            className={css({
              display: "grid",
              gridTemplateColumns: "64px 64px minmax(0, 1fr)",
              alignItems: "center",
              gap: "3",
            })}
          >
            <Text variant="bodySm" weight="medium" as="code">
              {step}
            </Text>
            <Text variant="caption" color="muted">
              {spacingPx(step)}
            </Text>
            <div
              className={barStyles}
              style={{ width: `var(--spacing-${step.replace(".", "\\.")})` }}
            />
          </div>
        ))}
      </section>
    </div>
  ),
};

function spacingPx(step: string) {
  return `${Number(step) * 4}px`;
}

const radiusBoxStyles = css({
  width: "88px",
  height: "64px",
  background: "bg.surface",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "border.default",
});

export const Radii: StoryObj = {
  render: () => (
    <div className={pageStyles}>
      <div>
        <Text variant="eyebrow">Foundations</Text>
        <Text variant="h1">Radius</Text>
        <Text color="muted">
          Radius grows with size: controls 8px, cards 12px, dialogs 16px.
        </Text>
      </div>
      <div className={css({ display: "flex", gap: "6", flexWrap: "wrap" })}>
        {radii.map((radius) => (
          <div key={radius.name}>
            <div
              className={radiusBoxStyles}
              style={{ borderRadius: `var(--radii-${radius.name})` }}
            />
            <Text variant="bodySm" weight="medium" as="code">
              {radius.name}
            </Text>
            <Text variant="caption" color="muted" as="p">
              {radius.use}
            </Text>
          </div>
        ))}
      </div>
    </div>
  ),
};

const surfaceDemo = css({
  width: "160px",
  height: "96px",
  borderRadius: "lg",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "border.default",
  background: "bg.surface",
  display: "grid",
  placeItems: "center",
  textAlign: "center",
  padding: "3",
});

export const Elevation: StoryObj = {
  render: () => (
    <div className={pageStyles}>
      <div>
        <Text variant="eyebrow">Foundations</Text>
        <Text variant="h1">Elevation</Text>
        <Text color="muted">
          Tactile flat uses two separate signals. A ledge, a solid bottom edge,
          means you can press it: buttons and chips stand on a 2px ledge. A
          shadow means it floats over the page, and its depth says how high:
          menus, popovers and toasts float a little, dialogs higher. Floating
          things never get a ledge. Static surfaces are flat.
        </Text>
      </div>
      <div
        className={css({
          display: "flex",
          gap: "6",
          flexWrap: "wrap",
          padding: "6",
          background: "bg.canvas",
          borderRadius: "xl",
        })}
      >
        <div className={surfaceDemo}>
          <Text variant="bodySm">Flat surface</Text>
        </div>
        <div
          className={surfaceDemo}
          style={{ boxShadow: "var(--shadows-ledge)" }}
        >
          <Text variant="bodySm">Ledge (pressable)</Text>
        </div>
        <div
          className={surfaceDemo}
          style={{
            background: "var(--colors-bg-field)",
            boxShadow: "var(--shadows-field)",
            borderColor: "var(--colors-border-control)",
          }}
        >
          <Text variant="bodySm">Inset (fields)</Text>
        </div>
        <div
          className={surfaceDemo}
          style={{
            boxShadow: "var(--shadows-popover)",
            borderColor: "var(--colors-border-control)",
          }}
        >
          <Text variant="bodySm">Popover</Text>
        </div>
        <div
          className={surfaceDemo}
          style={{
            boxShadow: "var(--shadows-dialog)",
            borderColor: "var(--colors-border-control)",
          }}
        >
          <Text variant="bodySm">Dialog</Text>
        </div>
      </div>
    </div>
  ),
};
