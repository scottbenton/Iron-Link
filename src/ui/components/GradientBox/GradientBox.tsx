import { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";

import { LayoutProps, withLayoutProps } from "ui/styles/layoutProps";
import { ringLayer } from "ui/styles/ring";

import { cva, cx } from "styled-system/css";

const gradientBoxStyles = cva({
  base: {
    position: "relative",
    display: "block",
    minWidth: 0,
    borderRadius: "var(--gradient-box-radius)",
    color: "fg.default",
    "--gradient-box-fill": "var(--gradients-ring)",
    "--gradient-box-border": "2px",
  },
  variants: {
    variant: {
      /**
       * A gradient border around a surface. Drawn as two backgrounds (the
       * surface clipped to the padding box over the gradient on the border
       * box), so it follows any size and radius without a pseudo-element.
       */
      border: {
        borderWidth: "var(--gradient-box-border)",
        borderStyle: "solid",
        borderColor: "transparent",
        background:
          "linear-gradient(token(colors.bg.surface), token(colors.bg.surface)) padding-box, var(--gradient-box-fill) border-box",
      },
      /** The gradient as the background, with light text on it. */
      fill: {
        background: "var(--gradient-box-fill)",
        color: "white",
        textShadow: "0 1px 1px rgb(0 0 0 / 0.25)",
      },
    },
    radius: {
      md: { "--gradient-box-radius": "{radii.md}" },
      lg: { "--gradient-box-radius": "{radii.lg}" },
      full: { "--gradient-box-radius": "{radii.full}" },
    },
    spin: {
      /**
       * The border turns: the shared ring layer (`ui/styles/ring`), a
       * spinning square larger than the box, clipped by it and covered by the
       * surface everywhere but the border. It covers boxes up to about as
       * tall as they are wide; taller boxes should not spin.
       */
      true: {
        overflow: "hidden",
        isolation: "isolate",
        background: "transparent",
        borderColor: "transparent",
        "--ring-fill": "var(--gradient-box-fill)",
        "&::before": { ...ringLayer, zIndex: -2 },
      },
    },
  },
  compoundVariants: [
    {
      variant: "border",
      spin: true,
      css: {
        // The surface sits on a layer inset by the border's width, so the
        // spinning ring shows only around the edge. Overflow clips at the
        // padding box, so there is no real border: give the box at least that
        // much padding.
        borderWidth: 0,
        "&::after": {
          content: '""',
          position: "absolute",
          zIndex: -1,
          inset: "var(--gradient-box-border)",
          borderRadius:
            "max(0px, calc(var(--gradient-box-radius) - var(--gradient-box-border)))",
          background: "bg.surface",
          pointerEvents: "none",
        },
      },
    },
  ],
  defaultVariants: {
    variant: "border",
    radius: "lg",
  },
});

type GradientBoxOwnProps<E extends ElementType> = LayoutProps & {
  /** A 2px gradient border (the default) or a gradient fill. */
  variant?: "border" | "fill";
  /** Controls `md`, cards `lg` (the default), pills `full`. */
  radius?: "md" | "lg" | "full";
  /**
   * Turn the gradient slowly, like a roll button's ring. Stops under reduced
   * motion. Off by default: a highlight should not move unless it matters.
   */
  spin?: boolean;
  /** The element, a `div` by default. */
  as?: E;
  className?: string;
  children?: ReactNode;
};

export type GradientBoxProps<E extends ElementType = "div"> =
  GradientBoxOwnProps<E> &
    Omit<ComponentPropsWithoutRef<E>, keyof GradientBoxOwnProps<E>>;

/**
 * A box marked with the scheme's ring gradient (the roll buttons'), as a
 * border or a fill: the current page's pill in the nav, the gradient
 * button. Follows the page's colour scheme.
 */
export function GradientBox<E extends ElementType = "div">(
  props: GradientBoxProps<E>,
) {
  const { variant, radius, spin, as, className, ...rest } =
    withLayoutProps(props);
  const Element: ElementType = as ?? "div";
  return (
    <Element
      className={cx(
        gradientBoxStyles({ variant, radius, spin: spin || undefined }),
        className,
      )}
      {...rest}
    />
  );
}
