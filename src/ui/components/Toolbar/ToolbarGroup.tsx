import { Toolbar as BaseToolbar } from "@base-ui/react/toolbar";
import { ComponentProps, forwardRef } from "react";

import { css, cx } from "styled-system/css";

export interface ToolbarGroupProps
  extends Omit<ComponentProps<typeof BaseToolbar.Group>, "className"> {
  /** Names the group for screen readers, such as "Text style". */
  "aria-label"?: string;
  className?: string;
}

/** Related controls kept together, such as bold, italic and strikethrough. */
export const ToolbarGroup = forwardRef<HTMLDivElement, ToolbarGroupProps>(
  function ToolbarGroup(props, ref) {
    const { className, ...rest } = props;
    return (
      <BaseToolbar.Group
        ref={ref}
        className={cx(
          css({ display: "flex", alignItems: "center", gap: "0.5" }),
          className,
        )}
        {...rest}
      />
    );
  },
);
