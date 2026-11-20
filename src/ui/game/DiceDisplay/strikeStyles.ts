/**
 * A thin line through a number, reaching past it on both sides; a text
 * line-through is as heavy as the bold digits and stops at their edges.
 */
export const strikeStyles = {
  position: "relative",
  "&::after": {
    content: '""',
    position: "absolute",
    insetInline: "-0.3em",
    top: "50%",
    height: "1.5px",
    marginTop: "-0.75px",
    borderRadius: "full",
    background: "currentColor",
  },
} as const;
