import { Progress as BaseProgress } from "@base-ui/react/progress";

import { LayoutProps, withLayoutProps } from "ui/styles/layoutProps";

import { css, cva, cx } from "styled-system/css";

import { VisuallyHidden } from "../VisuallyHidden";

const rootStyles = css({
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) auto",
  alignItems: "center",
  columnGap: "3",
  rowGap: "1.5",
  width: "100%",
  fontFamily: "body",
});

const trackStyles = cva({
  base: {
    gridColumn: "1 / -1",
    position: "relative",
    overflow: "hidden",
    width: "100%",
    borderRadius: "full",
    background: "bg.emphasized",
  },
  variants: {
    size: {
      sm: { height: "4px" },
      md: { height: "8px" },
    },
  },
  defaultVariants: { size: "sm" },
});

const indicatorStyles = cva({
  base: {
    display: "block",
    height: "100%",
    borderRadius: "full",
    background: "var(--progress-fill)",
    transition: "width token(durations.slow) token(easings.out)",
    _reducedMotion: { transition: "none" },
    "&[data-indeterminate]": {
      width: "40%",
      animation: "indeterminate 1.4s token(easings.inOut) infinite",
      _reducedMotion: {
        width: "100%",
        animation: "fadeIn 1s ease-in-out infinite alternate",
      },
    },
  },
  variants: {
    tone: {
      accent: { "--progress-fill": "{colors.accent.solid}" },
      success: { "--progress-fill": "{colors.success.fg}" },
      warning: { "--progress-fill": "{colors.warning.fg}" },
      danger: { "--progress-fill": "{colors.danger.solid}" },
    },
  },
  defaultVariants: { tone: "accent" },
});

const labelStyles = css({ fontSize: "sm", color: "fg.default" });
const valueStyles = css({
  fontSize: "sm",
  color: "fg.muted",
  fontVariantNumeric: "tabular-nums",
});

export interface ProgressProps extends LayoutProps {
  /** 0 to `max`. Leave it out (or pass null) while the amount is unknown. */
  value?: number | null;
  max?: number;
  /** Names the bar for screen readers, shown when `showLabel` is set. */
  label?: string;
  showLabel?: boolean;
  /** Shows the value beside the label, such as "40%". */
  showValue?: boolean;
  size?: "sm" | "md";
  tone?: "accent" | "success" | "warning" | "danger";
  className?: string;
}

/**
 * A linear progress bar, determinate or not. The page-loading bar is
 * `<Progress />`: indeterminate and named "Loading".
 */
export function Progress(props: ProgressProps) {
  const {
    value = null,
    max = 100,
    label = "Loading",
    showLabel = false,
    showValue = false,
    size,
    tone,
    className,
  } = withLayoutProps(props);

  return (
    <BaseProgress.Root
      value={value}
      max={max}
      className={cx(rootStyles, className)}
    >
      {showLabel ? (
        <BaseProgress.Label className={labelStyles}>{label}</BaseProgress.Label>
      ) : (
        <BaseProgress.Label render={<VisuallyHidden />}>
          {label}
        </BaseProgress.Label>
      )}
      {showValue && value !== null && (
        <BaseProgress.Value className={valueStyles} />
      )}
      <BaseProgress.Track className={trackStyles({ size })}>
        <BaseProgress.Indicator className={indicatorStyles({ tone })} />
      </BaseProgress.Track>
    </BaseProgress.Root>
  );
}
