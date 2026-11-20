import { ComponentProps, forwardRef, useContext } from "react";

import { css, cx } from "styled-system/css";

import { cellStyles } from "./cellStyles";
import { TableContext } from "./tableContext";

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
