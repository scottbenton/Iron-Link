import {
  ComponentPropsWithoutRef,
  ElementType,
  ReactNode,
  forwardRef,
} from "react";

import { cx } from "styled-system/css";

import { listRowLineStyles } from "./listRowStyles";

export interface ListRowProps
  extends Omit<ComponentPropsWithoutRef<"div">, "children"> {
  /** The row's button (`ListRowButton`, or a trigger styled with `listRowStyles`). */
  children: ReactNode;
  /**
   * A control at the row's end, such as View table. It lies over the row,
   * which keeps `--row-action-width` (32px) clear for it.
   */
  action?: ReactNode;
  /** The wrapper element; `li` inside a list. */
  as?: ElementType;
}

/**
 * The line of a dense, inset row that does one thing when pressed, with an
 * optional control over its end: the common row under `MoveListItem`,
 * `OracleListItem` and the reference sidebar. The row's hover and selected
 * colour run under the end control to the edge, as one row.
 *
 * ```tsx
 * <ListRow as="li" action={<IconButton label="View table" />}>
 *   <ListRowButton onClick={roll}>
 *     <span data-row-name="">Action</span>
 *   </ListRowButton>
 * </ListRow>
 * ```
 */
export const ListRow = forwardRef<HTMLElement, ListRowProps>(
  function ListRow(props, ref) {
    const { children, action, as: Wrapper = "div", className, ...rest } = props;
    return (
      <Wrapper
        ref={ref}
        data-row-line=""
        data-has-action={action ? "" : undefined}
        className={cx(listRowLineStyles, className)}
        {...rest}
      >
        {children}
        {action && <span data-row-action="">{action}</span>}
      </Wrapper>
    );
  },
);
