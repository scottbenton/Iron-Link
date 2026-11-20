import { ComponentProps, forwardRef } from "react";

import { css, cx } from "styled-system/css";

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
