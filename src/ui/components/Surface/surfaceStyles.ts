import { cva } from "styled-system/css";
import type { RecipeVariantProps } from "styled-system/css";

/**
 * A block of the page with a solid edge. Elevation is solid in this look:
 * a border, plus a ledge (a solid bottom edge) for things that are raised.
 */
export const surfaceStyles = cva({
  base: {
    boxSizing: "border-box",
    borderWidth: "1px",
    borderStyle: "solid",
    color: "fg.default",
  },
  variants: {
    tone: {
      /** Level with the page: the surface colour and a border. */
      flat: { background: "bg.surface", borderColor: "border.default" },
      /**
       * Raised on a ledge. Keep it for things that can be pressed and for
       * the current one of a set (the open note); a still card is flat.
       */
      raised: {
        background: "bg.surface",
        borderColor: "border.default",
        boxShadow: "ledge",
      },
      /** Sunken below the page, like a field: wells and empty slots. */
      inset: {
        background: "bg.muted",
        borderColor: "border.default",
        boxShadow: "field",
      },
      /** The canvas colour, for a strip or tray behind raised things. */
      canvas: { background: "bg.canvas", borderColor: "border.default" },
    },
    radius: {
      md: { borderRadius: "md" },
      lg: { borderRadius: "lg" },
      xl: { borderRadius: "xl" },
    },
    padding: {
      none: {},
      sm: { padding: "2" },
      md: { padding: "4" },
      lg: { padding: "6" },
    },
  },
  defaultVariants: { tone: "flat", radius: "lg", padding: "none" },
});

export type SurfaceVariants = NonNullable<
  RecipeVariantProps<typeof surfaceStyles>
>;
