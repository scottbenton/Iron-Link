import { css } from "styled-system/css";

/** The padded card of a popover or preview card, inside the popup surface. */
export const cardStyles = css({
  display: "grid",
  gap: "3",
  width: "min(320px, calc(100vw - 16px))",
  maxHeight: "var(--available-height)",
  overflowY: "auto",
  overscrollBehavior: "contain",
  padding: "4",
  borderRadius: "lg",
  fontSize: "sm",
  lineHeight: "normal",
});
