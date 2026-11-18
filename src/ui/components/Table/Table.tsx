import {
  ComponentProps,
  ReactNode,
  createContext,
  forwardRef,
  useContext,
} from "react";

import { LayoutProps, withLayoutProps } from "ui/styles/layoutProps";

import { css, cva, cx } from "styled-system/css";

interface TableContextValue {
  density: "comfortable" | "compact";
  stickyHeader: boolean;
}

const TableContext = createContext<TableContextValue>({
  density: "comfortable",
  stickyHeader: false,
});

const containerStyles = css({
  position: "relative",
  boxSizing: "border-box",
  maxWidth: "100%",
  overflow: "auto",
  border: "1px solid token(colors.border.default)",
  borderRadius: "lg",
  background: "bg.surface",
  outline: "none",
  _focusVisible: {
    outline: "2px solid token(colors.focusRing)",
    outlineOffset: "2px",
  },
});

const tableStyles = css({
  width: "100%",
  borderCollapse: "separate",
  borderSpacing: 0,
  fontFamily: "body",
  fontSize: "sm",
  lineHeight: "snug",
  color: "fg.default",
});

export interface TableProps
  // The table's own width attribute gives way to the layout props.
  extends Omit<ComponentProps<"table">, "width">,
    Omit<LayoutProps, "maxHeight"> {
  /** Compact rows for dense data, such as oracle tables. */
  density?: "comfortable" | "compact";
  /**
   * Keep the header in view while the rows scroll. Give the table a
   * `maxHeight` so it scrolls inside its own box.
   */
  stickyHeader?: boolean;
  /** The scrolling box's maximum height, such as "360px". */
  maxHeight?: string;
  /**
   * Names the scrolling box when it scrolls, so keyboard users can reach
   * it. Usually the same as the caption.
   */
  "aria-label"?: string;
  /** Class for the scrolling box around the table. */
  containerClassName?: string;
  children: ReactNode;
}

/**
 * A data table: `TableHead`, `TableBody`, `TableRow`, `TableHeaderCell`
 * and `TableCell`. Numbers go in `numeric` cells, which right-align them in
 * tabular figures. Wide or long tables scroll inside their own box.
 */
export const Table = forwardRef<HTMLTableElement, TableProps>(
  function Table(props, ref) {
    const { className, containerClassName, ...ownProps } = props;
    // The layout props place the scrolling box, so they join its class.
    const {
      density = "comfortable",
      stickyHeader = false,
      maxHeight,
      "aria-label": ariaLabel,
      className: boxClassName,
      ...rest
    } = withLayoutProps({ ...ownProps, className: containerClassName }, [
      "maxHeight",
    ]);
    const scrolls = maxHeight !== undefined;
    return (
      <TableContext.Provider value={{ density, stickyHeader }}>
        <div
          className={cx(containerStyles, boxClassName)}
          style={scrolls ? { maxHeight } : undefined}
          // A box that scrolls must be reachable from the keyboard.
          tabIndex={scrolls ? 0 : undefined}
          role={scrolls ? "region" : undefined}
          aria-label={scrolls ? ariaLabel : undefined}
        >
          <table
            ref={ref}
            className={cx(tableStyles, className)}
            aria-label={scrolls ? undefined : ariaLabel}
            // The layout props are gone from `rest`, though its type keeps them.
            {...(rest as Omit<ComponentProps<"table">, "width">)}
          />
        </div>
      </TableContext.Provider>
    );
  },
);

/** A table's title, read as its name. */
export function TableCaption(props: ComponentProps<"caption">) {
  const { className, ...rest } = props;
  return (
    <caption
      className={cx(
        css({
          captionSide: "top",
          textAlign: "start",
          paddingInline: "3",
          paddingBlock: "2",
          fontFamily: "heading",
          fontWeight: "bold",
          fontSize: "md",
          color: "fg.default",
        }),
        className,
      )}
      {...rest}
    />
  );
}

export function TableHead(props: ComponentProps<"thead">) {
  const { className, ...rest } = props;
  return <thead className={className} {...rest} />;
}

