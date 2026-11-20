import { Menu as BaseMenu } from "@base-ui/react/menu";
import { ComponentProps, forwardRef } from "react";

import { cx } from "styled-system/css";

import { ItemContent, ItemContentProps } from "./ItemContent";
import { menuItemInsetStyles, menuItemStyles } from "./menuStyles";
import { textLabel } from "./textLabel";

export interface MenuLinkItemProps
  extends ItemContentProps,
    Omit<ComponentProps<typeof BaseMenu.LinkItem>, "className" | "children"> {
  tone?: "default" | "danger";
  className?: string;
}

/**
 * A menu item that navigates. Pass the router's link through `render`, such
 * as `render={<Link to="/games" />}`, or an `href`. Closes the menu.
 */
export const MenuLinkItem = forwardRef<HTMLAnchorElement, MenuLinkItemProps>(
  function MenuLinkItem(props, ref) {
    const {
      icon,
      description,
      shortcut,
      inset,
      tone,
      className,
      children,
      label,
      closeOnClick = true,
      ...rest
    } = props;
    return (
      <BaseMenu.LinkItem
        ref={ref}
        className={cx(
          menuItemStyles({ tone }),
          inset && !icon && menuItemInsetStyles,
          className,
        )}
        label={textLabel(children, label)}
        closeOnClick={closeOnClick}
        {...rest}
      >
        <ItemContent icon={icon} description={description} shortcut={shortcut}>
          {children}
        </ItemContent>
      </BaseMenu.LinkItem>
    );
  },
);
