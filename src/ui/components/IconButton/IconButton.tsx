import { ReactNode, forwardRef } from "react";

import { Button, ButtonProps } from "../Button";
import { Tooltip } from "../Tooltip";

export interface IconButtonProps
  extends Omit<ButtonProps, "startIcon" | "endIcon" | "children"> {
  /** The accessible name, also shown as the tooltip. */
  label: string;
  /** The icon. */
  children: ReactNode;
  /** Hide the tooltip, for buttons whose label is visible nearby. */
  hideTooltip?: boolean;
  tooltipSide?: "top" | "bottom" | "left" | "right";
}

/** A square button with an icon, named by `label` and shown as a tooltip. */
export const IconButton = forwardRef<HTMLElement, IconButtonProps>(
  function IconButton(props, ref) {
    const {
      label,
      children,
      variant = "ghost",
      hideTooltip,
      tooltipSide,
      ...rest
    } = props;
    return (
      <Tooltip title={label} disabled={hideTooltip} side={tooltipSide}>
        <Button
          ref={ref}
          variant={variant}
          iconOnly
          aria-label={label}
          {...rest}
        >
          {children}
        </Button>
      </Tooltip>
    );
  },
);
