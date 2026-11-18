import { css, cx } from "styled-system/css";
import type { SystemStyleObject } from "styled-system/types";

/**
 * The style props every library component takes: where it sits and how big
 * it is, never how it looks. `<Button mt="2" alignSelf="end">`,
 * `<Card w={{ base: "full", md: "sm" }}>`. Colours, borders and padding stay
 * off components on purpose, so a visual change goes through a variant.
 *
 * Values must be literals (or literal responsive objects): Panda reads them
 * at build time. A value only known at runtime goes in `style`.
 */
export const layoutPropKeys = [
  // Margin
  "margin",
  "marginTop",
  "marginRight",
  "marginBottom",
  "marginLeft",
  "marginX",
  "marginY",
  "marginInline",
  "marginInlineStart",
  "marginInlineEnd",
  "marginBlock",
  "marginBlockStart",
  "marginBlockEnd",
  "marginStart",
  "marginEnd",
  "m",
  "mt",
  "mr",
  "mb",
  "ml",
  "mx",
  "my",
  "ms",
  "me",
  // Size
  "width",
  "minWidth",
  "maxWidth",
  "height",
  "minHeight",
  "maxHeight",
  "w",
  "minW",
  "maxW",
  "h",
  "minH",
  "maxH",
  // Placement inside a flex or grid parent
  "flex",
  "flexGrow",
  "flexShrink",
  "flexBasis",
  "alignSelf",
  "justifySelf",
  "placeSelf",
  "order",
  "gridColumn",
  "gridColumnStart",
  "gridColumnEnd",
  "gridRow",
  "gridRowStart",
  "gridRowEnd",
  "gridArea",
  // Showing only at some widths
  "hideFrom",
  "hideBelow",
] as const;

export type LayoutPropKey = (typeof layoutPropKeys)[number];

export type LayoutProps = Pick<SystemStyleObject, LayoutPropKey>;

const layoutKeySet: ReadonlySet<string> = new Set(layoutPropKeys);

/**
 * Takes a component's props and returns them without the layout props,
 * which become a class merged into `className`. Components call it where
 * they destructure their props: `const { ... } = withLayoutProps(props);`.
 *
 * When the destructure gives a function a default (`format = (n) => ...`),
 * pass the props type, `withLayoutProps<FooProps>(props)`, or TypeScript
 * loses the parameter types.
 *
 * `keep` names layout keys the component uses as its own props (Skeleton's
 * `width`), which are then passed through untouched.
 */
export function withLayoutProps<P extends { className?: string }>(
  props: P,
  keep: readonly LayoutPropKey[] = [],
): P {
  let layout: Record<string, unknown> | undefined;
  const rest: Record<string, unknown> = {};
  for (const key in props) {
    const value = props[key];
    if (layoutKeySet.has(key) && !keep.includes(key as LayoutPropKey)) {
      if (value === undefined) continue;
      layout ??= {};
      layout[key] = value;
    } else {
      rest[key] = value;
    }
  }
  if (!layout) return props;
  rest.className = cx(css(layout as SystemStyleObject), props.className);
  return rest as P;
}
