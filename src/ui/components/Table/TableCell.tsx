import { ComponentProps, forwardRef, useContext } from "react";

import { cx } from "styled-system/css";

import { cellStyles } from "./cellStyles";
import { TableContext } from "./tableContext";

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
