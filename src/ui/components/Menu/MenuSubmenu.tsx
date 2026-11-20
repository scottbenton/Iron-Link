import { Menu as BaseMenu } from "@base-ui/react/menu";
import { CaretRightIcon } from "@phosphor-icons/react";
import { ReactNode, isValidElement } from "react";

import { css, cx } from "styled-system/css";

import {
  popupPositionerStyles,
  popupSurfaceStyles,
} from "../Popover/popupStyles";
import { ItemContent, ItemContentProps } from "./ItemContent";
import {
  menuItemInsetStyles,
  menuItemStyles,
  menuPopupStyles,
} from "./menuStyles";
import { textLabel } from "./textLabel";

export interface MenuSubmenuProps extends Omit<ItemContentProps, "shortcut"> {
  /** The row that opens the submenu. */
  label: ReactNode;
  /** The submenu's items. */
  children: ReactNode;
  disabled?: boolean;
  /** Open on hover as well as on press and arrow keys. */
  openOnHover?: boolean;
  className?: string;
}

const caret = css({
  marginInlineStart: "auto",
  color: "fg.muted",
  width: "14px!",
  height: "14px!",
});

/** A row that opens a nested menu to its side. */
export function MenuSubmenu(props: MenuSubmenuProps) {
  const {
    label,
    children,
    icon,
    description,
    inset,
    disabled,
    openOnHover,
    className,
  } = props;
  return (
    <BaseMenu.SubmenuRoot>
      <BaseMenu.SubmenuTrigger
        className={cx(menuItemStyles(), inset && !icon && menuItemInsetStyles)}
        disabled={disabled}
        openOnHover={openOnHover}
        label={textLabel(isValidElement(label) ? undefined : label)}
      >
        <ItemContent icon={icon} description={description}>
          {label}
        </ItemContent>
        <CaretRightIcon className={caret} aria-hidden />
      </BaseMenu.SubmenuTrigger>
      <BaseMenu.Portal>
        <BaseMenu.Positioner
          className={popupPositionerStyles}
          sideOffset={2}
          alignOffset={-5}
          collisionPadding={8}
        >
          <BaseMenu.Popup
            className={cx(
              "ui-root",
              popupSurfaceStyles,
              menuPopupStyles,
              className,
            )}
          >
            {children}
          </BaseMenu.Popup>
        </BaseMenu.Positioner>
      </BaseMenu.Portal>
    </BaseMenu.SubmenuRoot>
  );
}
