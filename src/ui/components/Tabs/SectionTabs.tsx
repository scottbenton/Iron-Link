import { Tabs as BaseTabs } from "@base-ui/react/tabs";
import {
  ComponentProps,
  ReactNode,
  createContext,
  forwardRef,
  useContext,
} from "react";

import { css, cva, cx } from "styled-system/css";

type BaseRootProps = ComponentProps<typeof BaseTabs.Root>;

export interface TabsProps extends Omit<BaseRootProps, "className"> {
  className?: string;
}

/**
 * Holds a set of tabs and their panels: `SectionTabList` with `SectionTab`s,
 * then a `TabPanel` per tab. Controlled with `value` and `onValueChange`, or
 * uncontrolled with `defaultValue`.
 */
export const Tabs = forwardRef<HTMLDivElement, TabsProps>(
  function Tabs(props, ref) {
    const { className, ...rest } = props;
    return <BaseTabs.Root ref={ref} className={className} {...rest} />;
  },
);

export type SectionTabsVariant =
  | "segmented"
  | "chips"
  | "underline"
  | "band"
  | "accent"
  | "pills"
  | "well";

export type SectionTabsSize = "md" | "lg";

const VariantContext = createContext<{
  variant: SectionTabsVariant;
  fullWidth: boolean;
  size: SectionTabsSize;
}>({ variant: "segmented", fullWidth: true, size: "md" });

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
      /** A sunken track with a raised thumb that slides. */
      segmented: {
        gap: "0.5",
        padding: "3px",
        paddingBottom: "calc(3px + var(--border-widths-ledge))",
        borderRadius: "md",
        background: "bg.emphasized",
        boxShadow: "field",
      },
      /** No track; the current section is a raised card, like the open note. */
      chips: {
        gap: "1",
        paddingBottom: "var(--border-widths-ledge)",
        justifyContent: "flex-start",
      },
      /** Text on a hairline, the current section underlined in body colour. */
      underline: {
        gap: "4",
        justifyContent: "flex-start",
        boxShadow: "inset 0 -1px 0 token(colors.border.default)",
      },
      /**
       * A strip across the top of a column in the surface colour, the tabs
       * sharing its width, the current one marked by an accent bar.
       */
      band: {
        gap: 0,
        background: "bg.surface",
        boxShadow: "inset 0 -1px 0 token(colors.border.default)",
      },
      /**
       * Plain labels in the heading face with no track or hairline; the
       * current one turns the accent colour over an accent bar.
       */
      accent: {
        gap: "5",
        justifyContent: "flex-start",
      },
      /** Rounded pills; the current one is tinted with the accent. */
      pills: {
        gap: "1",
        justifyContent: "flex-start",
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
    fullWidth: {
      true: {},
      false: { display: "inline-flex", maxWidth: "100%" },
    },
  },
  defaultVariants: { variant: "segmented", fullWidth: true },
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
    _focusVisible: {
      outline: "2px solid token(colors.focusRing)",
      outlineOffset: "1px",
    },
    _disabled: { cursor: "not-allowed", color: "fg.disabled" },
    "& svg": { flex: "none", width: "16px", height: "16px" },
  },
  variants: {
    variant: {
      segmented: {
        flex: "1 1 0",
        minWidth: 0,
        minHeight: "32px",
        paddingInline: "3",
        borderRadius: "sm",
        _touch: { minHeight: "40px" },
      },
      chips: {
        flex: "none",
        minHeight: "32px",
        paddingInline: "3",
        borderRadius: "md",
        "&:hover:not([aria-selected=true])": { background: "overlay.hover" },
        _touch: { minHeight: "40px" },
      },
      underline: {
        flex: "none",
        minHeight: "38px",
        paddingInline: "0.5",
        borderRadius: "xs",
        _focusVisible: { outlineOffset: "-2px" },
        _touch: { minHeight: "touch" },
      },
      band: {
        flex: "1 1 0",
        minWidth: 0,
        minHeight: "40px",
        paddingInline: "3",
        borderRadius: 0,
        "&:hover:not([aria-selected=true])": { background: "overlay.hover" },
        _focusVisible: { outlineOffset: "-2px" },
        _touch: { minHeight: "touch" },
      },
      accent: {
        flex: "none",
        minHeight: "36px",
        paddingInline: "0.5",
        borderRadius: "xs",
        fontFamily: "heading",
        fontWeight: "bold",
        fontSize: "md",
        textTransform: "uppercase",
        letterSpacing: "label",
        "&[aria-selected=true], &[aria-selected=true]:hover": {
          color: "accent.fg",
        },
        _focusVisible: { outlineOffset: "-2px" },
        _touch: { minHeight: "touch" },
      },
      pills: {
        flex: "none",
        minHeight: "32px",
        paddingInline: "3.5",
        borderRadius: "full",
        "&:hover:not([aria-selected=true])": { background: "overlay.hover" },
        "&[aria-selected=true], &[aria-selected=true]:hover": {
          color: "accent.fg",
        },
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
    fullWidth: {
      true: {},
      false: {},
    },
    size: {
      md: {},
      lg: {},
    },
  },
  compoundVariants: [
    {
      variant: ["segmented", "band"],
      fullWidth: false,
      css: { flex: "none" },
    },
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
      variant: ["underline", "accent"],
      css: { paddingInline: "2" },
    },
  ],
  defaultVariants: { variant: "segmented", size: "md" },
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
      segmented: {
        top: "3px",
        bottom: "calc(3px + var(--border-widths-ledge))",
        borderRadius: "sm",
        background: "bg.surface",
        border: "1px solid token(colors.border.default)",
        boxShadow: "ledge",
      },
      chips: {
        top: 0,
        bottom: "var(--border-widths-ledge)",
        borderRadius: "md",
        background: "bg.surface",
        border: "1px solid token(colors.border.default)",
        boxShadow: "ledge",
      },
      underline: {
        bottom: 0,
        height: "2px",
        borderRadius: "2px",
        background: "fg.default",
      },
      band: {
        bottom: 0,
        height: "3px",
        borderRadius: "3px 3px 0 0",
        background: "accent.solid",
      },
      accent: {
        bottom: 0,
        height: "3px",
        borderRadius: "3px",
        background: "accent.solid",
      },
      pills: {
        top: 0,
        bottom: 0,
        borderRadius: "full",
        background: "accent.soft",
        border:
          "1px solid color-mix(in oklab, token(colors.accent.fg) 35%, transparent)",
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
  defaultVariants: { variant: "segmented" },
});

