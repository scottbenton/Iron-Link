import { ComponentProps, forwardRef } from "react";

import { css, cx } from "styled-system/css";

const handleStyles = css({
  position: "absolute",
  zIndex: 1,
  // The target is larger than the square it draws, and touch-sized on touch
  // devices. It reaches into the frame from the corner, so nothing is drawn
  // outside it, where a scrolling column would clip it.
  width: "24px",
  height: "24px",
  maxWidth: "50%",
  maxHeight: "50%",
  padding: 0,
  margin: 0,
  border: "none",
  background: "none",
  display: "flex",
  touchAction: "none",
  outline: "none",
  WebkitTapHighlightColor: "transparent",
  opacity: 0,
  pointerEvents: "none",
  transition: "opacity token(durations.fast) linear",
  _touch: { width: "touch", height: "touch" },
  // Over a 2px frame border, so the square sits on the corner.
  "&[data-vertical=top]": { top: "-2px", alignItems: "flex-start" },
  "&[data-vertical=bottom]": { bottom: "-2px", alignItems: "flex-end" },
  "&[data-horizontal=left]": { left: "-2px", justifyContent: "flex-start" },
  "&[data-horizontal=right]": { right: "-2px", justifyContent: "flex-end" },
  "&[data-vertical=top][data-horizontal=left], &[data-vertical=bottom][data-horizontal=right]":
    { cursor: "nwse-resize" },
  "&[data-vertical=top][data-horizontal=right], &[data-vertical=bottom][data-horizontal=left]":
    { cursor: "nesw-resize" },
  "&[data-shown], &:focus-visible": { opacity: 1, pointerEvents: "auto" },
  "@media (hover: hover)": {
    "[data-corner-handles]:hover &": { opacity: 1, pointerEvents: "auto" },
  },
  _after: {
    content: '""',
    display: "block",
    flexShrink: 0,
    width: "12px",
    height: "12px",
    boxSizing: "border-box",
    background: "accent.solid",
    border: "1px solid white",
    boxShadow: "popover",
    transition: "transform token(durations.fast) linear",
    _reducedMotion: { transition: "none" },
  },
  "&:hover::after, &[data-dragging]::after": { transform: "scale(1.2)" },
  // Two rings, so the focus shows on light and dark pictures alike.
  "&:focus-visible::after": {
    transform: "scale(1.2)",
    boxShadow: "0 0 0 2px white, 0 0 0 4px token(colors.accent.solid)",
  },
});

export interface CornerHandleProps
  extends Omit<ComponentProps<"button">, "ref" | "type"> {
  vertical: "top" | "bottom";
  horizontal: "left" | "right";
  /**
   * Shows the handle. Hidden handles still show while the pointer is over
   * the element marked `data-corner-handles`, and while focused.
   */
  shown?: boolean;
  /** Draws the handle as held, while it is dragged. */
  dragging?: boolean;
}

/**
 * A square handle on one corner of a resizable frame, such as an image in a
 * note. Put four in a frame with `position: relative` and a 2px border. It
 * only draws; the caller handles the pointer, and gives the handle the
 * keyboard uses a `slider` role and name.
 */
export const CornerHandle = forwardRef<HTMLButtonElement, CornerHandleProps>(
  function CornerHandle(props, ref) {
    const { vertical, horizontal, shown, dragging, className, ...rest } = props;
    return (
      <button
        ref={ref}
        type="button"
        className={cx(handleStyles, className)}
        data-vertical={vertical}
        data-horizontal={horizontal}
        data-shown={shown ? "" : undefined}
        data-dragging={dragging ? "" : undefined}
        {...rest}
      />
    );
  },
);
