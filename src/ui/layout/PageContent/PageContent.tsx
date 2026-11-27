import { ComponentProps, ElementType, ReactNode } from "react";

import { css, cx } from "styled-system/css";

import { CssProp, withCssProp } from "../../styles/cssProp";
import { PageWidth, contentRailStyles } from "../shared/contentRail";
import { pageInset } from "../shared/shell";

const bodyRailStyles = css({
  display: "flex",
  flexDirection: "column",
  flex: "1 0 auto",
});

const pageContentStyles = css({
  boxSizing: "border-box",
  display: "flex",
  flexDirection: "column",
  flex: "1 0 auto",
  minWidth: 0,
  paddingBlockStart: "2",
  paddingBlockEnd: "8",
  background: "bg.surface",
});

export interface PageContentProps
  extends Omit<ComponentProps<"div">, "children">,
    Omit<CssProp, "maxWidth"> {
  children?: ReactNode;
  /**
   * The rail's width: xl 1440px (default), md 960px for reading, sm 640px
   * for forms, xs 480px for a single short form such as sign in.
   */
  maxWidth?: PageWidth;
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
    as: Element = "div",
    className,
    ...rest
  } = withCssProp(props);

  return (
    <Element className={cx(pageContentStyles, pageInset, className)} {...rest}>
      <div className={cx(contentRailStyles({ maxWidth }), bodyRailStyles)}>
        {children}
      </div>
    </Element>
  );
}
