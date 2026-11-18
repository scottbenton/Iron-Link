import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import {
  ComponentProps,
  ReactElement,
  ReactNode,
  createContext,
  forwardRef,
  useContext,
} from "react";

import { LayoutProps, withLayoutProps } from "ui/styles/layoutProps";

import { css, cva, cx } from "styled-system/css";

interface ListContextValue {
  dense: boolean;
  inset: boolean;
}

const ListContext = createContext<ListContextValue>({
  dense: false,
  inset: false,
});

const listStyles = cva({
  base: {
    listStyle: "none",
    margin: 0,
    padding: 0,
    boxSizing: "border-box",
    fontFamily: "body",
    color: "fg.default",
  },
  variants: {
    inset: {
      /** Rows are rounded and stand off the edges, as in a sidebar. */
      true: {
        display: "flex",
        flexDirection: "column",
        gap: "0.5",
        padding: "1",
      },
      false: {},
    },
    divided: {
      true: {
        "& > li + li": { borderTop: "1px solid token(colors.border.subtle)" },
      },
      false: {},
    },
  },
});

export interface ListProps extends ComponentProps<"ul">, LayoutProps {
  /** Tighter rows, for long lists and side panels. */
  dense?: boolean;
  /** Rounded rows inset from the edges, for navigation and side panels. */
  inset?: boolean;
  /** Hairlines between rows. */
  divided?: boolean;
  /** Render another list element, such as `<ol />`. */
  render?: ReactElement;
}

/**
 * A list of rows: `ListItem`s, which hold a `ListItemButton` when the row
 * does something, and `ListSubheader`s between groups.
 */
export const List = forwardRef<HTMLUListElement, ListProps>(
  function List(props, ref) {
    const {
      dense = false,
      inset = false,
      divided = false,
      className,
      render,
      ...rest
    } = withLayoutProps(props);
    const element = useRender({
      defaultTagName: "ul",
      render,
      ref,
      props: mergeProps<"ul">(
        { className: cx(listStyles({ inset, divided }), className) },
        rest,
      ),
    });
    return (
      <ListContext.Provider value={{ dense, inset }}>
        {element}
      </ListContext.Provider>
    );
  },
);

const itemStyles = cva({
  base: {
    position: "relative",
    display: "flex",
    alignItems: "center",
    gap: "3",
    boxSizing: "border-box",
    minWidth: 0,
    // A row that holds a button lets the button take the padding, so the
    // whole row is the target.
    "&:has(> [data-list-button])": { padding: 0, gap: "1" },
    "&:has(> [data-list-button]) > [data-list-action]": {
      paddingInlineEnd: "2",
    },
  },
  variants: {
    dense: {
      true: { minHeight: "36px", paddingBlock: "1.5", paddingInline: "3" },
      false: { minHeight: "48px", paddingBlock: "2", paddingInline: "4" },
    },
    inset: {
      true: { borderRadius: "md" },
      false: {},
    },
  },
  compoundVariants: [{ inset: true, css: { paddingInline: "3" } }],
});

const actionStyles = css({
  display: "flex",
  alignItems: "center",
  gap: "1",
  flex: "none",
  marginInlineStart: "auto",
});

export interface ListItemProps extends ComponentProps<"li"> {
  /**
   * A button or two at the end of the row, such as a roll or a menu. It
   * sits beside the row's own button, never inside it.
   */
  endAction?: ReactNode;
}

/**
 * One row. Put a `ListItemButton` inside to make it act; put other things
 * (icon, text, end text) straight inside for a plain row.
 */
export const ListItem = forwardRef<HTMLLIElement, ListItemProps>(
  function ListItem(props, ref) {
    const { endAction, className, children, ...rest } = props;
    const { dense, inset } = useContext(ListContext);
    return (
      <li
        ref={ref}
        className={cx(itemStyles({ dense, inset }), className)}
        {...rest}
      >
        {children}
        {endAction && (
          <span data-list-action="" className={actionStyles}>
            {endAction}
          </span>
        )}
      </li>
    );
  },
);

const buttonStyles = cva({
  base: {
    flex: "1 1 auto",
    minWidth: 0,
    display: "flex",
    alignItems: "center",
    gap: "3",
    boxSizing: "border-box",
    width: "100%",
    margin: 0,
    border: 0,
    background: "transparent",
    color: "fg.default",
    font: "inherit",
    fontFamily: "body",
    textAlign: "start",
    textDecoration: "none",
    cursor: "pointer",
    userSelect: "none",
    WebkitTapHighlightColor: "transparent",
    transition: "background-color token(durations.fast) linear",
    outline: "none",
    _hover: { background: "overlay.hover" },
    // Rows have no ledge, so they answer a press with colour, not travel.
    _pressed: { background: "overlay.pressed" },
    "&[data-selected]": {
      background: "overlay.selected",
      fontWeight: "semibold",
      "& [data-list-icon]": { color: "fg.default" },
    },
    _focusVisible: {
      outline: "2px solid token(colors.focusRing)",
      outlineOffset: "-2px",
    },
    "&:is(:disabled, [data-disabled], [aria-disabled=true])": {
      cursor: "not-allowed",
      color: "fg.disabled",
      background: "transparent",
      "& [data-list-icon], & [data-list-secondary]": { color: "fg.disabled" },
    },
  },
  variants: {
    dense: {
      true: { minHeight: "36px", paddingBlock: "1.5", paddingInline: "3" },
      false: { minHeight: "48px", paddingBlock: "2", paddingInline: "4" },
    },
    inset: {
      true: { borderRadius: "md" },
      false: {},
    },
  },
  compoundVariants: [
    { inset: true, css: { paddingInline: "3" } },
    { dense: true, css: { _touch: { minHeight: "touch" } } },
  ],
});

