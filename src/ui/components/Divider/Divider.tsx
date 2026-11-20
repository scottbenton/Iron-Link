import { Separator } from "@base-ui/react/separator";
import { ComponentProps, ReactNode, forwardRef } from "react";

import { CssProp, withCssProp } from "ui/styles/cssProp";

import { css, cva, cx } from "styled-system/css";

const lineStyles = cva({
  base: {
    flex: "none",
    boxSizing: "border-box",
    margin: 0,
    border: 0,
    background: "border.default",
  },
  variants: {
    orientation: {
      horizontal: { height: "1px", width: "100%" },
      vertical: { width: "1px", alignSelf: "stretch", minHeight: "1em" },
    },
    subtle: {
      true: { background: "border.subtle" },
      false: {},
    },
  },
  defaultVariants: { orientation: "horizontal" },
});

const labelledStyles = css({
  display: "flex",
  alignItems: "center",
  gap: "3",
  width: "100%",
  fontFamily: "heading",
  fontWeight: "bold",
  fontSize: "xs",
  lineHeight: "snug",
  textTransform: "uppercase",
  letterSpacing: "label",
  color: "fg.muted",
  whiteSpace: "nowrap",
  "&::before, &::after": {
    content: '""',
    flex: "1 1 0",
    height: "1px",
    background: "border.default",
  },
  "&[data-align=start]::before": { flex: "0 0 token(spacing.3)" },
});

export interface DividerProps
  extends Omit<ComponentProps<"div">, "children">,
    CssProp {
  orientation?: "horizontal" | "vertical";
  /** The lighter hairline, for dividers inside a card. */
  subtle?: boolean;
  /**
   * Text in the middle of the line, such as "or". A labelled divider is
   * plain text between two drawn lines, so screen readers read the label.
   */
  children?: ReactNode;
  /** Where the label sits on the line. */
  labelAlign?: "center" | "start";
}

/**
 * A hairline between content: horizontal, vertical (in a row, such as
 * between toolbar groups) or with a label.
 */
export const Divider = forwardRef<HTMLDivElement, DividerProps>(
  function Divider(props, ref) {
    const {
      orientation = "horizontal",
      subtle = false,
      children,
      labelAlign = "center",
      className,
      ...rest
    } = withCssProp(props);
    if (children !== undefined && children !== null) {
      return (
        <div
          ref={ref}
          className={cx(labelledStyles, className)}
          data-align={labelAlign}
          {...rest}
        >
          {children}
        </div>
      );
    }
    return (
      <Separator
        ref={ref}
        orientation={orientation}
        className={cx(lineStyles({ orientation, subtle }), className)}
        {...rest}
      />
    );
  },
);
