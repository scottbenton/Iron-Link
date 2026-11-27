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
      md: { maxWidth: "960px" },
      xl: { maxWidth: "1440px" },
    },
  },
  defaultVariants: { maxWidth: "xl" },
});

/** sm 640px for forms, md 960px for reading, xl 1440px for everything else. */
export type PageWidth = "sm" | "md" | "xl";
