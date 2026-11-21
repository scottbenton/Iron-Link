import { useMediaQuery } from "ui/hooks/useMediaQuery";

export function usePrefersReducedMotion() {
  return useMediaQuery("(prefers-reduced-motion: reduce)");
}
