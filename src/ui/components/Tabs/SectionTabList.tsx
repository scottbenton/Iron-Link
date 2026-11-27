import { Tabs as BaseTabs } from "@base-ui/react/tabs";
import {
  ComponentProps,
  ReactNode,
  forwardRef,
  useImperativeHandle,
  useRef,
} from "react";

import { CssProp, withCssProp } from "ui/styles/cssProp";
import { ledgeLayers } from "ui/styles/ledge";

import { cva, cx } from "styled-system/css";

import { useScrollFade } from "../../hooks/useScrollFade";
import { scrollStripStyles } from "./scrollStrip";
import {
  SectionTabsAlign,
  SectionTabsSize,
  SectionTabsVariant,
} from "./sectionTabsTypes";
import { useKeepSelectedTabInView } from "./useKeepSelectedTabInView";
import { VariantContext } from "./variantContext";

const listStyles = cva({
  base: {
    position: "relative",
    display: "flex",
    alignItems: "stretch",
    boxSizing: "border-box",
    fontFamily: "body",
  },
  variants: {
    variant: {
      /** Text on a hairline, the current section underlined in body colour. */
      underline: {
        gap: "4",
        justifyContent: "flex-start",
        boxShadow: "inset 0 -1px 0 token(colors.border.default)",
      },
      /**
       * Chips in a well: a canvas band across the column, edge to edge, the
       * current section a raised card on it. The same band, chips and
       * spacing as the note tabs, so a column's tabs and the open notes
       * read as one family.
       */
      well: {
        gap: "1",
        justifyContent: "flex-start",
        boxSizing: "border-box",
        padding: "1.5",
        paddingBottom: "calc(token(spacing.1.5) + var(--border-widths-ledge))",
        background: "bg.canvas",
        borderBottom: "1px solid token(colors.border.default)",
        // Centred: auto margins on the end tabs, which fall to zero once the
        // tabs fill the row, so nothing is pushed out of reach on the left.
        // `align="start"` keeps them at the start instead.
        "&:not([data-align=start]) > [role=tab]:first-of-type": {
          marginInlineStart: "auto",
        },
        "&:not([data-align=start]) > [role=tab]:last-of-type": {
          marginInlineEnd: "auto",
        },
        // Inside a SectionTabWell the well draws the band.
        "[data-section-tab-well] > &": {
          background: "transparent",
          borderBottom: "none",
        },
      },
    },
  },
  defaultVariants: { variant: "well" },
});

const indicatorStyles = cva({
  base: {
    position: "absolute",
    zIndex: 0,
    left: 0,
    boxSizing: "border-box",
    width: "var(--active-tab-width)",
    translate: "var(--active-tab-left) 0",
    pointerEvents: "none",
    transitionProperty: "translate, width",
    transitionDuration: "normal",
    transitionTimingFunction: "out",
    _reducedMotion: { transition: "none" },
  },
  variants: {
    variant: {
      underline: {
        bottom: 0,
        height: "2px",
        borderRadius: "2px",
        background: "fg.default",
      },
      well: {
        top: "token(spacing.1.5)",
        bottom: "calc(token(spacing.1.5) + var(--border-widths-ledge))",
        borderRadius: "md",
        border: "1px solid transparent",
        ...ledgeLayers(),
        "--ledge-face": "{colors.bg.surface}",
        "--ledge-border": "{colors.border.default}",
        "--ledge-edge": "{colors.border.edge}",
      },
    },
  },
  defaultVariants: { variant: "well" },
});

export interface SectionTabListProps
  extends Omit<ComponentProps<typeof BaseTabs.List>, "className">,
    CssProp {
  /** Names the tab set, such as "Character sections". */
  "aria-label"?: string;
  /**
   * Well (the default: the note tabs' chips, centred in an edge-to-edge
   * canvas band) or Underline (like the page tabs, in body colour, on a
   * hairline). The current tab's marker slides between tabs in both.
   */
  variant?: SectionTabsVariant;
  /**
   * Medium, or large: 48px tall at any pointer and wider, for tabs that
   * head a whole phone screen.
   */
  size?: SectionTabsSize;
  /**
   * Where a well's tabs sit: centred (the default, as the game page's
   * columns have them) or at the start, for a well across a wide panel.
   * Underline tabs always sit at the start.
   */
  align?: SectionTabsAlign;
  /**
   * Select a tab as arrow keys reach it. On by default, since section
   * panels are cheap to show; turn it off for panels that load.
   */
  activateOnFocus?: boolean;
  className?: string;
  children: ReactNode;
}

/**
 * The tabs that switch the main parts of a section, such as a character
 * sheet's Overview, Assets and Tracks. Arrow keys, Home and End move between
 * tabs. Tabs that don't fit scroll sideways, their edges fading, rather than
 * running under whatever sits beside the list.
 */
export const SectionTabList = forwardRef<HTMLDivElement, SectionTabListProps>(
  function SectionTabList(props, ref) {
    const {
      variant = "well",
      size = "md",
      align = "center",
      activateOnFocus = true,
      className,
      children,
      ...rest
    } = withCssProp(props);
    const listRef = useRef<HTMLDivElement>(null);
    useImperativeHandle(ref, () => listRef.current as HTMLDivElement);
    useScrollFade(listRef);
    useKeepSelectedTabInView(listRef);
    return (
      <VariantContext.Provider value={{ variant, size }}>
        <BaseTabs.List
          ref={listRef}
          activateOnFocus={activateOnFocus}
          className={cx(scrollStripStyles, listStyles({ variant }), className)}
          data-align={align}
          {...rest}
        >
          <BaseTabs.Indicator className={indicatorStyles({ variant })} />
          {children}
        </BaseTabs.List>
      </VariantContext.Provider>
    );
  },
);
