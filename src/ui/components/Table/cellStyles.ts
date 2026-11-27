import { cva } from "styled-system/css";

export const cellStyles = cva({
  base: {
    boxSizing: "border-box",
    textAlign: "start",
    verticalAlign: "baseline",
    transition: "background-color token(durations.fast) linear",
  },
  variants: {
    density: {
      comfortable: { paddingBlock: "3", paddingInline: "3" },
      compact: { paddingBlock: "1", paddingInline: "2" },
    },
    numeric: {
      true: {
        textAlign: "end",
        fontVariantNumeric: "tabular-nums",
        whiteSpace: "nowrap",
      },
      false: {},
    },
    header: {
      true: {
        fontFamily: "heading",
        fontWeight: "bold",
        fontSize: "xs",
        lineHeight: "snug",
        textTransform: "uppercase",
        letterSpacing: "label",
        color: "fg.muted",
        verticalAlign: "bottom",
        background: "bg.muted",
        borderBottom: "1px solid token(colors.border.default)",
        whiteSpace: "nowrap",
      },
      false: {},
    },
    sticky: {
      true: { position: "sticky", top: 0, zIndex: 1 },
      false: {},
    },
  },
});
