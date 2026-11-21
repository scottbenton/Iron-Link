import { cva } from "styled-system/css";

/** The centred content rail: a page's width, inside its side insets. */
export const contentRailStyles = cva({
  base: {
    boxSizing: "border-box",
    width: "100%",
    marginInline: "auto",
  },
  variants: {
    maxWidth: {
      sm: { maxWidth: "640px" },
      xl: { maxWidth: "1440px" },
    },
  },
  defaultVariants: { maxWidth: "xl" },
});

export type PageWidth = "sm" | "xl";
