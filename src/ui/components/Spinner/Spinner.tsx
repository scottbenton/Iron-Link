import { ComponentProps } from "react";

import { CssProp, withCssProp } from "ui/styles/cssProp";

import { css, cx } from "styled-system/css";

const spinner = css({
  display: "inline-block",
  flex: "none",
  width: "var(--spinner-size, 14px)",
  height: "var(--spinner-size, 14px)",
  borderRadius: "full",
  border: "2px solid currentColor",
  borderRightColor: "transparent",
  animation: "ringSpin 700ms linear infinite",
});

export interface SpinnerProps extends ComponentProps<"span">, CssProp {
  /** Diameter in pixels. */
  size?: number;
  /** Read by screen readers. Leave empty when a label nearby says it. */
  label?: string;
}

/** A small busy indicator. Decorative unless given a label. */
export function Spinner(props: SpinnerProps) {
  const { size = 14, label, className, style, ...rest } = withCssProp(props);
  return (
    <span
      className={cx(spinner, className)}
      style={{ ["--spinner-size" as string]: `${size}px`, ...style }}
      role={label ? "status" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      {...rest}
    />
  );
}
