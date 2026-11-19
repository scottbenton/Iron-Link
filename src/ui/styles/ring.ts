import type { SystemStyleObject } from "styled-system/types";

/**
 * The scheme's turning gradient ring, as a pseudo-element: a spinning
 * square of `--ring-fill` (the ring gradient unless a part sets another)
 * larger than its box and clipped by it, so it shows only where the box
 * leaves a gap around an inner layer. The box needs `position: relative`,
 * `overflow: hidden` and `isolation: isolate`. It turns as long as it is
 * shown and stops under reduced motion. GradientBox, the gradient button,
 * the roll button and the stat card all draw their ring with it.
 */
export const ringLayer: SystemStyleObject = {
  content: '""',
  position: "absolute",
  zIndex: -1,
  left: "50%",
  top: "50%",
  width: "150%",
  minHeight: "150%",
  aspectRatio: "1",
  translate: "-50% -50%",
  background: "var(--ring-fill, var(--gradients-ring))",
  animation: "ringSpin var(--durations-ring-spin) linear infinite",
  transition:
    "opacity var(--durations-fast) linear, filter var(--durations-fast) linear",
  pointerEvents: "none",
};
