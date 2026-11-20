import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { ComponentProps, ReactElement, forwardRef } from "react";

import { CssProp, withCssProp } from "ui/styles/cssProp";

import { cva, cx } from "styled-system/css";

import { ListContext } from "./listContext";

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

export interface ListProps extends ComponentProps<"ul">, CssProp {
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
    } = withCssProp(props);
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
