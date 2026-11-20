import { Menu as BaseMenu } from "@base-ui/react/menu";
import { CheckIcon } from "@phosphor-icons/react";
import { ComponentProps, forwardRef } from "react";

import { css, cx } from "styled-system/css";

import { ItemContent, ItemContentProps } from "./ItemContent";
import { menuItemIndicatorSlotStyles, menuItemStyles } from "./menuStyles";
import { textLabel } from "./textLabel";

export interface MenuCheckboxItemProps
  extends Omit<ItemContentProps, "inset">,
    Omit<
      ComponentProps<typeof BaseMenu.CheckboxItem>,
      "className" | "children" | "render"
    > {
  className?: string;
}

const indicatorStyles = css({ display: "inline-flex" });

/**
 * An on/off setting in a menu, shown with a check. Keeps the menu open by
 * default, so several can be changed in a row.
 */
export const MenuCheckboxItem = forwardRef<
  HTMLDivElement,
  MenuCheckboxItemProps
>(function MenuCheckboxItem(props, ref) {
  const { icon, description, shortcut, className, children, label, ...rest } =
    props;
  return (
    <BaseMenu.CheckboxItem
      ref={ref}
      className={cx(menuItemStyles(), className)}
      label={textLabel(children, label)}
      {...rest}
    >
      <ItemContent
        icon={icon}
        description={description}
        shortcut={shortcut}
        indicator={
          <span className={menuItemIndicatorSlotStyles} aria-hidden>
            <BaseMenu.CheckboxItemIndicator className={indicatorStyles}>
              <CheckIcon weight="bold" />
            </BaseMenu.CheckboxItemIndicator>
          </span>
        }
      >
        {children}
      </ItemContent>
    </BaseMenu.CheckboxItem>
  );
});
