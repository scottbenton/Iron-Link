import { css } from "styled-system/css";

/**
 * One experience pip. `data-state` is `empty` (not earned), `earned` (yours
 * to spend, in the accent colour) or `spent` (filled grey).
 */
export const xpPipStyles = css({
  width: "8px",
  height: "8px",
  flex: "none",
  borderRadius: "full",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "border.control",
  background: "transparent",
  transitionProperty: "background-color, border-color",
  transitionDuration: "fast",
  "&[data-state=earned]": {
    borderColor: "accent.solid",
    background: "accent.solid",
  },
  "&[data-state=spent]": {
    borderColor: "border.control",
    background: "bg.strip",
  },
});

export type XPPipState = "empty" | "earned" | "spent";

/** Spent pips come first, then the ones still to spend, then empty ones. */
export function getXPPipState(
  index: number,
  earned: number,
  spent: number,
): XPPipState {
  if (index < Math.min(spent, earned)) return "spent";
  if (index < earned) return "earned";
  return "empty";
}
