import { Toolbar } from "@base-ui/react/toolbar";
import { ComponentProps, ReactNode, forwardRef } from "react";

import { css, cx } from "styled-system/css";

import { CssProp, withCssProp } from "../../styles/cssProp";
import { toolbarButtonStyles } from "./actionToolbarButtonStyles";

const iconSlotStyles = css({ display: "flex" });

export interface ActionToolbarButtonProps
  extends Omit<ComponentProps<typeof Toolbar.Button>, "className">,
    CssProp {
  /** An icon before the label. */
  icon?: ReactNode;
  /** Red text, for a destructive action that asks to confirm. */
  danger?: boolean;
  className?: string;
}

/** A labelled action in the strip. */
export const ActionToolbarButton = forwardRef<
  HTMLButtonElement,
  ActionToolbarButtonProps
>(function ActionToolbarButton(props, ref) {
  const { icon, danger, children, className, ...rest } = withCssProp(props);
  return (
    <Toolbar.Button
      ref={ref}
      className={cx(toolbarButtonStyles({ danger }), className)}
      {...rest}
    >
      {icon && (
        <span aria-hidden="true" className={iconSlotStyles}>
          {icon}
        </span>
      )}
      {children}
    </Toolbar.Button>
  );
});
