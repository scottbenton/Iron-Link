import { ComponentProps, ReactNode, forwardRef } from "react";

import { CssProp, withCssProp } from "ui/styles/cssProp";
import { focusRing } from "ui/styles/focus";

import { css, cx } from "styled-system/css";

import { TableContext } from "./tableContext";

const containerStyles = css({
  position: "relative",
  boxSizing: "border-box",
  maxWidth: "100%",
  overflow: "auto",
  border: "1px solid token(colors.border.default)",
  borderRadius: "lg",
  background: "bg.surface",
  outline: "none",
  _focusVisible: focusRing.outset,
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
  // The table's old width attribute is left out: size it with `css`.
  extends Omit<ComponentProps<"table">, "width">,
    CssProp {
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
    // The css prop places the scrolling box, so it joins that box's class.
    const {
      density = "comfortable",
      stickyHeader = false,
      maxHeight,
      "aria-label": ariaLabel,
      className: boxClassName,
      ...rest
    } = withCssProp({ ...ownProps, className: containerClassName });
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
            {...rest}
          />
        </div>
      </TableContext.Provider>
    );
  },
);
