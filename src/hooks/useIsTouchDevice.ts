import { useMediaQuery } from "@mui/material";

// The query `useIsTouchDevice` reads, for styles that size controls for
// fingers in CSS (an `sx` key), so the first render already has them.
export const TOUCH_DEVICE_MEDIA_QUERY = "@media (pointer: coarse)";

// The smallest tap target on a touch device (WCAG 2.5.5).
export const TOUCH_TARGET_SIZE = 44;

// Whether the main pointer is a finger, so controls need touch-sized targets
// and gestures like long press. This is about input, not screen size: a
// tablet is a touch device with room for the full layout, and a touchscreen
// laptop driven by its trackpad is not one.
export function useIsTouchDevice(): boolean {
  return useMediaQuery("(pointer: coarse)");
}
