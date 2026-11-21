import { ComponentProps } from "react";

import { css, cx } from "styled-system/css";

/** A table's title, read as its name. */
export function TableCaption(props: ComponentProps<"caption">) {
  const { className, ...rest } = props;
  return (
    <caption
      className={cx(
        css({
          captionSide: "top",
          textAlign: "start",
          paddingInline: "3",
          paddingBlock: "2",
          fontFamily: "heading",
          fontWeight: "bold",
          fontSize: "md",
          color: "fg.default",
        }),
        className,
      )}
      {...rest}
    />
  );
}
