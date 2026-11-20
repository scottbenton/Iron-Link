import { Menu as BaseMenu } from "@base-ui/react/menu";
import { ComponentProps, ReactElement, forwardRef } from "react";

import { cx } from "styled-system/css";

import { ItemContent, ItemContentProps } from "./ItemContent";
import { menuItemInsetStyles, menuItemStyles } from "./menuStyles";
import { textLabel } from "./textLabel";

export interface MenuItemProps
  extends ItemContentProps,
    Omit<
      ComponentProps<typeof BaseMenu.Item>,
      "className" | "children" | "render"
    > {
  /** `danger` for destructive actions such as Delete Character. */
  tone?: "default" | "danger";
  className?: string;
  /** Render as another element; set `nativeButton` for a `<button>`. */
  render?: ReactElement;
}

/** An action in a menu. Closes the menu when chosen unless `closeOnClick` is false. */
export const MenuItem = forwardRef<HTMLDivElement, MenuItemProps>(
  function MenuItem(props, ref) {
    const {
      icon,
      description,
      shortcut,
      inset,
      tone,
      className,
      children,
      label,
      ...rest
    } = props;
    return (
      <BaseMenu.Item
        ref={ref}
        className={cx(
          menuItemStyles({ tone }),
          inset && !icon && menuItemInsetStyles,
          className,
        )}
        label={textLabel(children, label)}
        {...rest}
      >
        <ItemContent icon={icon} description={description} shortcut={shortcut}>
          {children}
        </ItemContent>
      </BaseMenu.Item>
    );
  },
);
