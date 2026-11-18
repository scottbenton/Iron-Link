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

export type SectionTabsVariant = "segmented" | "chips" | "underline";

const VariantContext = createContext<{
  variant: SectionTabsVariant;
  fullWidth: boolean;
}>({ variant: "segmented", fullWidth: true });

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
    },
    fullWidth: {
      true: {},
      false: {},
    },
  },
  compoundVariants: [
    {
      variant: "segmented",
      fullWidth: false,
      css: { flex: "none" },
    },
  ],
  defaultVariants: { variant: "segmented" },
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
    },
  },
  defaultVariants: { variant: "segmented" },
});

export interface SectionTabListProps
  extends Omit<ComponentProps<typeof BaseTabs.List>, "className"> {
  /** Names the tab set, such as "Character sections". */
  "aria-label"?: string;
  /**
   * Segmented (a sunken track), Chips (like the note tabs) or Underline
   * (like the page tabs, in body colour). The current tab's thumb slides
   * between tabs in all three.
   */
  variant?: SectionTabsVariant;
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
      fullWidth = true,
      activateOnFocus = true,
      className,
      children,
      ...rest
    } = props;
    return (
      <VariantContext.Provider value={{ variant, fullWidth }}>
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
    const { variant, fullWidth } = useContext(VariantContext);
    return (
      <BaseTabs.Tab
        ref={ref}
        className={cx(tabStyles({ variant, fullWidth }), className)}
        {...rest}
      >
        {icon}
        {children}
      </BaseTabs.Tab>
    );
  },
);

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
