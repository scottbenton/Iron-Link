import { useMediaQuery } from "ui/hooks/useMediaQuery";

// Whether the main pointer is a finger, so controls need touch-sized targets
// and gestures like long press. This is about input, not screen size: a
// tablet is a touch device with room for the full layout, and a touchscreen
// laptop driven by its trackpad is not one.
export function useIsTouchDevice(): boolean {
  return useMediaQuery("(pointer: coarse)");
}
