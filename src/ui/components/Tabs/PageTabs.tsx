import {
  CSSProperties,
  Children,
  ComponentProps,
  ReactElement,
  ReactNode,
  forwardRef,
  useRef,
} from "react";

import { CssProp, withCssProp } from "ui/styles/cssProp";

import { cva, cx } from "styled-system/css";

import { useScrollFade } from "../../hooks/useScrollFade";
import { useScrollSelectedIntoView } from "../../hooks/useScrollSelectedIntoView";
import { PageTabProps } from "./PageTab";
import { PageTabsVariant } from "./pageTabsTypes";
import { PageTabsVariantContext } from "./pageTabsVariantContext";
import { scrollStripStyles } from "./scrollStrip";

// The strip's inline padding: `gap` in from the edge of a centred column
// `--page-tabs-content-width` wide, or of the strip when none is set.
function insetFrom(gap: string) {
  return `max(${gap}, calc((100% - var(--page-tabs-content-width, 100%)) / 2 + ${gap}))`;
}

const stripStyles = cva({
  base: { display: "flex", gap: "1" },
  variants: {
    variant: {
      underline: {
        paddingInline: insetFrom("token(spacing.2)"),
        // The hairline is drawn inside, so the current tab's bar can cover
        // it without leaving the scroller's clip box.
        boxShadow: "inset 0 -1px 0 token(colors.border.default)",
      },
      // The section tabs' well: a canvas band, edge to edge, with room
      // under the chips for the current one's ledge, which the scroller
      // would otherwise clip.
      well: {
        paddingBlockStart: "1.5",
        paddingInline: insetFrom("token(spacing.1.5)"),
        paddingBottom: "calc(token(spacing.1.5) + var(--border-widths-ledge))",
        background: "bg.canvas",
        boxShadow: "inset 0 -1px 0 token(colors.border.default)",
      },
    },
  },
  defaultVariants: { variant: "underline" },
});

export interface PageTabsProps extends ComponentProps<"nav">, CssProp {
  /** Names the navigation, such as "Game pages". */
  "aria-label": string;
  /**
   * Underline (the default) for a page's main tabs; Well for a second row
   * under them, so the two rows read as different levels.
   */
  variant?: PageTabsVariant;
  /**
   * The width of a centred column the page's content sits in. The band and
   * its hairline still run the strip's full width, and the tabs line up with
   * the column's edge.
   */
  contentWidth?: string;
  children: ReactNode;
}

/**
 * The top-level tabs of a page, such as a game's Character, Overview, Notes
 * and World. They are links that move between pages, so they sit in a
 * `nav` and the current one says `aria-current="page"`; Tab moves between
 * them like any links. The strip scrolls sideways when it runs out of room,
 * fading the edge that has more, and keeps the current tab in view.
 */
export const PageTabs = forwardRef<HTMLElement, PageTabsProps>(
  function PageTabs(props, ref) {
    const {
      variant = "underline",
      contentWidth,
      children,
      className,
      style,
      ...rest
    } = withCssProp(props);
    const stripRef = useRef<HTMLDivElement>(null);
    useScrollFade(stripRef);
    // Re-run when the tabs change, so a new current tab is scrolled to.
    const currentKey = Children.toArray(children)
      .map((child) =>
        (child as ReactElement<PageTabProps>)?.props?.current ? 1 : 0,
      )
      .join("");
    useScrollSelectedIntoView(stripRef, "[aria-current=page]", currentKey);

    return (
      <PageTabsVariantContext.Provider value={variant}>
        <nav
          ref={ref}
          className={className}
          style={
            contentWidth
              ? ({
                  ...style,
                  "--page-tabs-content-width": contentWidth,
                } as CSSProperties)
              : style
          }
          {...rest}
        >
          <div
            ref={stripRef}
            className={cx(scrollStripStyles, stripStyles({ variant }))}
          >
            {children}
          </div>
        </nav>
      </PageTabsVariantContext.Provider>
    );
  },
);
