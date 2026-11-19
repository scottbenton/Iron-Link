import { mergeProps } from "@base-ui/react/merge-props";
import { Tooltip as BaseTooltip } from "@base-ui/react/tooltip";
import { useRender } from "@base-ui/react/use-render";
import {
  Children,
  ComponentProps,
  ReactElement,
  ReactNode,
  forwardRef,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

import { focusRing } from "ui/styles/focus";
import { LayoutProps, withLayoutProps } from "ui/styles/layoutProps";

import { css, cx } from "styled-system/css";

import { tooltipPopupStyles } from "../Tooltip";
import {
  scrollStripStyles,
  useScrollFade,
  useScrollSelectedIntoView,
} from "./scrollStrip";

const stripStyles = css({
  display: "flex",
  gap: "1",
  paddingInline: "2",
  // The hairline is drawn inside, so the current tab's bar can cover it
  // without leaving the scroller's clip box.
  boxShadow: "inset 0 -1px 0 token(colors.border.default)",
});

const pageTabStyles = css({
  position: "relative",
  flex: "none",
  display: "inline-flex",
  alignItems: "center",
  gap: "1.5",
  boxSizing: "border-box",
  paddingBlock: "13px 12px",
  paddingInline: "10px",
  borderRadius: "sm",
  color: "fg.muted",
  fontFamily: "body",
  fontWeight: "semibold",
  fontSize: "sm",
  lineHeight: "1.2",
  whiteSpace: "nowrap",
  textDecoration: "none",
  cursor: "pointer",
  WebkitTapHighlightColor: "transparent",
  transition: "color token(durations.fast) linear",
  outline: "none",
  _hover: { color: "fg.default" },
  _focusVisible: focusRing.inset,
  _touch: { minHeight: "touch" },
  "& > svg": { flex: "none", width: "icon.md", height: "icon.md" },
  // A portrait sits in the tab's line without making the tab taller.
  "& > [data-page-tab-avatar]": {
    display: "inline-flex",
    flex: "none",
    marginBlock: "-4px",
    marginInlineStart: "-2px",
  },
  "& > [data-page-tab-label]": {
    minWidth: 0,
    maxWidth: "var(--page-tab-max-label, 16em)",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  // The bar under the current page: the gradient, growing from the centre.
  // `background` resolves colour tokens only, so the gradient goes through
  // token(); a bare "gradients.ring" is written out as-is, which browsers
  // drop, and the bar never shows.
  _before: {
    content: '""',
    position: "absolute",
    insetInline: "6px",
    bottom: 0,
    height: "3px",
    borderRadius: "3px 3px 0 0",
    background: "token(gradients.ring)",
    scale: "0 1",
    transition: "scale token(durations.normal) token(easings.out)",
    pointerEvents: "none",
    _reducedMotion: { transition: "none" },
  },
  "&[aria-current=page]": {
    color: "fg.default",
    _before: { scale: "1 1" },
  },
});

export interface PageTabsProps extends ComponentProps<"nav">, LayoutProps {
  /** Names the navigation, such as "Game pages". */
  "aria-label": string;
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
    const { children, className, ...rest } = withLayoutProps(props);
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
      <nav ref={ref} className={className} {...rest}>
        <div ref={stripRef} className={cx(scrollStripStyles, stripStyles)}>
          {children}
        </div>
      </nav>
    );
  },
);

export interface PageTabProps extends Omit<ComponentProps<"a">, "ref"> {
  /** Whether this is the page being shown. */
  current?: boolean;
  /** An icon before the label. */
  icon?: ReactNode;
  /**
   * A small picture before the label, such as a character's portrait
   * (`<CharacterPortrait size="xs" decorative />`). It is hidden from
   * screen readers, so the tab's name stays the label alone.
   */
  avatar?: ReactNode;
  /**
   * Render as a router link: `render={<RouterLink to={path} />}`. Without
   * it the tab is an `<a>` with `href`.
   */
  render?: ReactElement;
}

/**
 * One link in `PageTabs`. A label longer than about 16em is cut short with
 * an ellipsis, and the whole label shows in a tooltip.
 */
export const PageTab = forwardRef<HTMLAnchorElement, PageTabProps>(
  function PageTab(props, ref) {
    const { current, icon, avatar, render, className, children, ...rest } =
      props;
    const labelRef = useRef<HTMLSpanElement>(null);
    const truncated = useIsTruncated(labelRef);
    const element = useRender({
      defaultTagName: "a",
      render,
      ref,
      props: mergeProps<"a">(
        {
          className: cx(pageTabStyles, className),
          "aria-current": current ? "page" : undefined,
          children: (
            <>
              {icon}
              {avatar && (
                <span data-page-tab-avatar="" aria-hidden>
                  {avatar}
                </span>
              )}
              <span ref={labelRef} data-page-tab-label="">
                {children}
              </span>
            </>
          ),
        },
        rest,
      ),
    });
    // The tooltip stays in the tree while unused, so the link is not
    // remounted (and focus lost) when the label starts or stops fitting.
    return (
      <BaseTooltip.Root disabled={!truncated}>
        <BaseTooltip.Trigger render={element} />
        <BaseTooltip.Portal>
          <BaseTooltip.Positioner side="bottom" sideOffset={6}>
            <BaseTooltip.Popup className={tooltipPopupStyles}>
              {children}
            </BaseTooltip.Popup>
          </BaseTooltip.Positioner>
        </BaseTooltip.Portal>
      </BaseTooltip.Root>
    );
  },
);

/** Whether the element's text is cut short, kept up to date on resize. */
function useIsTruncated(elementRef: { current: HTMLElement | null }) {
  const [truncated, setTruncated] = useState(false);
  useLayoutEffect(() => {
    const element = elementRef.current;
    if (!element) return;
    const measure = () =>
      setTruncated(element.scrollWidth > element.clientWidth + 1);
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [elementRef]);
  return truncated;
}
