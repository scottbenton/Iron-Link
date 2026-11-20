import { css, cx } from "styled-system/css";

import type { MeterTone } from "./ConditionMeter";

const meterNumberStyles = css({
  display: "inline-grid",
  justifyItems: "center",
  "& > *": { gridArea: "1 / 1" },
  "& > [data-meter-number-sizer]": { visibility: "hidden" },
});

/**
 * A meter's number at a fixed width: as wide as the widest value the meter
 * can hold (its min and max, formatted), so the box around it neither grows
 * at +10 nor shrinks at 0. The sizers are hidden copies in the same grid
 * cell, so the width follows the font rather than a guessed number.
 */
export function MeterNumber(props: {
  text: string;
  sizes: string[];
  className?: string;
  tone?: MeterTone;
}) {
  const { text, sizes, className, tone } = props;
  return (
    <span className={cx(meterNumberStyles, className)} data-tone={tone}>
      {sizes.map((size, index) => (
        <span key={index} data-meter-number-sizer="" aria-hidden>
          {size}
        </span>
      ))}
      <span>{text}</span>
    </span>
  );
}
