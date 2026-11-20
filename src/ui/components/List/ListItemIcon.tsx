import { ComponentProps, ReactNode } from "react";

import { css, cx } from "styled-system/css";

export interface ListItemIconProps extends ComponentProps<"span"> {
  children: ReactNode;
}

/** An icon or avatar at the start of a row. */
export function ListItemIcon(props: ListItemIconProps) {
  const { className, ...rest } = props;
  return (
    <span
      data-list-icon=""
      aria-hidden
      className={cx(
        css({
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          flex: "none",
          color: "fg.muted",
          "& svg": { width: "icon.md", height: "icon.md" },
        }),
        className,
      )}
      {...rest}
    />
  );
}
