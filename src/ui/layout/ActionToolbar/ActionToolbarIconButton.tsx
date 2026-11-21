import { Toolbar } from "@base-ui/react/toolbar";
import { ReactNode, forwardRef } from "react";

import { cx } from "styled-system/css";

import { Tooltip } from "../../components/Tooltip";
import { withCssProp } from "../../styles/cssProp";
import { ActionToolbarButtonProps } from "./ActionToolbarButton";
import { toolbarButtonStyles } from "./actionToolbarButtonStyles";

export interface ActionToolbarIconButtonProps
  extends Omit<ActionToolbarButtonProps, "icon" | "children"> {
  /** The accessible name, also shown as the tooltip. */
  label: string;
  /** The icon. */
  children: ReactNode;
}

/** An icon-only action, named by `label` and shown as a tooltip. */
export const ActionToolbarIconButton = forwardRef<
  HTMLButtonElement,
  ActionToolbarIconButtonProps
>(function ActionToolbarIconButton(props, ref) {
  const { label, children, danger, className, ...rest } = withCssProp(props);
  return (
    <Tooltip title={label} side="bottom">
      <Toolbar.Button
        ref={ref}
        aria-label={label}
        className={cx(
          toolbarButtonStyles({ iconOnly: true, danger }),
          className,
        )}
        {...rest}
      >
        {children}
      </Toolbar.Button>
    </Tooltip>
  );
});
