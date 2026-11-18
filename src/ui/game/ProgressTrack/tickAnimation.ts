import { MAX_TICKS, TICKS_PER_BOX, clampTicks } from "./progress";

/**
 * How new ticks draw in on a progress track:
 * - `sequence` (default): each line draws in tick order, like a pen.
 * - `box`: a box's new lines draw together, box after box.
 * - `together`: every new line draws at once (the old animation, shorter).
 * - `fade`: each line fades in while finishing a short draw, in tick order.
 * - `none`: the marks just appear.
 */
export type TickAnimation = "sequence" | "box" | "together" | "fade" | "none";

/**
 * The whole change finishes within this, however many ticks are added: the
 * per-line duration and the stagger shrink to fit.
 */
export const TICK_ANIMATION_BUDGET_MS = 240;

export interface TickAnimationPlan {
  /** How long one line (or box) takes to draw, in ms. */
  duration: number;
  /** Delay between one step and the next, in ms. */
  stagger: number;
  /**
   * The step each tick waits for (delay = step * stagger), by tick index 0
   * to 39, or undefined for ticks that are not new.
   */
  steps: (number | undefined)[];
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const round = (value: number) => Math.round(value * 10) / 10;

/**
 * Fits `count` staggered steps into the budget: each step lasts between
 * `min` and `max` ms, and steps start at most `maxStagger` apart.
 */
function fit(count: number, min: number, max: number, maxStagger: number) {
  const budget = TICK_ANIMATION_BUDGET_MS;
  const duration = clamp(budget - maxStagger * (count - 1), min, max);
  const stagger =
    count > 1 ? Math.min(maxStagger, (budget - duration) / (count - 1)) : 0;
  // Round down so rounding never pushes the total past the budget.
  return {
    duration: Math.floor(duration),
    stagger: Math.floor(stagger * 10) / 10,
  };
}

/** Plans the draw-in for a change from `from` ticks to `to` ticks. */
export function getTickAnimationPlan(
  animation: TickAnimation,
  from: number,
  to: number,
): TickAnimationPlan {
  const start = clampTicks(from);
  const end = clampTicks(to);
  const steps: (number | undefined)[] = Array(MAX_TICKS).fill(undefined);
  const added = end - start;
  if (animation === "none" || added <= 0) {
    return { duration: 0, stagger: 0, steps };
  }

  const firstBox = Math.floor(start / TICKS_PER_BOX);
  const boxes = Math.floor((end - 1) / TICKS_PER_BOX) - firstBox + 1;
  const timing = {
    sequence: () => fit(added, 90, 160, 40),
    box: () => fit(boxes, 110, 180, 60),
    together: () => ({ duration: 180, stagger: 0 }),
    fade: () => fit(added, 100, 140, 30),
  }[animation]();

  for (let tick = start; tick < end; tick += 1) {
    steps[tick] =
      animation === "box"
        ? Math.floor(tick / TICKS_PER_BOX) - firstBox
        : animation === "together"
          ? 0
          : tick - start;
  }
  return { ...timing, steps };
}

/** When the last step finishes, in ms. */
export function getTickAnimationTotal(plan: TickAnimationPlan): number {
  const last = Math.max(-1, ...plan.steps.map((step) => step ?? -1));
  return last < 0 ? 0 : round(plan.duration + plan.stagger * last);
}
