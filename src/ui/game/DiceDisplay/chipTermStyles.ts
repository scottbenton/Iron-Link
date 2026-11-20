import { css } from "styled-system/css";

export const chipTermStyles = css({
  display: "inline-flex",
  alignItems: "center",
  gap: "1",
  height: "var(--die-size)",
  paddingInline: "2",
  borderRadius: "sm",
  fontFamily: "heading",
  fontWeight: "bold",
  fontSize: "var(--die-font)",
  "& svg": { width: "1em", height: "1em", flex: "none" },
  "&[data-tone=momentum]": {
    background: "warning.soft",
    color: "warning.fg",
  },
  "&[data-tone=progress]": {
    background: "bg.emphasized",
    color: "fg.default",
  },
});
