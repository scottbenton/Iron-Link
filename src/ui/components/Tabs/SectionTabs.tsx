import { Tabs as BaseTabs } from "@base-ui/react/tabs";
import {
  ComponentProps,
  ReactNode,
  createContext,
  forwardRef,
  useContext,
} from "react";

import { focusRing } from "ui/styles/focus";
import { LayoutProps, withLayoutProps } from "ui/styles/layoutProps";

import { css, cva, cx } from "styled-system/css";

type BaseRootProps = ComponentProps<typeof BaseTabs.Root>;

export interface TabsProps
  extends Omit<BaseRootProps, "className">,
    LayoutProps {
  className?: string;
}

/**
 * Holds a set of tabs and their panels: `SectionTabList` with `SectionTab`s,
 * then a `TabPanel` per tab. Controlled with `value` and `onValueChange`, or
 * uncontrolled with `defaultValue`.
 */
export const Tabs = forwardRef<HTMLDivElement, TabsProps>(
  function Tabs(props, ref) {
    const { className, ...rest } = withLayoutProps(props);
    return <BaseTabs.Root ref={ref} className={className} {...rest} />;
  },
);

export type SectionTabsVariant = "well" | "underline";

export type SectionTabsSize = "md" | "lg";

const VariantContext = createContext<{
  variant: SectionTabsVariant;
  size: SectionTabsSize;
}>({ variant: "well", size: "md" });

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
        "& > [role=tab]:first-of-type": { marginInlineStart: "auto" },
        "& > [role=tab]:last-of-type": { marginInlineEnd: "auto" },
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

const tabStyles = cva({
  base: {
    position: "relative",
    zIndex: 1,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "1.5",
    boxSizing: "border-box",
    margin: 0,
    border: 0,
    background: "transparent",
    cursor: "pointer",
    color: "fg.muted",
    fontFamily: "body",
    fontWeight: "semibold",
    fontSize: "sm",
    lineHeight: "1.2",
    whiteSpace: "nowrap",
    userSelect: "none",
    WebkitTapHighlightColor: "transparent",
    transition:
      "color token(durations.fast) linear, background-color token(durations.fast) linear",
    outline: "none",
    _hover: { color: "fg.default" },
    "&[aria-selected=true]": { color: "fg.default" },
    _focusVisible: focusRing.outset,
    _disabled: { cursor: "not-allowed", color: "fg.disabled" },
    "& svg": { flex: "none", width: "16px", height: "16px" },
  },
  variants: {
    variant: {
      underline: {
        flex: "none",
        minHeight: "38px",
        paddingInline: "0.5",
        borderRadius: "xs",
        _focusVisible: { outlineOffset: "-2px" },
        _touch: { minHeight: "touch" },
      },
      // NoteTabs' chip: 34px with its transparent border, 44px on touch.
      well: {
        flex: "none",
        minHeight: "34px",
        paddingInline: "3",
        borderRadius: "md",
        "&:hover:not([aria-selected=true])": { background: "overlay.hover" },
        _focusVisible: { outlineOffset: "-2px" },
        _touch: { minHeight: "touch", paddingInline: "14px" },
      },
    },
    size: {
      md: {},
      lg: {},
    },
  },
  compoundVariants: [
    // Large: 48px at any pointer, as the phone screens' tabs are.
    {
      size: "lg",
      css: {
        minHeight: "48px",
        paddingInline: "4",
        _touch: { minHeight: "48px" },
      },
    },
    {
      size: "lg",
      variant: "underline",
      css: { paddingInline: "2" },
    },
  ],
  defaultVariants: { variant: "well", size: "md" },
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
        background: "bg.surface",
        border: "1px solid token(colors.border.default)",
        boxShadow: "ledge",
      },
    },
  },
  defaultVariants: { variant: "well" },
});

export interface SectionTabListProps
  extends Omit<ComponentProps<typeof BaseTabs.List>, "className">,
    LayoutProps {
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
 * tabs.
 */
export const SectionTabList = forwardRef<HTMLDivElement, SectionTabListProps>(
  function SectionTabList(props, ref) {
    const {
      variant = "well",
      size = "md",
      activateOnFocus = true,
      className,
      children,
      ...rest
    } = withLayoutProps(props);
    return (
      <VariantContext.Provider value={{ variant, size }}>
        <BaseTabs.List
          ref={ref}
          activateOnFocus={activateOnFocus}
          className={cx(listStyles({ variant }), className)}
          {...rest}
        >
          <BaseTabs.Indicator className={indicatorStyles({ variant })} />
          {children}
        </BaseTabs.List>
      </VariantContext.Provider>
    );
  },
);

export interface SectionTabProps
  extends Omit<ComponentProps<typeof BaseTabs.Tab>, "className"> {
  /** An icon before the label. */
  icon?: ReactNode;
  className?: string;
}

/** One tab in a `SectionTabList`. */
export const SectionTab = forwardRef<HTMLButtonElement, SectionTabProps>(
  function SectionTab(props, ref) {
    const { icon, className, children, ...rest } = props;
    const { variant, size } = useContext(VariantContext);
    return (
      <BaseTabs.Tab
        ref={ref}
        className={cx(tabStyles({ variant, size }), className)}
        {...rest}
      >
        {icon}
        {children}
      </BaseTabs.Tab>
    );
  },
);

const tabWellStyles = css({
  display: "grid",
  // The end column never squeezes its controls; when it outgrows its half
  // the tabs give way rather than overlap it.
  gridTemplateColumns:
    "minmax(0, 1fr) minmax(0, auto) minmax(max-content, 1fr)",
  alignItems: "center",
  background: "bg.canvas",
  borderBottom: "1px solid token(colors.border.default)",
  "& > [role=tablist]": { gridColumn: "2" },
  "& > [data-section-tab-well-end]": {
    gridColumn: "3",
    justifySelf: "end",
    display: "flex",
    alignItems: "center",
    paddingInlineEnd: "1.5",
    paddingBottom: "var(--border-widths-ledge)",
    "&:empty": { display: "none" },
  },
});

export interface SectionTabWellProps {
  /** A well `SectionTabList`. */
  children: ReactNode;
  /**
   * Controls at the end of the band, beside the tabs but outside the tab
   * list, such as a column's menu and Collapse (`SidebarHeaderEnd`).
   */
  end?: ReactNode;
  className?: string;
}

/**
 * The well's band with room for controls: the tabs centred across the whole
 * band and `end` at its inline end, outside the tab list so the list holds
 * only tabs. Without `end`, a well `SectionTabList` alone is the same band.
 */
export function SectionTabWell(props: SectionTabWellProps) {
  const { children, end, className } = props;
  return (
    <div className={cx(tabWellStyles, className)} data-section-tab-well="">
      {children}
      <div data-section-tab-well-end="">{end}</div>
    </div>
  );
}

const panelStyles = css({
  outline: "none",
  borderRadius: "xs",
  _focusVisible: focusRing.outset,
});

export interface TabPanelProps
  extends Omit<ComponentProps<typeof BaseTabs.Panel>, "className"> {
  className?: string;
}

/** The content shown while the tab with the same `value` is selected. */
export const TabPanel = forwardRef<HTMLDivElement, TabPanelProps>(
  function TabPanel(props, ref) {
    const { className, ...rest } = props;
    return (
      <BaseTabs.Panel
        ref={ref}
        className={cx(panelStyles, className)}
        {...rest}
      />
    );
  },
);
