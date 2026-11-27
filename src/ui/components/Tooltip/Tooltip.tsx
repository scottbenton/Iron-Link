import { Tooltip as BaseTooltip } from "@base-ui/react/tooltip";
import { ReactElement, ReactNode } from "react";

import { tooltipPopupStyles, tooltipPositionerStyles } from "./tooltipStyles";

export interface TooltipProps {
  /** What the tooltip says. */
  title: ReactNode;
  /** The element it describes; must accept a ref and props. */
  children: ReactElement;
  side?: "top" | "bottom" | "left" | "right";
  /**
   * Whether the tooltip text is the trigger's accessible description.
   * Icon buttons name themselves with aria-label instead, so the tooltip only
   * shows the same words.
   */
  disabled?: boolean;
}

/** A hover and focus hint. Wrap the app in UIProvider for a shared delay. */
export function Tooltip(props: TooltipProps) {
  const { title, children, side = "top", disabled } = props;
  if (disabled || title === undefined || title === null || title === "") {
    return children;
  }
  return (
    <BaseTooltip.Root>
      <BaseTooltip.Trigger render={children} />
      <BaseTooltip.Portal>
        <BaseTooltip.Positioner
          className={tooltipPositionerStyles}
          side={side}
          sideOffset={6}
        >
          <BaseTooltip.Popup className={tooltipPopupStyles}>
            {title}
          </BaseTooltip.Popup>
        </BaseTooltip.Positioner>
      </BaseTooltip.Portal>
    </BaseTooltip.Root>
  );
}

export const TooltipProvider = BaseTooltip.Provider;
