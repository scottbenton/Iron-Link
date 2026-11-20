import type { Meta, StoryObj } from "@storybook/react-vite";

import { css, cx } from "styled-system/css";

import { Text } from "../../components/Text";
import { pageStyles, sectionStyles } from "./foundationStyles";

const meta: Meta = {
  title: "Foundations/Space, sizes, radius and elevation",
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

// Each size's bar is its own literal class, so Panda can extract it.
const controlSizes = [
  {
    name: "control.xs",
    px: "28px",
    use: "Compact chips, steppers, adds",
    className: css({ height: "control.xs" }),
  },
  {
    name: "control.sm",
    px: "32px",
    use: "Small buttons and fields, tabs",
    className: css({ height: "control.sm" }),
  },
  {
    name: "control.row",
    px: "36px",
    use: "Menu, list and select rows",
    className: css({ height: "control.row" }),
  },
  {
    name: "control.md",
    px: "40px",
    use: "Buttons and fields",
    className: css({ height: "control.md" }),
  },
  {
    name: "touch",
    px: "44px",
    use: "Every control on a touch screen",
    className: css({ height: "touch" }),
  },
];
const iconSizes = [
  {
    name: "icon.sm",
    px: "14px",
    use: "Inside small text",
    className: css({ width: "icon.sm", height: "icon.sm" }),
  },
  {
    name: "icon.md",
    px: "18px",
    use: "Inside every control",
    className: css({ width: "icon.md", height: "icon.md" }),
  },
  {
    name: "icon.lg",
    px: "24px",
    use: "Nav items, radio cards",
    className: css({ width: "icon.lg", height: "icon.lg" }),
  },
];

const sizeRowStyles = css({
  display: "grid",
  gridTemplateColumns: "96px 48px minmax(0, 1fr) auto",
  alignItems: "center",
  gap: "3",
});
const heightBarStyles = css({
  width: "96px",
  borderRadius: "md",
  background: "accent.soft",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "accent.solid",
});
const iconBoxStyles = css({ borderRadius: "xs", background: "accent.solid" });

export const Sizes: StoryObj = {
  render: () => (
    <div className={pageStyles}>
      <div>
        <Text variant="eyebrow">Foundations</Text>
        <Text variant="h1">Sizes</Text>
        <Text color="muted">
          Control heights, icon sizes and one reading width. Fields and buttons
          share control.md so they line up in a row; on a touch screen controls
          grow to the 44px touch target.
        </Text>
      </div>
      <section className={sectionStyles}>
        <Text variant="h2">Control heights</Text>
        {controlSizes.map((size) => (
          <div key={size.name} className={sizeRowStyles}>
            <Text variant="bodySm" weight="medium" as="code">
              {size.name}
            </Text>
            <Text variant="caption" color="muted">
              {size.px}
            </Text>
            <Text variant="bodySm" color="muted">
              {size.use}
            </Text>
            <div className={cx(heightBarStyles, size.className)} />
          </div>
        ))}
      </section>
      <section className={sectionStyles}>
        <Text variant="h2">Icons</Text>
        {iconSizes.map((size) => (
          <div key={size.name} className={sizeRowStyles}>
            <Text variant="bodySm" weight="medium" as="code">
              {size.name}
            </Text>
            <Text variant="caption" color="muted">
              {size.px}
            </Text>
            <Text variant="bodySm" color="muted">
              {size.use}
            </Text>
            <div className={cx(iconBoxStyles, size.className)} />
          </div>
        ))}
      </section>
      <section className={sectionStyles}>
        <Text variant="h2">Reading width</Text>
        <Text variant="bodySm" color="muted">
          prose (72ch) caps notes, rules text and long descriptions.
        </Text>
      </section>
    </div>
  ),
};

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
