import { Popover as BasePopover } from "@base-ui/react/popover";
import { PreviewCard as BasePreviewCard } from "@base-ui/react/preview-card";
import { XIcon } from "@phosphor-icons/react";
import { ComponentProps, ReactNode, forwardRef } from "react";

import { css, cva, cx } from "styled-system/css";

import { Button } from "../Button";
import { IconButton } from "../IconButton";
import { Text } from "../Text";
import { popupPositionerStyles, popupSurfaceStyles } from "./popupStyles";

type Side = "top" | "bottom" | "left" | "right" | "inline-start" | "inline-end";
type Align = "start" | "center" | "end";

const cardStyles = cva({
  base: {
    display: "grid",
    gap: "3",
    width: "min(var(--popover-width), calc(100vw - 16px))",
    maxHeight: "var(--available-height)",
    overflowY: "auto",
    overscrollBehavior: "contain",
    padding: "4",
    borderRadius: "lg",
    fontSize: "sm",
    lineHeight: "normal",
  },
  variants: {
    size: {
      sm: { "--popover-width": "240px" },
      md: { "--popover-width": "320px" },
      lg: { "--popover-width": "420px" },
    },
  },
  defaultVariants: { size: "md" },
});

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

/* ------------------------------------------------------------- Popover */

export type PopoverProps = ComponentProps<typeof BasePopover.Root>;

/**
 * A small non-modal panel of content or controls anchored to a button, such
 * as a stat's details or a quick filter. Escape and a press outside close
 * it. For a list of actions use Menu; for a short hint use Tooltip.
 */
export function Popover(props: PopoverProps) {
  return <BasePopover.Root {...props} />;
}

export interface PopoverTriggerProps
  extends Omit<ComponentProps<typeof BasePopover.Trigger>, "className"> {
  className?: string;
}

/** Opens the popover. Renders a Button unless given another through `render`. */
export const PopoverTrigger = forwardRef<
  HTMLButtonElement,
  PopoverTriggerProps
>(function PopoverTrigger(props, ref) {
  const { render, ...rest } = props;
  return (
    <BasePopover.Trigger ref={ref} render={render ?? <Button />} {...rest} />
  );
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
  size?: "sm" | "md" | "lg";
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
  const {
    title,
    description,
    children,
    showClose = title !== undefined,
    closeLabel = "Close",
    size,
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
          className={cx(
            "ui-root",
            popupSurfaceStyles,
            cardStyles({ size }),
            className,
          )}
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

/** Closes the popover; give it a Button through `render`. */
export const PopoverClose = BasePopover.Close;

/* --------------------------------------------------------- PreviewCard */

export type PreviewCardProps = ComponentProps<typeof BasePreviewCard.Root>;

/**
 * A preview shown when a link is hovered or focused, such as a world entry
 * mention. It only repeats what the link leads to, so it holds no controls.
 */
export function PreviewCard(props: PreviewCardProps) {
  return <BasePreviewCard.Root {...props} />;
}

export interface PreviewCardTriggerProps
  extends Omit<ComponentProps<typeof BasePreviewCard.Trigger>, "className"> {
  className?: string;
}

/** The link that shows the preview. Pass a router link through `render`. */
export const PreviewCardTrigger = BasePreviewCard.Trigger as (
  props: PreviewCardTriggerProps,
) => ReturnType<typeof BasePreviewCard.Trigger>;

export interface PreviewCardContentProps {
  children: ReactNode;
  size?: "sm" | "md" | "lg";
  side?: Side;
  align?: Align;
  sideOffset?: number;
  className?: string;
}

export function PreviewCardContent(props: PreviewCardContentProps) {
  const {
    children,
    size,
    side = "bottom",
    align = "center",
    sideOffset = 8,
    className,
  } = props;
  return (
    <BasePreviewCard.Portal>
      <BasePreviewCard.Positioner
        className={popupPositionerStyles}
        side={side}
        align={align}
        sideOffset={sideOffset}
        collisionPadding={8}
      >
        <BasePreviewCard.Popup
          className={cx(
            "ui-root",
            popupSurfaceStyles,
            cardStyles({ size }),
            className,
          )}
        >
          {children}
        </BasePreviewCard.Popup>
      </BasePreviewCard.Positioner>
    </BasePreviewCard.Portal>
  );
}
