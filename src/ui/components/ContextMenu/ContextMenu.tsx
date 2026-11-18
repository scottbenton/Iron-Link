import { ContextMenu as BaseContextMenu } from "@base-ui/react/context-menu";
import { ComponentProps, ReactNode } from "react";

import { cx } from "styled-system/css";

import { menuPopupStyles } from "../Menu/menuStyles";
import {
  popupPositionerStyles,
  popupSurfaceStyles,
} from "../Popover/popupStyles";

export type ContextMenuProps = ComponentProps<typeof BaseContextMenu.Root>;

/**
 * A menu opened by right click or long press on an area. Fill
 * ContextMenuContent with the Menu items (MenuItem, MenuSeparator,
 * MenuGroup, ...). Every action in a context menu must also be reachable
 * another way, such as a menu button, since touch and keyboard users rarely
 * find it.
 */
export function ContextMenu(props: ContextMenuProps) {
  return <BaseContextMenu.Root {...props} />;
}

export interface ContextMenuTriggerProps
  extends Omit<ComponentProps<typeof BaseContextMenu.Trigger>, "className"> {
  className?: string;
}

/** The area that opens the menu. Renders a div unless given `render`. */
export function ContextMenuTrigger(props: ContextMenuTriggerProps) {
  return <BaseContextMenu.Trigger {...props} />;
}

export interface ContextMenuContentProps {
  children: ReactNode;
  className?: string;
}

/** The menu's card, opened at the pointer. */
export function ContextMenuContent(props: ContextMenuContentProps) {
  const { children, className } = props;
  return (
    <BaseContextMenu.Portal>
      <BaseContextMenu.Positioner
        className={popupPositionerStyles}
        collisionPadding={8}
      >
        <BaseContextMenu.Popup
          className={cx(
            "ui-root",
            popupSurfaceStyles,
            menuPopupStyles,
            className,
          )}
        >
          {children}
        </BaseContextMenu.Popup>
      </BaseContextMenu.Positioner>
    </BaseContextMenu.Portal>
  );
}
