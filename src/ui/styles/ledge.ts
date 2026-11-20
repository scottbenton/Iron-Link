import type { SystemStyleObject } from "styled-system/types";

/**
 * How tall the ledge under a pressable thing is: its full height at rest,
 * less the lift on hover, less the sink on press (never below zero). The
 * lift and sink are 0 where motion is reduced or the lift is turned off.
 */
export const ledgeHeight = {
  rest: "var(--border-widths-ledge)",
  lifted: "calc(var(--border-widths-ledge) - var(--spacing-lift))",
  sunk: "max(0px, calc(var(--border-widths-ledge) - var(--spacing-sink)))",
} as const;

export type LedgeState = keyof typeof ledgeHeight;

const offset: Record<LedgeState, string> = {
  rest: "translateY(0)",
  lifted: "translateY(var(--spacing-lift))",
  sunk: "translateY(var(--spacing-sink))",
};

/** The ledge as a box-shadow, a solid bottom edge in `color`. */
export function ledgeShadow(color: string, state: LedgeState = "rest") {
  return `0 ${ledgeHeight[state]} 0 ${color}`;
}

/**
 * The ledge and the matching move for one state: at rest, lifted on hover
 * (up by the lift, the ledge shorter by as much) or sunk on press (down
 * onto the ledge). Pass a CSS colour such as `token(colors.border.edge)`.
 * Things that share one shadow with a ring (Card, RadioCard) use
 * `ledgeHeight` instead.
 */
export function ledge(color: string, state: LedgeState): SystemStyleObject {
  return { transform: offset[state], boxShadow: ledgeShadow(color, state) };
}

/**
 * The face and the ledge drawn as two layers under a pressable's content,
 * in place of a background, a border and a box-shadow ledge.
 *
 * A box-shadow is painted only outside its box, so round a rounded bottom
 * corner the face's anti-aliased edge and the shadow's anti-aliased edge
 * each half cover the same pixels, and the page shows through between them
 * (a faint gap, clearest in Firefox and at 100%, 125% or 150% scaling).
 * Here the ledge is a copy of the face's shape set the ledge's height lower
 * and painted under it, so the face's edge always sits on solid ledge. It is
 * clipped above the point where the bottom corners start to curve, which
 * keeps it out from behind the face's straight sides.
 *
 * The element keeps its border width for layout, with a transparent
 * colour; the face layer draws the border. Set these variables, per state:
 * `--ledge-face` (fill), `--ledge-border` (border colour), `--ledge-edge`
 * (ledge colour), `--ledge-height` (one of `ledgeHeight`) and, for a
 * selection ring inside the face, `--ledge-inset` (a box-shadow). The element
 * needs a position (relative or absolute) and must not clip its overflow.
 * Pass the radius the element uses, for the clip. Something that rounds
 * itself differently, such as a pill, sets `--ledge-radius` to match (any
 * radius past half the height reads as a pill).
 */
export function ledgeLayers(radius = "token(radii.md)"): SystemStyleObject {
  const border = "var(--ledge-border-width, 1px)";
  const layer = {
    content: '""',
    position: "absolute",
    borderRadius: "inherit",
    pointerEvents: "none",
    transitionDuration: "inherit",
    transitionTimingFunction: "inherit",
  } as const;
  return {
    "--ledge-height": ledgeHeight.rest,
    "--ledge-radius": radius,
    isolation: "isolate",
    background: "transparent",
    borderColor: "transparent",
    _before: {
      ...layer,
      inset: `calc(-1 * ${border})`,
      zIndex: -1,
      background: "var(--ledge-face)",
      borderWidth: border,
      borderStyle: "solid",
      borderColor: "var(--ledge-border)",
      // An inset ring on the face, for a selected card or radio card.
      boxShadow: "var(--ledge-inset, none)",
      transitionProperty: "background-color, border-color, box-shadow",
    },
    _after: {
      ...layer,
      insetInline: `calc(-1 * ${border})`,
      top: `calc(var(--ledge-height) - ${border})`,
      bottom: `calc(-1 * (var(--ledge-height) + ${border}))`,
      zIndex: -2,
      background: "var(--ledge-edge)",
      // A pill's curve starts halfway down, whatever radius it was given.
      clipPath:
        "inset(calc(100% - min(var(--ledge-radius), 50%) - var(--ledge-height)) 0 0 0)",
      transitionProperty: "top, bottom, clip-path, background-color",
    },
  };
}
