import { ComponentProps, ReactNode, forwardRef, useContext } from "react";

import { css, cva, cx } from "styled-system/css";

import { ListContext } from "./listContext";

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
      true: {
        minHeight: "control.row",
        paddingBlock: "1.5",
        paddingInline: "3",
      },
      false: { minHeight: "touch", paddingBlock: "2", paddingInline: "4" },
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
