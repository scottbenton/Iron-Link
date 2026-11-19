import { CSSProperties, useState } from "react";

import { LayoutProps, withLayoutProps } from "ui/styles/layoutProps";

import { css, cx } from "styled-system/css";

import { PROGRESS_BOX_MARKS } from "../shared";
import { MAX_TICKS, TICKS_PER_BOX, clampTicks, getBoxTicks } from "./progress";
import { getTickAnimationPlan } from "./tickAnimation";

const trackStyles = css({
  display: "grid",
  gridTemplateColumns: "repeat(10, minmax(0, 1fr))",
  gap: "3px",
  maxWidth: "var(--progress-boxes-max-width, 420px)",
});

/**
 * A line is a 20 unit dash pushed off its own length, so moving the dash
 * offset to 0 draws it from its start. Lines new in the latest change
 * (`data-drawing`) draw in tick order, like a pen, over `--tick-duration`,
 * each waiting its `--tick-step` times `--tick-stagger` (set by
 * getTickAnimationPlan, which keeps the whole change within 240ms). They
 * ease out: most of the stroke lands at once, so even a quick tap shows a
 * mark. Every other drawn line has no transition, so when the next change
 * comes before a line finishes, dropping `data-drawing` cancels its
 * transition and it shows fully drawn: under rapid taps the drawn lines
 * always match the value and only the newest one moves. Erased lines all
 * draw back out at once, quickly.
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
    strokeDasharray: "20",
    strokeDashoffset: "20",
    transition: "stroke-dashoffset var(--durations-fast) var(--easings-in)",
    _reducedMotion: { transition: "none" },
  },
  "& line[data-on]": {
    strokeDashoffset: "0",
    transition: "none",
  },
  "& line[data-on][data-drawing]": {
    transition:
      "stroke-dashoffset var(--tick-duration) token(easings.out) calc(var(--tick-step, 0) * var(--tick-stagger))",
    _reducedMotion: { transition: "none" },
  },
});

export interface ProgressBoxesProps extends LayoutProps {
  /** 0 to 40. */
  ticks: number;
  /** The track is completed; the marks keep their usual colour. */
  complete?: boolean;
  className?: string;
}

/**
 * Ten progress boxes, four ticks each. Purely visual (hidden from screen
 * readers); the owner names the value with role="progressbar" or text. New
 * marks draw themselves in; erased ones draw back out. Reduced motion shows
 * the end state at once.
 */
export function ProgressBoxes(props: ProgressBoxesProps) {
  const { ticks: rawTicks, complete, className } = withLayoutProps(props);
  const ticks = clampTicks(rawTicks);

  // The count before the latest change, kept as state (React's pattern for
  // a previous prop), so only ticks added by that change animate.
  const [change, setChange] = useState({ from: ticks, to: ticks });
  if (change.to !== ticks) setChange({ from: change.to, to: ticks });

  const plan = getTickAnimationPlan(change.from, ticks);
  const boxes = getBoxTicks(ticks);
  const style = {
    "--tick-duration": `${plan.duration}ms`,
    "--tick-stagger": `${plan.stagger}ms`,
  } as CSSProperties;

  return (
    <div
      className={cx(trackStyles, className)}
      data-complete={complete || undefined}
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
            {PROGRESS_BOX_MARKS.map(([x1, y1, x2, y2], mark) => {
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
                  data-drawing={step === undefined ? undefined : ""}
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
