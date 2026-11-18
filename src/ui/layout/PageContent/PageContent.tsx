import { ComponentProps, ElementType, ReactNode } from "react";

import { css, cva, cx } from "styled-system/css";

import { PageWidth, contentRailStyles } from "../shared/contentRail";
import { pageInset } from "../shared/shell";

const bodyRailStyles = css({
  display: "flex",
  flexDirection: "column",
  flex: "1 0 auto",
});

const pageContentStyles = cva({
  base: {
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
    flex: "1 0 auto",
    minWidth: 0,
  },
  variants: {
    paddingBlock: {
      none: {},
      sm: { paddingBlock: "4" },
      md: { paddingBlockStart: "2", paddingBlockEnd: "8" },
    },
    surface: {
      /** The page's surface, the default. */
      surface: { background: "bg.surface" },
      /** The canvas, for pages of cards. */
      canvas: { background: "bg.canvas" },
      none: {},
    },
  },
  defaultVariants: { paddingBlock: "md", surface: "surface" },
});

export interface PageContentProps
  extends Omit<ComponentProps<"div">, "children"> {
  children?: ReactNode;
  /** The rail's width: sm 640, md 900, lg 1200, xl 1440 (default), full. */
  maxWidth?: PageWidth;
  /** Space above and below. */
  paddingBlock?: "none" | "sm" | "md";
  /** Drop the side insets, for content that runs to the edges. */
  disableInset?: boolean;
  surface?: "surface" | "canvas" | "none";
  /** The element; a section of `<main>` by default. */
  as?: ElementType;
}

/**
 * A page's body: the same side insets as its header (16, 24 and 32px as the
 * shell widens) and a centred rail, so headers and content line up.
 */
export function PageContent(props: PageContentProps) {
  const {
    children,
    maxWidth,
    paddingBlock,
    disableInset,
    surface,
    as: Element = "div",
    className,
    ...rest
  } = props;

  return (
    <Element
      className={cx(
        pageContentStyles({ paddingBlock, surface }),
        !disableInset && pageInset,
        className,
      )}
      {...rest}
    >
      <div className={cx(contentRailStyles({ maxWidth }), bodyRailStyles)}>
        {children}
      </div>
    </Element>
  );
}
