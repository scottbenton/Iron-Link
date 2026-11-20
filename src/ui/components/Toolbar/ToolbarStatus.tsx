import { ComponentProps } from "react";

import { css, cx } from "styled-system/css";

/** Text at the end of a toolbar, such as "Saved". Pushes itself right. */
export function ToolbarStatus(props: ComponentProps<"span">) {
  const { className, ...rest } = props;
  return (
    <span
      className={cx(
        css({
          marginInlineStart: "auto",
          paddingInline: "2",
          fontSize: "xs",
          color: "fg.subtle",
        }),
        className,
      )}
      {...rest}
    />
  );
}
