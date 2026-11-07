// The width of the list beside an open move or oracle.
export const referenceListWidth = 340;
// An open item reads best at about 75 characters a line.
export const referenceDetailMaxWidth = "75ch";
// The page is as wide as the list and a full width item, with its padding.
export const referencePageMaxWidth = `calc(${referenceListWidth}px + ${referenceDetailMaxWidth} + 50px)`;

// Read by screen readers, not shown.
export const visuallyHidden = {
  border: 0,
  clip: "rect(0 0 0 0)",
  height: "1px",
  margin: "-1px",
  overflow: "hidden",
  padding: 0,
  position: "absolute",
  whiteSpace: "nowrap",
  width: "1px",
} as const;
