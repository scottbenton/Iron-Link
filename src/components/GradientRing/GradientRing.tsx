import { Box, SxProps, Theme } from "@mui/material";

export interface GradientRingProps {
  /**
   * Paints only a ring this many pixels wide along the parent's edge (the
   * middle is masked out). Without it the whole parent is painted.
   */
  ringWidth?: number;
  className?: string;
  sx?: SxProps<Theme>;
  "data-testid"?: string;
}

// A square this many times the box's longer side is at least its diagonal
// (sqrt(w^2 + h^2) <= sqrt(2) * max(w, h)), so it covers the box at any angle.
const DIAGONAL_FACTOR = 1.42;

/**
 * The theme's rotating gradient, as a layer filling its positioned parent
 * (corners follow the parent's border radius). The gradient is painted on a
 * square centred on the box and turned by the `spin-gradient` keyframes
 * (App.css), so the colours sweep round any shape without leaving a corner
 * uncovered. It holds still under reduced motion.
 */
export function GradientRing(props: GradientRingProps) {
  const { ringWidth = 0, className, sx, "data-testid": dataTestId } = props;

  return (
    <Box
      component="span"
      aria-hidden
      data-testid={dataTestId}
      className={["gradient-ring", className].filter(Boolean).join(" ")}
      sx={[
        {
          position: "absolute",
          inset: 0,
          display: "block",
          overflow: "hidden",
          borderRadius: "inherit",
          // An absolute box with inset 0 has a definite size, so it can be a
          // size container; the square reads its side from it.
          containerType: "size",
          pointerEvents: "none",
        },
        ringWidth > 0
          ? {
              p: `${ringWidth}px`,
              WebkitMask:
                "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
              WebkitMaskComposite: "xor",
              mask: "linear-gradient(#000 0 0) content-box exclude, linear-gradient(#000 0 0)",
            }
          : {},
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      <Box
        component="span"
        className="gradient-ring-sweep"
        sx={(theme) => ({
          // Container units measure the content box, so the ring's padding
          // is added back to cover the whole box.
          "--gradient-ring-side": `calc((max(100cqw, 100cqh) + ${
            2 * ringWidth
          }px) * ${DIAGONAL_FACTOR})`,
          position: "absolute",
          display: "block",
          width: "var(--gradient-ring-side)",
          height: "var(--gradient-ring-side)",
          // Centred with left and top, not a translate, so the keyframes'
          // rotate (about the square's own centre) is not overridden.
          left: "calc(50% - var(--gradient-ring-side) / 2)",
          top: "calc(50% - var(--gradient-ring-side) / 2)",
          background: theme.palette.gradients.outline,
          animation: "spin-gradient 5s linear infinite",
          "@media (prefers-reduced-motion: reduce)": {
            animation: "none",
          },
        })}
      />
    </Box>
  );
}
