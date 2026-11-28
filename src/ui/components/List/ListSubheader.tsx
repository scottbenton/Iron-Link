import { ComponentProps, forwardRef, useContext } from "react";

import { cva, cx } from "styled-system/css";

import { ListContext } from "./listContext";

export interface ListSubheaderProps extends ComponentProps<"li"> {
  /** A hairline above it, setting off a group that follows another. */
  divided?: boolean;
}

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
    divided: {
      true: {
        marginTop: "1",
        paddingTop: "2.5",
        borderTop: "1px solid token(colors.border.subtle)",
      },
      false: {},
    },
  },
});

/**
 * A label over a group of rows. It only looks like a heading; it stays an
 * `li`, so put a real heading inside when the page needs one there.
 */
export const ListSubheader = forwardRef<HTMLLIElement, ListSubheaderProps>(
  function ListSubheader(props, ref) {
    const { divided = false, className, ...rest } = props;
    const { inset } = useContext(ListContext);
    return (
      <li
        ref={ref}
        className={cx(subheaderStyles({ inset, divided }), className)}
        {...rest}
      />
    );
  },
);
