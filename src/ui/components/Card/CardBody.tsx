import { ComponentProps } from "react";

import { css, cx } from "styled-system/css";

/** The card's main content. */
export function CardBody(props: ComponentProps<"div">) {
  const { className, ...rest } = props;
  return (
    <div
      className={cx(
        css({
          display: "grid",
          gap: "3",
          minWidth: 0,
          fontSize: "sm",
          lineHeight: "normal",
        }),
        className,
      )}
      {...rest}
    />
  );
}
