import { CSSProperties, useState } from "react";

import { css, cx } from "styled-system/css";

import { MAX_TICKS, TICKS_PER_BOX, clampTicks, getBoxTicks } from "./progress";
import { TickAnimation, getTickAnimationPlan } from "./tickAnimation";

/** The four marks of a box, drawn in order: two diagonals, then a cross. */
const MARKS = [
  [3, 17, 17, 3],
  [3, 3, 17, 17],
  [10, 1.5, 10, 18.5],
  [1.5, 10, 18.5, 10],
] as const;

const trackStyles = css({
  display: "grid",
  gridTemplateColumns: "repeat(10, minmax(0, 1fr))",
  gap: "3px",
  maxWidth: "var(--progress-boxes-max-width, 420px)",
});

/**
 * A line is a 20 unit dash pushed off its own length, so moving the dash
 * offset to 0 draws it from its start. New lines draw over
 * `--tick-duration`, each waiting its `--tick-step` times `--tick-stagger`
 * (set by getTickAnimationPlan, which keeps the whole change under 250ms).
 * Erased lines all draw back out at once, quickly.
 */
const boxStyles = css({
  aspectRatio: "1",
  maxWidth: "100%",
  display: "grid",
  placeItems: "center",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "border.control",
  borderRadius: "xs",
  background: "bg.muted",
  color: "fg.default",
  transitionProperty: "background-color, border-color, color",
  transitionDuration: "fast",
  "&[data-full]": { borderColor: "fg.muted" },
  "[data-complete] &": { color: "success.fg" },
  "& svg": {
    width: "70%",
    height: "70%",
    stroke: "currentColor",
    strokeWidth: 2.4,
    strokeLinecap: "round",
    fill: "none",
    overflow: "visible",
  },
  "& line": {
    "--tick-easing": "token(easings.out)",
    strokeDasharray: "20",
    strokeDashoffset: "20",
    transition:
      "stroke-dashoffset var(--durations-fast) var(--easings-in), opacity var(--durations-fast) var(--easings-in)",
    _reducedMotion: { transition: "none" },
  },
  "& line[data-on]": {
    strokeDashoffset: "0",
    transition:
      "stroke-dashoffset var(--tick-duration) var(--tick-easing) calc(var(--tick-step, 0) * var(--tick-stagger)), opacity var(--tick-duration) var(--tick-easing) calc(var(--tick-step, 0) * var(--tick-stagger))",
    _reducedMotion: { transition: "none" },
  },
  // A pen speeds up and slows down, so one line after another reads as
  // strokes rather than a sweep.
  "[data-animation=sequence] &": {
    "& line": { "--tick-easing": "token(easings.inOut)" },
  },
  // Fade: the line starts half drawn and invisible, and fades in as it
  // finishes, so a short stagger still reads as separate marks.
  "[data-animation=fade] &": {
    "& line": { opacity: 0, strokeDashoffset: "10" },
    "& line[data-on]": { opacity: 1, strokeDashoffset: "0" },
  },
  "[data-animation=none] &": {
    "& line, & line[data-on]": { transition: "none" },
  },
});

export interface ProgressBoxesProps {
  /** 0 to 40. */
  ticks: number;
  /** Draws the marks in the success colour. */
  complete?: boolean;
  /**
   * How new ticks draw in (see TickAnimation). `sequence`, the default,
   * draws each line in tick order like a pen. Reduced motion shows the end
   * state at once.
   */
  animation?: TickAnimation;
  className?: string;
}

/**
 * Ten progress boxes, four ticks each. Purely visual (hidden from screen
 * readers); the owner names the value with role="progressbar" or text. New
 * marks draw themselves in; erased ones draw back out.
 */
export function ProgressBoxes(props: ProgressBoxesProps) {
  const {
    ticks: rawTicks,
    complete,
    animation = "sequence",
    className,
  } = props;
  const ticks = clampTicks(rawTicks);

  // The count before the latest change, kept as state (React's pattern for
  // a previous prop), so only ticks added by that change animate.
  const [change, setChange] = useState({ from: ticks, to: ticks });
  if (change.to !== ticks) setChange({ from: change.to, to: ticks });

  const plan = getTickAnimationPlan(animation, change.from, ticks);
  const boxes = getBoxTicks(ticks);
  const style = {
    "--tick-duration": `${plan.duration}ms`,
    "--tick-stagger": `${plan.stagger}ms`,
  } as CSSProperties;

  return (
    <div
      className={cx(trackStyles, className)}
      data-complete={complete || undefined}
      data-animation={animation}
      style={style}
      aria-hidden
    >
      {boxes.map((count, index) => (
        <div
          key={index}
          className={boxStyles}
          data-full={count === TICKS_PER_BOX || undefined}
        >
          <svg viewBox="0 0 20 20" focusable="false">
            {MARKS.map(([x1, y1, x2, y2], mark) => {
              const tick = index * TICKS_PER_BOX + mark;
              const step = tick < MAX_TICKS ? plan.steps[tick] : undefined;
              return (
                <line
                  key={mark}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  data-on={mark < count || undefined}
                  style={
                    step === undefined
                      ? undefined
                      : ({ "--tick-step": step } as CSSProperties)
                  }
                />
              );
            })}
          </svg>
        </div>
      ))}
    </div>
  );
}
