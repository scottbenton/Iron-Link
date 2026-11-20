import { ComponentProps } from "react";

import { css, cx } from "styled-system/css";

/** Short text at the end of a row, such as a rank or a count. */
export function ListItemEnd(props: ComponentProps<"span">) {
  const { className, ...rest } = props;
  return (
    <span
      className={cx(
        css({
          flex: "none",
          marginInlineStart: "auto",
          fontSize: "sm",
          fontWeight: "normal",
          color: "fg.muted",
          fontVariantNumeric: "tabular-nums",
        }),
        className,
      )}
      {...rest}
    />
  );
}
