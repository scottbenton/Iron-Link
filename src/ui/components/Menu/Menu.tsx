import { Menu as BaseMenu } from "@base-ui/react/menu";
import { CaretRightIcon, CheckIcon } from "@phosphor-icons/react";
import {
  ComponentProps,
  ReactElement,
  ReactNode,
  forwardRef,
  isValidElement,
} from "react";

import { css, cx } from "styled-system/css";

import { Button } from "../Button";
import {
  popupPositionerStyles,
  popupSurfaceStyles,
} from "../Popover/popupStyles";
import {
  menuGroupLabelStyles,
  menuItemDescriptionStyles,
  menuItemIconStyles,
  menuItemIndicatorSlotStyles,
  menuItemInsetStyles,
  menuItemLabelStyles,
  menuItemShortcutStyles,
  menuItemStyles,
  menuPopupStyles,
  menuSeparatorStyles,
} from "./menuStyles";

/* ------------------------------------------------------------------ Root */

export type MenuProps = ComponentProps<typeof BaseMenu.Root>;

/**
 * A menu of actions opened from a button. Compose it from MenuTrigger and
 * MenuContent; arrow keys move between items, typing jumps to a label, and
 * Escape closes it and returns focus to the trigger. Pass `open` and
 * `onOpenChange` to control it.
 */
export function Menu(props: MenuProps) {
  return <BaseMenu.Root {...props} />;
}

/* --------------------------------------------------------------- Trigger */

export interface MenuTriggerProps
  extends Omit<ComponentProps<typeof BaseMenu.Trigger>, "className"> {
  className?: string;
}

/**
 * Opens the menu. Renders a Button unless given another through `render`,
 * such as `render={<IconButton label="App Settings"><GearIcon /></IconButton>}`.
 */
export const MenuTrigger = forwardRef<HTMLButtonElement, MenuTriggerProps>(
  function MenuTrigger(props, ref) {
    const { render, ...rest } = props;
    return (
      <BaseMenu.Trigger ref={ref} render={render ?? <Button />} {...rest} />
    );
  },
);

/* --------------------------------------------------------------- Content */

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

/* ------------------------------------------------------------------ Items */

interface ItemContentProps {
  /** An icon before the label, like MUI's ListItemIcon. */
  icon?: ReactNode;
  /** A second line under the label. */
  description?: ReactNode;
  /** Right-hand text: a keyboard shortcut ("Ctrl K") or a short value. */
  shortcut?: ReactNode;
  /** Leave room for an icon on a row without one, so labels line up. */
  inset?: boolean;
  children?: ReactNode;
}

function ItemContent(props: ItemContentProps & { indicator?: ReactNode }) {
  const { icon, description, shortcut, children, indicator } = props;
  return (
    <>
      {indicator}
      {icon && (
        <span className={menuItemIconStyles} aria-hidden>
          {icon}
        </span>
      )}
      <span className={menuItemLabelStyles}>
        <span>{children}</span>
        {description && (
          <span className={menuItemDescriptionStyles}>{description}</span>
        )}
      </span>
      {shortcut && <span className={menuItemShortcutStyles}>{shortcut}</span>}
    </>
  );
}

/** Text for typeahead when the label is a plain string. */
function textLabel(children: ReactNode, label?: string) {
  if (label !== undefined) return label;
  if (typeof children === "string" || typeof children === "number") {
    return String(children);
  }
  return undefined;
}

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

export interface MenuRadioGroupProps
  extends Omit<ComponentProps<typeof BaseMenu.RadioGroup>, "className"> {
  /** A label shown above the choices, which also names the group. */
  label?: ReactNode;
  className?: string;
}

/** One choice out of several, such as a colour scheme. */
export function MenuRadioGroup(props: MenuRadioGroupProps) {
  const { label, children, ...rest } = props;
  return (
    <BaseMenu.RadioGroup {...rest}>
      {label && (
        <BaseMenu.GroupLabel className={menuGroupLabelStyles}>
          {label}
        </BaseMenu.GroupLabel>
      )}
      {children}
    </BaseMenu.RadioGroup>
  );
}

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

/* ------------------------------------------------------- Groups, separator */

export interface MenuGroupProps {
  /**
   * A small heading over the group, which also names it. Replaces MUI's
   * ListSubheader inside menus.
   */
  label?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function MenuGroup(props: MenuGroupProps) {
  const { label, children, className } = props;
  return (
    <BaseMenu.Group className={className}>
      {label && (
        <BaseMenu.GroupLabel className={menuGroupLabelStyles}>
          {label}
        </BaseMenu.GroupLabel>
      )}
      {children}
    </BaseMenu.Group>
  );
}

export function MenuSeparator(props: { className?: string }) {
  return (
    <BaseMenu.Separator className={cx(menuSeparatorStyles, props.className)} />
  );
}

/* --------------------------------------------------------------- Submenu */

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
