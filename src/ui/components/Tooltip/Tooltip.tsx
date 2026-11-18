import { Tooltip as BaseTooltip } from "@base-ui/react/tooltip";
import { ReactElement, ReactNode } from "react";

import { css } from "styled-system/css";

export const tooltipPopupStyles = css({
  maxWidth: "280px",
  paddingBlock: "1",
  paddingInline: "2",
  borderRadius: "sm",
  background: "gray.900",
  color: "white",
  fontFamily: "body",
  fontSize: "xs",
  fontWeight: "medium",
  lineHeight: "snug",
  boxShadow: "0 4px 12px -4px rgb(0 0 0 / 0.35)",
  transformOrigin: "var(--transform-origin)",
  transitionProperty: "opacity, scale",
  transitionDuration: "fast",
  transitionTimingFunction: "out",
  zIndex: "tooltip",
  _dark: { background: "gray.100", color: "gray.950" },
  _startingStyle: { opacity: 0, scale: "0.96" },
  _endingStyle: { opacity: 0, scale: "0.96", transitionDuration: "instant" },
});

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
        <BaseTooltip.Positioner side={side} sideOffset={6}>
          <BaseTooltip.Popup className={tooltipPopupStyles}>
            {title}
          </BaseTooltip.Popup>
        </BaseTooltip.Positioner>
      </BaseTooltip.Portal>
    </BaseTooltip.Root>
  );
}

export const TooltipProvider = BaseTooltip.Provider;
