import { Menu as BaseMenu } from "@base-ui/react/menu";
import { ComponentProps, forwardRef } from "react";

import { css, cx } from "styled-system/css";

import { ItemContent, ItemContentProps } from "./ItemContent";
import { menuItemIndicatorSlotStyles, menuItemStyles } from "./menuStyles";
import { textLabel } from "./textLabel";

export interface MenuRadioItemProps
  extends Omit<ItemContentProps, "inset">,
    Omit<
      ComponentProps<typeof BaseMenu.RadioItem>,
      "className" | "children" | "render"
    > {
  className?: string;
}

const radioDot = css({
  display: "block",
  width: "8px",
  height: "8px",
  borderRadius: "full",
  background: "currentColor",
});

/** One choice in a MenuRadioGroup, marked with a dot when chosen. */
export const MenuRadioItem = forwardRef<HTMLDivElement, MenuRadioItemProps>(
  function MenuRadioItem(props, ref) {
    const { icon, description, shortcut, className, children, label, ...rest } =
      props;
    return (
      <BaseMenu.RadioItem
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
              <BaseMenu.RadioItemIndicator className={radioDot} />
            </span>
          }
        >
          {children}
        </ItemContent>
      </BaseMenu.RadioItem>
    );
  },
);