export interface SectionTabListProps
  extends Omit<ComponentProps<typeof BaseTabs.List>, "className"> {
  /** Names the tab set, such as "Character sections". */
  "aria-label"?: string;
  /**
   * Segmented (a sunken track), Chips (like the note tabs), Underline (like
   * the page tabs, in body colour), Band (a surface strip across the
   * column, an accent bar under the current tab), Accent (heading-face
   * labels, the current one in the accent colour over a bar) or Pills
   * (rounded, the current one tinted), or Well (the note tabs' chips in
   * an edge-to-edge canvas band). The current tab's marker slides between
   * tabs in all of them.
   */
  variant?: SectionTabsVariant;
  /**
   * Medium, or large: 48px tall at any pointer and wider, for tabs that
   * head a whole phone screen.
   */
  size?: SectionTabsSize;
  /**
   * Fill the width, sharing it between the tabs (segmented) or running the
   * hairline across (underline). On by default.
   */
  fullWidth?: boolean;
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
      variant = "segmented",
      size = "md",
      fullWidth = true,
      activateOnFocus = true,
      className,
      children,
      ...rest
    } = props;
    return (
      <VariantContext.Provider value={{ variant, fullWidth, size }}>
        <BaseTabs.List
          ref={ref}
          activateOnFocus={activateOnFocus}
          className={cx(listStyles({ variant, fullWidth }), className)}
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
    const { variant, fullWidth, size } = useContext(VariantContext);
    return (
      <BaseTabs.Tab
        ref={ref}
        className={cx(tabStyles({ variant, fullWidth, size }), className)}
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
  /** A `SectionTabList` with `variant="well"`. */
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
  _focusVisible: {
    outline: "2px solid token(colors.focusRing)",
    outlineOffset: "4px",
  },
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
