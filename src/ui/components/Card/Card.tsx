import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { ComponentProps, ReactElement, forwardRef } from "react";

import { CssProp, withCssProp } from "ui/styles/cssProp";
import { focusRing } from "ui/styles/focus";
import { ledgeHeight, ledgeLayers } from "ui/styles/ledge";

import { cva, cx } from "styled-system/css";
import type { SystemStyleObject } from "styled-system/types";

import { surfaceStyles } from "../Surface";
import { overlay, target } from "./cardSelectors";

const enabled = ":not(:disabled, [aria-disabled=true], [data-disabled])";

/**
 * With an overlay, every other control in the card sits above the overlay
 * (z-index 1) so it stays its own target, as does anything marked
 * `data-card-raised`. Zero specificity, so a control's own positioning still
 * wins. Panda's types only take selectors that start or end with `&`.
 */
const raisedControls = {
  [`:where(&:has(${overlay})) :where(a[href], button, input, select, textarea, summary, label, [role=button], [role=link], [role=checkbox], [role=switch], [role=tab], [tabindex]:not([tabindex="-1"]), [data-card-raised]):where(:not(${overlay}))`]:
    { position: "relative", zIndex: 2 },
} as SystemStyleObject;

const cardStyles = cva({
  base: {
    position: "relative",
    display: "grid",
    alignContent: "start",
    gap: "3",
    minWidth: 0,
    fontFamily: "body",
    // The face and ledge colours, drawn only once the card is pressable.
    "--ledge-face": "{colors.bg.surface}",
    "--ledge-border": "{colors.border.default}",
    "--ledge-edge": "{colors.border.edge}",
    // A card with an action area or an overlay is pressable: its face and
    // ledge become layers under its content (see `ledgeLayers`), the border
    // darkens on hover and it sinks on press, all as one piece. Hovering or
    // pressing a secondary action inside does neither.
    [`&:has(${target("")})`]: {
      ...ledgeLayers("token(radii.lg)"),
      boxShadow: "none",
      transform: "translateY(0)",
      transitionProperty: "transform",
      transitionDuration: "fast",
      transitionTimingFunction: "out",
    },
    // Not while pressed: the press rule below sets the same two, and the two
    // selectors weigh the same, so stylesheet order would pick.
    [`&:has(${target(`:is(:hover, [data-hover]):not(:active, [data-pressed])${enabled}`)})`]:
      {
        "--ledge-height": ledgeHeight.lifted,
        transform: "translateY(var(--spacing-lift))",
      },
    [`&:has(${target(`:is(:hover, [data-hover])${enabled}`)})`]: {
      "--ledge-border": "{colors.border.control}",
    },
    [`&:has(${target(`:is(:active, [data-pressed])${enabled}`)})`]: {
      "--ledge-height": ledgeHeight.sunk,
      transform: "translateY(var(--spacing-sink))",
      transitionDuration: "instant",
    },
    [`&:has(${target(":focus-visible")})`]: focusRing.outset,
    [`&:has(${target(":is(:disabled, [aria-disabled=true], [data-disabled])")})`]:
      {
        transform: "none",
        "--ledge-height": ledgeHeight.rest,
        "--ledge-border": "{colors.border.default}",
        "--ledge-inset": "none",
        "--ledge-edge": "transparent",
        opacity: 0.6,
      },
    ...raisedControls,
  },
  variants: {
    padding: {
      none: { padding: 0 },
      sm: { padding: "3" },
      md: { padding: "4" },
    },
  },
  defaultVariants: { padding: "md" },
});

export interface CardProps extends ComponentProps<"div">, CssProp {
  /** Inner padding; `none` for a card whose parts bring their own. */
  padding?: "none" | "sm" | "md";
  /** Raise the card on a ledge without making it pressable. */
  raised?: boolean;
  /** Render another element, such as `<article />` or `<li />`. */
  render?: ReactElement;
}

/**
 * A surface card: border, radius lg, the surface colour. Compose it from
 * `CardHeader`, `CardBody` and `CardFooter`.
 *
 * To make the whole card open or do something, use one of two parts:
 * - `CardLinkOverlay` when the card opens a page and holds other controls
 *   (a menu, an Invite button) anywhere in it. The link is just the title,
 *   so its name is short, and the other controls keep working.
 * - `CardActionArea` when the card is one control whose name is everything
 *   it wraps, such as a button that runs an action. Other controls go in a
 *   `CardFooter` or the header's `action`, outside it.
 *
 * Each gives the card the ledge and the 1px sink on press. To choose one
 * of a set, use `RadioCard` (or a `Checkbox` in each card for several).
 */
export const Card = forwardRef<HTMLDivElement, CardProps>(
  function Card(props, ref) {
    const { padding, raised, className, render, ...rest } = withCssProp(props);
    return useRender({
      defaultTagName: "div",
      render,
      ref,
      props: mergeProps<"div">(
        {
          className: cx(
            surfaceStyles({ tone: raised ? "raised" : "flat", radius: "lg" }),
            cardStyles({ padding }),
            className,
          ),
        } as ComponentProps<"div">,
        rest,
      ),
    });
  },
);
