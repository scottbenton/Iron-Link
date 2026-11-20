import { Toolbar as BaseToolbar } from "@base-ui/react/toolbar";
import { ComponentProps, forwardRef } from "react";

import { css, cx } from "styled-system/css";

import { buttonStyles } from "./buttonStyles";

export interface ToolbarLinkProps
  extends Omit<ComponentProps<typeof BaseToolbar.Link>, "className"> {
  className?: string;
}

/** A link in a toolbar, such as Help. */
export const ToolbarLink = forwardRef<HTMLAnchorElement, ToolbarLinkProps>(
  function ToolbarLink(props, ref) {
    const { className, ...rest } = props;
    return (
      <BaseToolbar.Link
        ref={ref}
        className={cx(
          buttonStyles({ iconOnly: false }),
          css({ textDecoration: "none" }),
          className,
        )}
        {...rest}
      />
    );
  },
);