export interface ListItemButtonProps
  extends Omit<ComponentProps<"button">, "ref"> {
  /**
   * The row is the current one, such as the open game or the chosen
   * oracle. Shown as a neutral overlay. Pair it with the right state for
   * the row: `aria-current="page"` on a link, `aria-pressed` on a toggle.
   */
  selected?: boolean;
  /**
   * Render a link: `render={<RouterLink to={path} />}`. Links keep their
   * own semantics; disabled does not apply to them.
   */
  render?: ReactElement;
}

/** The interactive part of a row: a button, or a link through `render`. */
export const ListItemButton = forwardRef<HTMLElement, ListItemButtonProps>(
  function ListItemButton(props, ref) {
    const { selected, render, className, disabled, type, ...rest } = props;
    const { dense, inset } = useContext(ListContext);
    return useRender({
      defaultTagName: "button",
      render,
      ref,
      props: mergeProps<"button">(
        {
          className: cx(buttonStyles({ dense, inset }), className),
          // Only a real button takes type and disabled.
          ...(render
            ? { "aria-disabled": disabled || undefined }
            : { type: type ?? "button", disabled }),
        },
        {
          "data-list-button": "",
          "data-selected": selected ? "" : undefined,
        } as ComponentProps<"button">,
        rest,
      ),
    });
  },
);

export interface ListItemIconProps extends ComponentProps<"span"> {
  children: ReactNode;
}

/** An icon or avatar at the start of a row. */
export function ListItemIcon(props: ListItemIconProps) {
  const { className, ...rest } = props;
  return (
    <span
      data-list-icon=""
      aria-hidden
      className={cx(
        css({
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          flex: "none",
          color: "fg.muted",
          "& svg": { width: "20px", height: "20px" },
        }),
        className,
      )}
      {...rest}
    />
  );
}

export interface ListItemTextProps
  extends Omit<ComponentProps<"span">, "children"> {
  /** The row's main text. */
  primary?: ReactNode;
  /** A second line, such as a ruleset or a player's name. */
  secondary?: ReactNode;
  /** The main text, if `primary` is not given. */
  children?: ReactNode;
  /** Cut both lines to one with an ellipsis. */
  truncate?: boolean;
}

const textStyles = cva({
  base: {
    display: "flex",
    flexDirection: "column",
    flex: "1 1 auto",
    minWidth: 0,
    gap: "0.5",
    "& > *": { lineHeight: "snug" },
    "& > [data-list-secondary]": {
      fontWeight: "normal",
      color: "fg.muted",
    },
  },
  variants: {
    dense: {
      true: {
        "& > [data-list-primary]": { fontSize: "sm" },
        "& > [data-list-secondary]": { fontSize: "xs" },
      },
      false: {
        "& > [data-list-primary]": { fontSize: "md" },
        "& > [data-list-secondary]": { fontSize: "sm" },
      },
    },
    truncate: {
      true: {
        "& > *": {
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        },
      },
      false: {},
    },
  },
});

/** A row's text: a main line and an optional second line under it. */
export function ListItemText(props: ListItemTextProps) {
  const { primary, secondary, children, truncate, className, ...rest } = props;
  const { dense } = useContext(ListContext);
  return (
    <span
      className={cx(textStyles({ dense, truncate: !!truncate }), className)}
      {...rest}
    >
      <span data-list-primary="">{primary ?? children}</span>
      {secondary && <span data-list-secondary="">{secondary}</span>}
    </span>
  );
}

/** Short text at the end of a row, such as a rank or a count. */
export function ListItemEnd(props: ComponentProps<"span">) {
  const { className, ...rest } = props;
  return (
    <span
      className={cx(
        css({
          flex: "none",
          marginInlineStart: "auto",
          fontSize: "sm",
          fontWeight: "normal",
          color: "fg.muted",
          fontVariantNumeric: "tabular-nums",
        }),
        className,
      )}
      {...rest}
    />
  );
}

export type ListSubheaderProps = ComponentProps<"li">;

const subheaderStyles = cva({
  base: {
    boxSizing: "border-box",
    paddingInline: "4",
    paddingTop: "3",
    paddingBottom: "1.5",
    fontFamily: "heading",
    fontWeight: "bold",
    fontSize: "xs",
    lineHeight: "snug",
    textTransform: "uppercase",
    letterSpacing: "label",
    color: "fg.muted",
  },
  variants: {
    inset: { true: { paddingInline: "3" }, false: {} },
  },
});

/**
 * A label over a group of rows. It only looks like a heading; it stays an
 * `li`, so put a real heading inside when the page needs one there.
 */
export const ListSubheader = forwardRef<HTMLLIElement, ListSubheaderProps>(
  function ListSubheader(props, ref) {
    const { className, ...rest } = props;
    const { inset } = useContext(ListContext);
    return (
      <li
        ref={ref}
        className={cx(subheaderStyles({ inset }), className)}
        {...rest}
      />
    );
  },
);
