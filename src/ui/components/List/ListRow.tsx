import { Button as BaseButton } from "@base-ui/react/button";
import {
  ComponentPropsWithoutRef,
  ElementType,
  ReactElement,
  ReactNode,
  forwardRef,
} from "react";

import { cx } from "styled-system/css";

import { listRowLineStyles, listRowStyles } from "./listRowStyles";

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

export interface ListRowButtonProps
  extends Omit<ComponentPropsWithoutRef<"button">, "ref"> {
  /**
   * Render a link instead, such as a reference page:
   * `render={<Link to={href} />}`.
   */
  render?: ReactElement;
  /**
   * The row is the current one: the open page for a link
   * (`aria-current="page"`), otherwise `aria-current="true"`.
   */
  current?: boolean;
}

/**
 * The pressable part of a `ListRow`. Put the name in a
 * `<span data-row-name>`, an icon before it in `data-row-icon` and a glyph
 * for what a press does (a chevron, a die) after it in `data-row-glyph`.
 * Disabled, it takes no pointer at all.
 */
export const ListRowButton = forwardRef<HTMLElement, ListRowButtonProps>(
  function ListRowButton(props, ref) {
    const { render, current, className, ...rest } = props;
    const isLink = render !== undefined;
    return (
      <BaseButton
        ref={ref}
        className={cx(listRowStyles, className)}
        render={render}
        nativeButton={!isLink}
        aria-current={current ? (isLink ? "page" : "true") : undefined}
        {...rest}
      />
    );
  },
);
