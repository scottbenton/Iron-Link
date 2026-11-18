import { css } from "styled-system/css";

/**
 * The card shared by ProgressTrack and Clock's `card` presentation: a static
 * surface with a border, a header of eyebrow, title and description, and
 * controls (minus, plus, menu) at the top right, then the boxes or dial.
 */
export const trackCardStyles = css({
  display: "grid",
  gap: "3",
  minWidth: 0,
  padding: "3",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "border.default",
  borderRadius: "lg",
  background: "bg.surface",
  color: "fg.default",
  boxShadow: "ledge",
  "&[data-plain]": {
    padding: 0,
    borderWidth: 0,
    borderRadius: 0,
    background: "transparent",
    boxShadow: "none",
  },
});

export const trackCardEyebrowStyles = css({
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  columnGap: "1.5",
  rowGap: "0.5",
  margin: 0,
  marginBottom: "0.5",
  fontFamily: "heading",
  fontWeight: "bold",
  fontSize: "xs",
  lineHeight: "snug",
  textTransform: "uppercase",
  letterSpacing: "label",
  color: "fg.muted",
});

export const trackCardDotStyles = css({ color: "fg.subtle" });

export const trackCardTitleStyles = css({
  display: "block",
  fontFamily: "heading",
  fontWeight: "bold",
  fontSize: "lg",
  lineHeight: "tight",
  textWrap: "balance",
  overflowWrap: "anywhere",
});

export const trackCardDescriptionStyles = css({
  margin: 0,
  marginTop: "1",
  fontSize: "sm",
  lineHeight: "normal",
  color: "fg.muted",
  whiteSpace: "pre-wrap",
});

export const trackCardControlsStyles = css({
  display: "flex",
  alignItems: "center",
  gap: "0.5",
  // Line the buttons up with the title when there is no eyebrow above it.
  marginTop: "-1",
  marginInlineEnd: "-1",
  // Small icon buttons are 40px on touch; these are tapped often, so 44px.
  _touch: { "& button": { minWidth: "touch", minHeight: "touch" } },
});

/** The header: eyebrow, title and description, then the controls. */
export const trackCardHeadStyles = css({
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) auto",
  alignItems: "start",
  gap: "2",
});

/** The Completed badge at the end of the eyebrow. */
export const trackCardBadgeStyles = css({
  display: "inline-flex",
  alignItems: "center",
  gap: "1",
  paddingInline: "2",
  paddingBlock: "0.5",
  borderRadius: "full",
  background: "success.soft",
  color: "success.fg",
  fontFamily: "heading",
  fontWeight: "bold",
  fontSize: "xs",
  lineHeight: "snug",
  textTransform: "uppercase",
  letterSpacing: "label",
  "& svg": { width: "1.1em", height: "1.1em" },
});

/** Extra actions under the card's track or beside its dial. */
export const trackCardActionsStyles = css({
  display: "flex",
  alignItems: "center",
  gap: "2",
  flexWrap: "wrap",
});
