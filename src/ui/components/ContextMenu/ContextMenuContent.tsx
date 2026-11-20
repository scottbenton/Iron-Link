import { ContextMenu as BaseContextMenu } from "@base-ui/react/context-menu";
import { ReactNode } from "react";

import { cx } from "styled-system/css";

import { menuPopupStyles } from "../Menu/menuStyles";
import {
  popupPositionerStyles,
  popupSurfaceStyles,
} from "../Popover/popupStyles";

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
