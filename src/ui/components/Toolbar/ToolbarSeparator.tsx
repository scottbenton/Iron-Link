import { Toolbar as BaseToolbar } from "@base-ui/react/toolbar";
import { ComponentProps } from "react";

import { css, cx } from "styled-system/css";

export interface ToolbarSeparatorProps
  extends Omit<ComponentProps<typeof BaseToolbar.Separator>, "className"> {
  className?: string;
}

/** A hairline between groups. */
export function ToolbarSeparator(props: ToolbarSeparatorProps) {
  const { className, ...rest } = props;
  return (
    <BaseToolbar.Separator
      className={cx(
        css({
          flex: "none",
          width: "1px",
          height: "20px",
          marginInline: "1",
          background: "border.default",
          "&[data-orientation=horizontal]": {
            width: "auto",
            height: "1px",
            marginInline: 0,
            marginBlock: "1",
          },
        }),
        className,
      )}
      {...rest}
    />
  );
}
