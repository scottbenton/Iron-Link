import { Menu as BaseMenu } from "@base-ui/react/menu";
import { ComponentProps, ReactNode } from "react";

import { cx } from "styled-system/css";

import {
  popupPositionerStyles,
  popupSurfaceStyles,
} from "../Popover/popupStyles";
import { menuPopupStyles } from "./menuStyles";

export interface MenuContentProps {
  children: ReactNode;
  side?: "top" | "bottom" | "left" | "right" | "inline-start" | "inline-end";
  align?: "start" | "center" | "end";
  sideOffset?: number;
  alignOffset?: number;
  className?: string;
  /** Where focus goes when the menu closes; the trigger by default. */
  finalFocus?: ComponentProps<typeof BaseMenu.Popup>["finalFocus"];
}

/** The menu's card, placed against the trigger and portalled to the body. */
export function MenuContent(props: MenuContentProps) {
  const {
    children,
    side = "bottom",
    align = "start",
    sideOffset = 6,
    alignOffset,
    className,
    finalFocus,
  } = props;
  return (
    <BaseMenu.Portal>
      <BaseMenu.Positioner
        className={popupPositionerStyles}
        side={side}
        align={align}
        sideOffset={sideOffset}
        alignOffset={alignOffset}
        collisionPadding={8}
      >
        <BaseMenu.Popup
          className={cx(
            "ui-root",
            popupSurfaceStyles,
            menuPopupStyles,
            className,
          )}
          finalFocus={finalFocus}
        >
          {children}
        </BaseMenu.Popup>
      </BaseMenu.Positioner>
    </BaseMenu.Portal>
  );
}
