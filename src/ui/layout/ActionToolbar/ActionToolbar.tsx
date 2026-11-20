import { Toolbar } from "@base-ui/react/toolbar";
import { ReactNode, useLayoutEffect, useRef } from "react";

import { css, cx } from "styled-system/css";

import { CssProp, withCssProp } from "../../styles/cssProp";

const rootStyles = css({
  boxSizing: "border-box",
  display: "flex",
  flexDirection: "column",
  gap: "2",
  minWidth: 0,
  fontFamily: "body",
});

const stripStyles = css({
  boxSizing: "border-box",
  display: "flex",
  minWidth: 0,
  padding: "1",
  borderRadius: "md",
  background: "bg.emphasized",
  overflowX: "auto",
  scrollbarWidth: "none",
  "&::-webkit-scrollbar": { display: "none" },
  // Faded at an edge while more of the row lies past it. The mask is on the
  // scroller, so it works on any background and never takes a tap.
  "&[data-fade-start]": {
    maskImage: "linear-gradient(to right, transparent, #000 24px)",
  },
  "&[data-fade-end]": {
    maskImage: "linear-gradient(to right, #000 calc(100% - 24px), transparent)",
  },
  "&[data-fade-start][data-fade-end]": {
    maskImage:
      "linear-gradient(to right, transparent, #000 24px, #000 calc(100% - 24px), transparent)",
  },
  "&[data-wrap]": { overflowX: "visible", maskImage: "none" },
});

const rowStyles = css({
  display: "flex",
  alignItems: "center",
  gap: "0.5",
  flex: "none",
  minWidth: "100%",
  "[data-wrap] > &": { flexWrap: "wrap", flex: "1 1 auto", minWidth: 0 },
});

/** Marks the strip's edges that have more of the row beyond them. */
function useScrollFade(enabled: boolean) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const scroller = scrollerRef.current;
    const row = rowRef.current;
    if (!enabled || !scroller || !row) return;

    const update = () => {
      // Within a pixel of an edge counts as at it: scroll positions can be
      // fractional while widths are whole. abs() covers right-to-left.
      const scrollStart = Math.abs(scroller.scrollLeft);
      const hasStart = scrollStart > 1;
      const hasEnd =
        scrollStart + scroller.clientWidth < scroller.scrollWidth - 1;
      scroller.toggleAttribute("data-fade-start", hasStart);
      scroller.toggleAttribute("data-fade-end", hasEnd);
    };

    update();
    scroller.addEventListener("scroll", update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(scroller);
    observer.observe(row);
    return () => {
      scroller.removeEventListener("scroll", update);
      observer.disconnect();
      scroller.removeAttribute("data-fade-start");
      scroller.removeAttribute("data-fade-end");
    };
  }, [enabled]);

  return { scrollerRef, rowRef };
}

export interface ActionToolbarProps extends CssProp {
  /** The toolbar's name, such as "Note actions". */
  label: string;
  /** Above the strip, such as Breadcrumbs to the open note. */
  breadcrumbs?: ReactNode;
  /** ActionToolbarButton, ActionToolbarIconButton, groups and separators. */
  children?: ReactNode;
  /**
   * Wrap actions that don't fit onto more rows instead of scrolling them
   * sideways, for strips whose actions should all stay in view.
   */
  wrap?: boolean;
  className?: string;
}

/**
 * Breadcrumbs over a strip of actions for the open item (a note, a folder,
 * a world entry). The strip is one Tab stop; arrow keys move along it, and
 * actions that don't fit scroll sideways with a fade at the clipped edge.
 */
export function ActionToolbar(props: ActionToolbarProps) {
  const {
    label,
    breadcrumbs,
    children,
    wrap = false,
    className,
  } = withCssProp(props);
  const { scrollerRef, rowRef } = useScrollFade(!wrap && !!children);

  return (
    <div className={cx(rootStyles, className)}>
      {breadcrumbs}
      {children && (
        <Toolbar.Root
          ref={scrollerRef}
          aria-label={label}
          className={stripStyles}
          data-wrap={wrap || undefined}
        >
          <div ref={rowRef} className={rowStyles}>
            {children}
          </div>
        </Toolbar.Root>
      )}
    </div>
  );
}
