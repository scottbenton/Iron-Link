import { css, cx } from "styled-system/css";
import type { SystemStyleObject } from "styled-system/types";

/**
 * The one style prop every library component takes: `css`, a Panda style
 * object turned into classes after the component's own.
 * `<Button css={{ mt: "2", alignSelf: "end" }}>`,
 * `<Card css={{ w: { base: "full", md: "sm" } }}>`.
 *
 * It is meant for placing a component (margin, size, its place in a flex or
 * grid parent, `hideBelow`). A change to how it looks belongs in a variant,
 * because Panda's stylesheet order, not the order of the classes, decides
 * which of two rules for the same property wins.
 *
 * Values must be literals (or literal responsive objects): Panda reads them
 * at build time. A value only known at runtime goes in `style`.
 */
export interface CssProp {
  /** Styles for placing the component, merged after its own classes. */
  css?: SystemStyleObject;
}

/**
 * Takes a component's props and returns them without `css`, which becomes
 * a class merged into `className`. Components call it where they
 * destructure their props: `const { ... } = withCssProp(props);`.
 *
 * When the destructure gives a function a default (`format = (n) => ...`),
 * pass the props type, `withCssProp<FooProps>(props)`, or TypeScript loses
 * the parameter types.
 */
export function withCssProp<P extends CssProp & { className?: string }>(
  props: P,
): Omit<P, "css"> {
  const { css: styles, ...rest } = props;
  if (!styles) return rest;
  return { ...rest, className: cx(css(styles), props.className) };
}
