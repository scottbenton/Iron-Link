import { mergeProps } from "@base-ui/react/merge-props";
import { Tooltip as BaseTooltip } from "@base-ui/react/tooltip";
import { useRender } from "@base-ui/react/use-render";
import {
  ComponentProps,
  ReactElement,
  ReactNode,
  forwardRef,
  useContext,
  useRef,
} from "react";

import { focusRing } from "ui/styles/focus";
import { ledgeLayers } from "ui/styles/ledge";

import { cva, cx } from "styled-system/css";

import { useIsTruncated } from "../../hooks/useIsTruncated";
import { tooltipPopupStyles } from "../Tooltip";
import { PageTabsVariantContext } from "./pageTabsVariantContext";

const pageTabStyles = cva({
  base: {
    position: "relative",
    flex: "none",
    display: "inline-flex",
    alignItems: "center",
    gap: "1.5",
    boxSizing: "border-box",
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
    "&[aria-current=page]": { color: "fg.default" },
  },
  variants: {
    variant: {
      underline: {
        paddingBlock: "13px 12px",
        paddingInline: "10px",
        borderRadius: "sm",
        _focusVisible: focusRing.inset,
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
        "&[aria-current=page]": { _before: { scale: "1 1" } },
      },
      // The section tabs' well chip: 34px, 44px on touch, the current page
      // a raised card.
      well: {
        minHeight: "34px",
        paddingInline: "3",
        border: "1px solid transparent",
        borderRadius: "md",
        transition:
          "color token(durations.fast) linear, background-color token(durations.fast) linear",
        _focusVisible: focusRing.inset,
        "&:hover:not([aria-current=page])": { background: "overlay.hover" },
        _touch: { paddingInline: "14px" },
        "&[aria-current=page]": {
          ...ledgeLayers(),
          "--ledge-face": "{colors.bg.surface}",
          "--ledge-border": "{colors.border.default}",
          "--ledge-edge": "{colors.border.edge}",
        },
      },
    },
  },
  defaultVariants: { variant: "underline" },
});

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
    const variant = useContext(PageTabsVariantContext);
    const labelRef = useRef<HTMLSpanElement>(null);
    const truncated = useIsTruncated(labelRef);
    const element = useRender({
      defaultTagName: "a",
      render,
      ref,
      props: mergeProps<"a">(
        {
          className: cx(pageTabStyles({ variant }), className),
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