const bodyStyles = css({
  "& > tr + tr > :is(td, th)": {
    borderTop: "1px solid token(colors.border.subtle)",
  },
});

export function TableBody(props: ComponentProps<"tbody">) {
  const { className, ...rest } = props;
  return <tbody className={cx(bodyStyles, className)} {...rest} />;
}

export function TableFoot(props: ComponentProps<"tfoot">) {
  const { className, ...rest } = props;
  return <tfoot className={className} {...rest} />;
}

const rowStyles = css({
  "&[data-selected] > :is(td, th)": {
    background: "overlay.selected",
    fontWeight: "semibold",
  },
  "&[data-interactive]": {
    cursor: "pointer",
    _hover: { "& > :is(td, th)": { background: "overlay.hover" } },
  },
});

export interface TableRowProps extends ComponentProps<"tr"> {
  /**
   * The row to point out, such as the oracle result just rolled. Pair it
   * with `aria-current` or a visible note when it matters to the reader.
   */
  selected?: boolean;
  /** The row answers clicks (its own button or link does the work). */
  interactive?: boolean;
}

export const TableRow = forwardRef<HTMLTableRowElement, TableRowProps>(
  function TableRow(props, ref) {
    const { selected, interactive, className, ...rest } = props;
    return (
      <tr
        ref={ref}
        className={cx(rowStyles, className)}
        data-selected={selected || undefined}
        data-interactive={interactive || undefined}
        {...rest}
      />
    );
  },
);

const cellStyles = cva({
  base: {
    boxSizing: "border-box",
    textAlign: "start",
    verticalAlign: "top",
    transition: "background-color token(durations.fast) linear",
  },
  variants: {
    density: {
      comfortable: { paddingBlock: "3", paddingInline: "3" },
      compact: { paddingBlock: "1", paddingInline: "2" },
    },
    numeric: {
      true: {
        textAlign: "end",
        fontVariantNumeric: "tabular-nums",
        whiteSpace: "nowrap",
      },
      false: {},
    },
    header: {
      true: {
        fontFamily: "heading",
        fontWeight: "bold",
        fontSize: "xs",
        lineHeight: "snug",
        textTransform: "uppercase",
        letterSpacing: "label",
        color: "fg.muted",
        verticalAlign: "bottom",
        background: "bg.muted",
        borderBottom: "1px solid token(colors.border.default)",
        whiteSpace: "nowrap",
      },
      false: {},
    },
    sticky: {
      true: { position: "sticky", top: 0, zIndex: 1 },
      false: {},
    },
  },
});

export interface TableCellProps extends ComponentProps<"td"> {
  /** Right-aligned tabular figures: roll ranges, counts, scores. */
  numeric?: boolean;
}

export const TableCell = forwardRef<HTMLTableCellElement, TableCellProps>(
  function TableCell(props, ref) {
    const { numeric = false, className, ...rest } = props;
    const { density } = useContext(TableContext);
    return (
      <td
        ref={ref}
        className={cx(
          cellStyles({ density, numeric, header: false, sticky: false }),
          className,
        )}
        {...rest}
      />
    );
  },
);

export interface TableHeaderCellProps extends ComponentProps<"th"> {
  numeric?: boolean;
}

/**
 * A column header (`scope="col"` by default) or, in a body row with
 * `scope="row"`, a row header.
 */
export const TableHeaderCell = forwardRef<
  HTMLTableCellElement,
  TableHeaderCellProps
>(function TableHeaderCell(props, ref) {
  const { numeric = false, scope = "col", className, ...rest } = props;
  const { density, stickyHeader } = useContext(TableContext);
  const isColumnHeader = scope === "col" || scope === "colgroup";
  return (
    <th
      ref={ref}
      scope={scope}
      className={cx(
        cellStyles({
          density,
          numeric,
          header: isColumnHeader,
          sticky: isColumnHeader && stickyHeader,
        }),
        !isColumnHeader && css({ fontWeight: "semibold" }),
        className,
      )}
      {...rest}
    />
  );
});
