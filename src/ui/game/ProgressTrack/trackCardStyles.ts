import { css } from "styled-system/css";

/**
 * The card shared by ProgressTrack and Clock's `card` presentation: a static
 * surface with a border, a header of eyebrow, title and description with the
 * menu at the top right, then the boxes or dial with their minus and plus.
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
  fontSize: "sm",
  lineHeight: "normal",
  color: "fg.muted",
  whiteSpace: "pre-wrap",
});

/**
 * A card's minus and plus, beside the dial or under the boxes. Small icon
 * buttons are 40px on touch; these are tapped often, so 44px.
 */
export const trackCardStepperStyles = css({
  display: "flex",
  alignItems: "center",
  gap: "1",
  flex: "none",
  _touch: { "& button": { minWidth: "touch", minHeight: "touch" } },
});

/**
 * The header: the eyebrow with the action at its end, then the title and
 * description at full width. Without an eyebrow, the action sits beside the
 * title.
 */
export const trackCardHeadStyles = css({
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) auto",
  gridTemplateAreas: '"title action" "description description"',
  alignItems: "center",
  columnGap: "2",
  "&[data-eyebrow]": {
    gridTemplateAreas:
      '"eyebrow action" "title title" "description description"',
  },
  "& > [data-area=eyebrow]": { gridArea: "eyebrow" },
  "& > [data-area=action]": { gridArea: "action" },
  "& > [data-area=title]": { gridArea: "title", minWidth: 0 },
  "& > [data-area=description]": { gridArea: "description", marginTop: "1" },
  "&[data-eyebrow] > [data-area=title]": { marginTop: "0.5" },
  // The title starts at the action's top when they share a row.
  "&:not([data-eyebrow]) > [data-area=action]": { alignSelf: "start" },
});

/** The header's action, pulled into the card's corner padding. */
export const trackCardHeadActionStyles = css({
  display: "flex",
  alignItems: "center",
  // The eyebrow's line is shorter than a button: overlap the space around
  // it rather than push the title down.
  marginBlock: "-1.5",
  marginInlineEnd: "-1.5",
  _touch: { "& button": { minWidth: "touch", minHeight: "touch" } },
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

/**
 * The row under the boxes or dial: extra actions such as Roll Progress,
 * then a track's minus and plus at the end.
 */
export const trackCardActionsStyles = css({
  display: "flex",
  alignItems: "center",
  gap: "2",
  flexWrap: "wrap",
  "& > [data-actions]": {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: "2",
    flex: "1 1 auto",
    minWidth: 0,
  },
  "& > [data-stepper]": { marginInlineStart: "auto" },
});
