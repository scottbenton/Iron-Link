/**
 * The adds badge's change animation: a small bump of the pill and the new
 * number sliding in from the side it moved towards (up for more, down for
 * less). The number never fades, so stepping quickly doesn't flicker. Run with the Web Animations API, so it needs no global keyframes
 * and composes with the badge's CSS `scale` and `translate` (it animates
 * `transform`, a separate property). Timing reads the motion tokens:
 * `durations.normal` (200ms) for the bump, `durations.fast` (140ms) for the
 * number, both on `easings.out`.
 */

/** Iron Link's reduced motion: its own setting first, then the system's. */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return true;
  const mode = document.documentElement.getAttribute("data-motion");
  if (mode === "reduced") return true;
  if (mode === "full") return false;
  return (
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false
  );
}

function readToken(element: Element, name: string): string {
  return getComputedStyle(element).getPropertyValue(name).trim();
}

function readMs(element: Element, name: string, fallback: number): number {
  const value = readToken(element, name);
  const ms = value.endsWith("ms")
    ? parseFloat(value)
    : value.endsWith("s")
      ? parseFloat(value) * 1000
      : NaN;
  return Number.isFinite(ms) ? ms : fallback;
}

/** How far the new number travels in, in px. */
const NUMBER_TRAVEL = 3;
/** The bump's peak scale. */
const BUMP_SCALE = 1.06;

/**
 * Plays the change and returns a cleanup that cancels it, for an effect.
 * Does nothing under reduced motion or where `animate` is missing.
 */
export function playAddsChange(
  badge: HTMLElement | null,
  number: HTMLElement | null,
  direction: "up" | "down",
): (() => void) | undefined {
  if (!badge || !number || typeof badge.animate !== "function") return;
  if (prefersReducedMotion()) return;

  const easing = readToken(badge, "--easings-out") || "ease-out";
  const bump = badge.animate(
    [
      { transform: "scale(1)" },
      { transform: `scale(${BUMP_SCALE})`, offset: 0.35 },
      { transform: "scale(1)" },
    ],
    { duration: readMs(badge, "--durations-normal", 200), easing },
  );
  const from = direction === "up" ? NUMBER_TRAVEL : -NUMBER_TRAVEL;
  const fade = number.animate(
    [{ transform: `translateY(${from}px)` }, { transform: "translateY(0)" }],
    { duration: readMs(badge, "--durations-fast", 140), easing },
  );
  return () => {
    bump.cancel();
    fade.cancel();
  };
}
