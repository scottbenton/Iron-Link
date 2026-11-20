import { css } from "styled-system/css";

export type PhoneRuleset = "starforged" | "ironsworn";

/* ------------------------------------------------------------------------ */
/* Reference: Moves, Oracles, Log                                           */
/* ------------------------------------------------------------------------ */

export const referenceStyles = css({
  paddingInline: "4",
  paddingBlockStart: "4",
  paddingBlockEnd: "var(--phone-page-foot, token(spacing.8))",
});
