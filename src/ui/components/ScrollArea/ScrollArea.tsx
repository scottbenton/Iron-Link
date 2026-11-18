import { ScrollArea as BaseScrollArea } from "@base-ui/react/scroll-area";
import { ReactNode, forwardRef } from "react";

import { LayoutProps, withLayoutProps } from "ui/styles/layoutProps";

import { css, cva, cx } from "styled-system/css";

const rootStyles = css({
  position: "relative",
  display: "flex",
  flexDirection: "column",
  minHeight: 0,
  minWidth: 0,
  boxSizing: "border-box",
});

const viewportStyles = cva({
  base: {
    flex: "1 1 auto",
    minHeight: 0,
    overscrollBehavior: "contain",
    outline: "none",
    borderRadius: "inherit",
    _focusVisible: {
      outline: "2px solid token(colors.focusRing)",
      outlineOffset: "-2px",
    },
  },
  variants: {
    fade: {
      // The edge that has more to show fades, growing with the distance.
      vertical: {
        maskImage:
          "linear-gradient(to bottom, transparent 0, black min(24px, var(--scroll-area-overflow-y-start, 0px)), black calc(100% - min(24px, var(--scroll-area-overflow-y-end, 24px))), transparent 100%)",
      },
      horizontal: {
        maskImage:
          "linear-gradient(to right, transparent 0, black min(24px, var(--scroll-area-overflow-x-start, 0px)), black calc(100% - min(24px, var(--scroll-area-overflow-x-end, 24px))), transparent 100%)",
      },
      none: {},
    },
  },
  defaultVariants: { fade: "none" },
});

const scrollbarStyles = css({
  display: "flex",
  boxSizing: "border-box",
  padding: "2px",
  opacity: 0,
  pointerEvents: "none",
  transition: "opacity token(durations.fast) linear",
  "&[data-orientation=vertical]": { width: "10px" },
  "&[data-orientation=horizontal]": { height: "10px", flexDirection: "column" },
  "&:is([data-hovering], [data-scrolling])": {
    opacity: 1,
    pointerEvents: "auto",
  },
  "&[data-scrolling]": { transitionDuration: "0s" },
});

const thumbStyles = css({
  flex: 1,
  borderRadius: "full",
  background: "color-mix(in oklab, token(colors.fg.default) 30%, transparent)",
  _hover: {
    background:
      "color-mix(in oklab, token(colors.fg.default) 45%, transparent)",
  },
});

export interface ScrollAreaProps extends LayoutProps {
  children: ReactNode;
  /** Which way it scrolls. Both draws both scrollbars. */
  orientation?: "vertical" | "horizontal" | "both";
  /** Fade the edge that has more to show. */
  fade?: boolean;
  /** Names the scrolling region, so keyboard users know what they reach. */
  "aria-label"?: string;
  /** Classes for the outer box: give it a height or max height here. */
  className?: string;
  /** Classes for the content inside the scrolling viewport. */
  contentClassName?: string;
}

/**
 * A scrolling box with thin overlay scrollbars that show on hover and while
 * scrolling. Give it a height (or max height) through `className`.
 */
export const ScrollArea = forwardRef<HTMLDivElement, ScrollAreaProps>(
  function ScrollArea(props, ref) {
    const {
      children,
      orientation = "vertical",
      fade = false,
      "aria-label": ariaLabel,
      className,
      contentClassName,
    } = withLayoutProps(props);
    const fadeVariant = !fade
      ? "none"
      : orientation === "horizontal"
        ? "horizontal"
        : "vertical";
    return (
      <BaseScrollArea.Root ref={ref} className={cx(rootStyles, className)}>
        <BaseScrollArea.Viewport
          aria-label={ariaLabel}
          role={ariaLabel ? "region" : undefined}
          className={viewportStyles({ fade: fadeVariant })}
        >
          <BaseScrollArea.Content className={contentClassName}>
            {children}
          </BaseScrollArea.Content>
        </BaseScrollArea.Viewport>
        {orientation !== "horizontal" && (
          <BaseScrollArea.Scrollbar
            orientation="vertical"
            className={scrollbarStyles}
          >
            <BaseScrollArea.Thumb className={thumbStyles} />
          </BaseScrollArea.Scrollbar>
        )}
        {orientation !== "vertical" && (
          <BaseScrollArea.Scrollbar
            orientation="horizontal"
            className={scrollbarStyles}
          >
            <BaseScrollArea.Thumb className={thumbStyles} />
          </BaseScrollArea.Scrollbar>
        )}
        {orientation === "both" && <BaseScrollArea.Corner />}
      </BaseScrollArea.Root>
    );
  },
);
