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
