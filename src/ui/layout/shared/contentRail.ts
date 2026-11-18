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
      md: { maxWidth: "900px" },
      lg: { maxWidth: "1200px" },
      xl: { maxWidth: "1440px" },
      full: { maxWidth: "none" },
    },
  },
  defaultVariants: { maxWidth: "xl" },
});

export type PageWidth = "sm" | "md" | "lg" | "xl" | "full";
