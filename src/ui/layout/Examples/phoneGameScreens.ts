import { css } from "styled-system/css";

export type PhoneRuleset = "starforged" | "ironsworn";

/** The 48px tabs, sharing the width as the live phone tabs do. */
export const screenTabsStyles = css({
  paddingInline: "4",
  paddingBlockStart: "1",
  "& [role=tablist]": { width: "100%" },
  // Equal shares of the row; doubled to outrank the tab's own `flex`.
  "& [role=tab][role=tab]": { flex: "1 1 0" },
});

export const screenPanelStyles = css({
  paddingInline: "4",
  paddingBlockStart: "4",
  // Clear of the activity dock when rolls are showing.
  paddingBlockEnd: "var(--phone-page-foot, token(spacing.8))",
});

/* ------------------------------------------------------------------------ */
/* Reference: Moves, Oracles, Log                                           */
/* ------------------------------------------------------------------------ */

export const referenceStyles = css({
  paddingInline: "4",
  paddingBlockStart: "4",
  paddingBlockEnd: "var(--phone-page-foot, token(spacing.8))",
});
