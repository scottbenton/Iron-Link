import { ComponentProps, ReactNode, useContext } from "react";

import { cva, cx } from "styled-system/css";

import { ListContext } from "./listContext";

export interface ListItemTextProps
  extends Omit<ComponentProps<"span">, "children"> {
  /** The row's main text. */
  primary?: ReactNode;
  /** A second line, such as a ruleset or a player's name. */
  secondary?: ReactNode;
  /** The main text, if `primary` is not given. */
  children?: ReactNode;
  /** Cut both lines to one with an ellipsis. */
  truncate?: boolean;
}

const textStyles = cva({
  base: {
    display: "flex",
    flexDirection: "column",
    flex: "1 1 auto",
    minWidth: 0,
    gap: "0.5",
    "& > *": { lineHeight: "snug" },
    "& > [data-list-secondary]": {
      fontWeight: "normal",
      color: "fg.muted",
    },
  },
  variants: {
    dense: {
      true: {
        "& > [data-list-primary]": { fontSize: "sm" },
        "& > [data-list-secondary]": { fontSize: "xs" },
      },
      false: {
        "& > [data-list-primary]": { fontSize: "md" },
        "& > [data-list-secondary]": { fontSize: "sm" },
      },
    },
    truncate: {
      true: {
        "& > *": {
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        },
      },
      false: {},
    },
  },
});

/** A row's text: a main line and an optional second line under it. */
export function ListItemText(props: ListItemTextProps) {
  const { primary, secondary, children, truncate, className, ...rest } = props;
  const { dense } = useContext(ListContext);
  return (
    <span
      className={cx(textStyles({ dense, truncate: !!truncate }), className)}
      {...rest}
    >
      <span data-list-primary="">{primary ?? children}</span>
      {secondary && <span data-list-secondary="">{secondary}</span>}
    </span>
  );
}
