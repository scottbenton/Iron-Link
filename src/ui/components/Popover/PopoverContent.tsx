import { Popover as BasePopover } from "@base-ui/react/popover";
import { XIcon } from "@phosphor-icons/react";
import { ComponentProps, ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { css, cx } from "styled-system/css";

import { IconButton } from "../IconButton";
import { Text } from "../Text";
import { cardStyles } from "./cardStyles";
import { popupPositionerStyles, popupSurfaceStyles } from "./popupStyles";

type Side = "top" | "bottom" | "left" | "right" | "inline-start" | "inline-end";
type Align = "start" | "center" | "end";

const headerStyles = css({
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: "2",
  marginBlockEnd: "-1",
});

const headingStyles = css({
  display: "grid",
  gap: "1",
  minWidth: 0,
  paddingBlockStart: "1",
});

export interface PopoverContentProps {
  /** The popover's name, shown as its heading. */
  title?: ReactNode;
  /** A line under the title, read as the popover's description. */
  description?: ReactNode;
  children?: ReactNode;
  /** Shows a Close button beside the title. On by default with a title. */
  showClose?: boolean;
  closeLabel?: string;
  side?: Side;
  align?: Align;
  sideOffset?: number;
  className?: string;
  /** Element to focus on open; the popup itself by default. */
  initialFocus?: ComponentProps<typeof BasePopover.Popup>["initialFocus"];
  finalFocus?: ComponentProps<typeof BasePopover.Popup>["finalFocus"];
  /**
   * Name the popover when it has no visible title. Without a title or a
   * label, give its content a heading.
   */
  "aria-label"?: string;
}

/** The popover's card: an optional title, description and Close, then content. */
export function PopoverContent(props: PopoverContentProps) {
  const { t } = useTranslation();
  const {
    title,
    description,
    children,
    showClose = title !== undefined,
    closeLabel = t("ui.common.close", "Close"),
    side = "bottom",
    align = "center",
    sideOffset = 8,
    className,
    initialFocus,
    finalFocus,
    "aria-label": ariaLabel,
  } = props;
  const hasHeader =
    title !== undefined || description !== undefined || showClose;
  return (
    <BasePopover.Portal>
      <BasePopover.Positioner
        className={popupPositionerStyles}
        side={side}
        align={align}
        sideOffset={sideOffset}
        collisionPadding={8}
      >
        <BasePopover.Popup
          className={cx("ui-root", popupSurfaceStyles, cardStyles, className)}
          initialFocus={initialFocus}
          finalFocus={finalFocus}
          aria-label={ariaLabel}
        >
          {hasHeader && (
            <div className={headerStyles}>
              <div className={headingStyles}>
                {title !== undefined && (
                  <BasePopover.Title render={<Text variant="h4" as="h2" />}>
                    {title}
                  </BasePopover.Title>
                )}
                {description !== undefined && (
                  <BasePopover.Description
                    render={<Text variant="bodySm" color="muted" />}
                  >
                    {description}
                  </BasePopover.Description>
                )}
              </div>
              {showClose && (
                <BasePopover.Close
                  render={
                    <IconButton
                      label={closeLabel}
                      size="sm"
                      tooltipSide="bottom"
                    >
                      <XIcon />
                    </IconButton>
                  }
                />
              )}
            </div>
          )}
          {children}
        </BasePopover.Popup>
      </BasePopover.Positioner>
    </BasePopover.Portal>
  );
}
