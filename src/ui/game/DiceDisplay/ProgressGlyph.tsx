import { css } from "styled-system/css";

import { PROGRESS_BOX_MARKS } from "../shared/progressBoxMarks";

/**
 * A full progress box (all four marks), for the progress score. The marks
 * sit at 70% of the box, as in ProgressBoxes, so they stop short of its edge.
 */
export function ProgressGlyph() {
  return (
    <svg
      viewBox="0 0 20 20"
      aria-hidden
      focusable="false"
      className={css({
        stroke: "currentColor",
        strokeWidth: 2.4,
        strokeLinecap: "round",
        fill: "none",
      })}
    >
      <rect x="1" y="1" width="18" height="18" rx="3" strokeWidth="1.5" />
      <g transform="translate(3 3) scale(0.7)">
        {PROGRESS_BOX_MARKS.map(([x1, y1, x2, y2], index) => (
          <line key={index} x1={x1} y1={y1} x2={x2} y2={y2} />
        ))}
      </g>
    </svg>
  );
}
