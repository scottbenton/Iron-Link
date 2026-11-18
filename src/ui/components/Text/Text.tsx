import { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";

import { cva, cx } from "styled-system/css";
import type { RecipeVariantProps } from "styled-system/css";

export const textStyles = cva({
  base: { margin: 0 },
  variants: {
    variant: {
      /** Page titles. */
      display: {
        fontFamily: "heading",
        fontWeight: "bold",
        fontSize: "3xl",
        lineHeight: "none",
        letterSpacing: "-0.005em",
        textWrap: "balance",
      },
      h1: {
        fontFamily: "heading",
        fontWeight: "bold",
        fontSize: "2xl",
        lineHeight: "tight",
        textWrap: "balance",
      },
      h2: {
        fontFamily: "heading",
        fontWeight: "bold",
        fontSize: "xl",
        lineHeight: "tight",
        textWrap: "balance",
      },
      h3: {
        fontFamily: "heading",
        fontWeight: "bold",
        fontSize: "lg",
        lineHeight: "tight",
        textWrap: "balance",
      },
      h4: {
        fontFamily: "heading",
        fontWeight: "bold",
        fontSize: "md",
        lineHeight: "snug",
        letterSpacing: "0.01em",
      },
      body: { fontSize: "md", lineHeight: "normal" },
      bodySm: { fontSize: "sm", lineHeight: "normal" },
      caption: { fontSize: "xs", lineHeight: "snug" },
      /** Small uppercase heading-face labels: stat names, group headings. */
      label: {
        fontFamily: "heading",
        fontWeight: "bold",
        fontSize: "xs",
        lineHeight: "snug",
        textTransform: "uppercase",
        letterSpacing: "label",
      },
      /** Accent eyebrow above a title. */
      eyebrow: {
        fontFamily: "heading",
        fontWeight: "bold",
        fontSize: "sm",
        lineHeight: "snug",
        textTransform: "uppercase",
        letterSpacing: "label",
        color: "accent.fg",
      },
      numeric: {
        fontVariantNumeric: "tabular-nums",
        lineHeight: "none",
      },
    },
    color: {
      default: { color: "fg.default" },
      muted: { color: "fg.muted" },
      subtle: { color: "fg.subtle" },
      accent: { color: "accent.fg" },
      success: { color: "success.fg" },
      warning: { color: "warning.fg" },
      danger: { color: "danger.fg" },
      inherit: { color: "inherit" },
    },
    weight: {
      normal: { fontWeight: "normal" },
      medium: { fontWeight: "medium" },
      semibold: { fontWeight: "semibold" },
      bold: { fontWeight: "bold" },
    },
    truncate: {
      true: {
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        minWidth: 0,
      },
    },
  },
  defaultVariants: { variant: "body" },
});

export type TextVariant = NonNullable<
  RecipeVariantProps<typeof textStyles>
>["variant"];

const defaultElement: Record<NonNullable<TextVariant>, ElementType> = {
  display: "h1",
  h1: "h1",
  h2: "h2",
  h3: "h3",
  h4: "h4",
  body: "p",
  bodySm: "p",
  caption: "span",
  label: "span",
  eyebrow: "p",
  numeric: "span",
};

type TextOwnProps<E extends ElementType> = RecipeVariantProps<
  typeof textStyles
> & {
  /**
   * The element. `variant` sets the look and `as` the element, so a label
   * that only looks like a heading can stay a span (CLAUDE.md, headings).
   */
  as?: E;
  children?: ReactNode;
  className?: string;
};

export type TextProps<E extends ElementType = "p"> = TextOwnProps<E> &
  Omit<ComponentPropsWithoutRef<E>, keyof TextOwnProps<E> | "color">;

/** Every piece of text in the library: headings, body, labels, captions. */
export function Text<E extends ElementType = "p">(props: TextProps<E>) {
  const { as, variant, color, weight, truncate, className, ...rest } = props;
  const Element = as ?? defaultElement[variant ?? "body"];
  return (
    <Element
      className={cx(
        textStyles({ variant, color, weight, truncate }),
        className,
      )}
      {...rest}
    />
  );
}
