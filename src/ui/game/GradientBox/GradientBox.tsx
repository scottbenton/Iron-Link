import { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";

import { cva, cx } from "styled-system/css";

const gradientBoxStyles = cva({
  base: {
    position: "relative",
    display: "block",
    minWidth: 0,
    borderRadius: "var(--gradient-box-radius)",
    color: "fg.default",
    "--gradient-box-fill": "var(--gradients-ring)",
  },
  variants: {
    gradient: {
      ring: { "--gradient-box-fill": "var(--gradients-ring)" },
      icon: { "--gradient-box-fill": "var(--gradients-icon)" },
    },
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
      /** A faint wash of the gradient over the surface, for soft highlights. */
      wash: {
        borderWidth: "1px",
        borderStyle: "solid",
        borderColor: "border.default",
        background:
          "linear-gradient(color-mix(in oklab, token(colors.bg.surface) 86%, transparent), color-mix(in oklab, token(colors.bg.surface) 86%, transparent)), var(--gradient-box-fill)",
        _dark: {
          background:
            "linear-gradient(color-mix(in oklab, token(colors.bg.surface) 80%, transparent), color-mix(in oklab, token(colors.bg.surface) 80%, transparent)), var(--gradient-box-fill)",
        },
      },
    },
    thickness: {
      thin: { "--gradient-box-border": "1px" },
      medium: { "--gradient-box-border": "2px" },
      thick: { "--gradient-box-border": "3px" },
    },
    radius: {
      none: { "--gradient-box-radius": "0" },
      md: { "--gradient-box-radius": "{radii.md}" },
      lg: { "--gradient-box-radius": "{radii.lg}" },
      xl: { "--gradient-box-radius": "{radii.xl}" },
      full: { "--gradient-box-radius": "{radii.full}" },
    },
    spin: {
      /**
       * The border turns like the roll buttons' ring: the gradient is a
       * spinning square larger than the box, clipped by it and covered by the
       * surface everywhere but the border. It covers boxes up to about as
       * tall as they are wide; taller boxes should not spin.
       */
      true: {
        overflow: "hidden",
        isolation: "isolate",
        background: "transparent",
        borderColor: "transparent",
        "&::before": {
          content: '""',
          position: "absolute",
          zIndex: -2,
          left: "50%",
          top: "50%",
          width: "150%",
          minHeight: "150%",
          aspectRatio: "1",
          translate: "-50% -50%",
          background: "var(--gradient-box-fill)",
          animation: "ringSpin var(--durations-ring-spin) linear infinite",
          pointerEvents: "none",
        },
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
    gradient: "ring",
    variant: "border",
    thickness: "medium",
    radius: "lg",
  },
});

type GradientBoxOwnProps<E extends ElementType> = {
  /** Which brand gradient: `ring` (roll buttons) or `icon` (the logo). */
  gradient?: "ring" | "icon";
  /** A gradient border, a gradient fill, or a faint gradient wash. */
  variant?: "border" | "fill" | "wash";
  /** Border width for the `border` variant. */
  thickness?: "thin" | "medium" | "thick";
  radius?: "none" | "md" | "lg" | "xl" | "full";
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
 * A box marked with one of the scheme's gradients: as a border, a fill, or a
 * faint wash. For highlights, such as the active character or a featured
 * card. Follows the page's colour scheme.
 */
export function GradientBox<E extends ElementType = "div">(
  props: GradientBoxProps<E>,
) {
  const { gradient, variant, thickness, radius, spin, as, className, ...rest } =
    props;
  const Element: ElementType = as ?? "div";
  return (
    <Element
      className={cx(
        gradientBoxStyles({
          gradient,
          variant,
          thickness,
          radius,
          spin: spin || undefined,
        }),
        className,
      )}
      {...rest}
    />
  );
}
