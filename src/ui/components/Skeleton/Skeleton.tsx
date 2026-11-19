import { CSSProperties } from "react";

import { LayoutProps, withLayoutProps } from "ui/styles/layoutProps";

import { css, cva, cx } from "styled-system/css";

const skeletonStyles = cva({
  base: {
    display: "block",
    boxSizing: "border-box",
    flex: "none",
    maxWidth: "100%",
    backgroundColor: "bg.emphasized",
    // A slow pulse; skeletons that appear together fade together.
    animation: "pulse 1.8s ease-in-out infinite",
    _reducedMotion: { animation: "none" },
  },
  variants: {
    variant: {
      /** A line of text: the height of the text around it. */
      text: { height: "1em", borderRadius: "xs", width: "100%" },
      circle: { borderRadius: "full", aspectRatio: "1", width: "40px" },
      rect: { borderRadius: "md", width: "100%", height: "80px" },
    },
  },
  defaultVariants: { variant: "text" },
});

const linesStyles = css({ display: "grid", gap: "2", width: "100%" });

export interface SkeletonProps extends Omit<LayoutProps, "width" | "height"> {
  variant?: "text" | "circle" | "rect";
  /** A CSS length or pixels. */
  width?: number | string;
  height?: number | string;
  /** For text, the number of lines; the last is shorter. */
  lines?: number;
  className?: string;
}

/**
 * A placeholder in the shape of content that is loading. It is hidden from
 * screen readers; say "Loading" once on the container, for example with
 * `aria-busy` and a Progress or a visually hidden status.
 */
export function Skeleton(props: SkeletonProps) {
  const {
    variant = "text",
    width,
    height,
    lines = 1,
    className,
  } = withLayoutProps(props, ["width", "height"]);
  const size: CSSProperties = { width, height };

  if (variant === "text" && lines > 1) {
    return (
      <span className={cx(linesStyles, className)} aria-hidden>
        {Array.from({ length: lines }, (_, index) => (
          <span
            key={index}
            className={skeletonStyles({ variant })}
            style={index === lines - 1 ? { height, width: "60%" } : size}
          />
        ))}
      </span>
    );
  }

  return (
    <span
      className={cx(skeletonStyles({ variant }), className)}
      style={size}
      aria-hidden
    />
  );
}
