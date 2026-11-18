import { css, cx } from "styled-system/css";

import { getBoxTicks } from "./progress";

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
    strokeDasharray: "20",
    strokeDashoffset: "20",
    transition: "stroke-dashoffset var(--durations-fast) var(--easings-in)",
    _reducedMotion: { transition: "none" },
  },
  "& line[data-on]": {
    strokeDashoffset: "0",
    transition: "stroke-dashoffset var(--durations-slow) var(--easings-out)",
    _reducedMotion: { transition: "none" },
  },
});

export interface ProgressBoxesProps {
  /** 0 to 40. */
  ticks: number;
  /** Draws the marks in the success colour. */
  complete?: boolean;
  className?: string;
}

/**
 * Ten progress boxes, four ticks each. Purely visual (hidden from screen
 * readers); the owner names the value with role="progressbar" or text. A new
 * mark draws itself in; an erased one draws back out.
 */
export function ProgressBoxes(props: ProgressBoxesProps) {
  const { ticks, complete, className } = props;
  const boxes = getBoxTicks(ticks);
  return (
    <div
      className={cx(trackStyles, className)}
      data-complete={complete || undefined}
      aria-hidden
    >
      {boxes.map((count, index) => (
        <div
          key={index}
          className={boxStyles}
          data-full={count === 4 || undefined}
        >
          <svg viewBox="0 0 20 20" focusable="false">
            {MARKS.map(([x1, y1, x2, y2], mark) => (
              <line
                key={mark}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                data-on={mark < count || undefined}
              />
            ))}
          </svg>
        </div>
      ))}
    </div>
  );
}
