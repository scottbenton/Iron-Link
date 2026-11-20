import { Toolbar as BaseToolbar } from "@base-ui/react/toolbar";
import { ComponentProps, ReactElement, ReactNode, forwardRef } from "react";

import { cx } from "styled-system/css";

import { Tooltip } from "../Tooltip";
import { buttonStyles } from "./buttonStyles";

export interface ToolbarButtonProps
  extends Omit<
    ComponentProps<typeof BaseToolbar.Button>,
    "className" | "children" | "render"
  > {
  /**
   * The button's name. An icon button shows it as a tooltip; a text button
   * shows it as its text.
   */
  label: string;
  /** The icon. Without one, the label is shown as text. */
  icon?: ReactNode;
  /** Show the label beside the icon. */
  showLabel?: boolean;
  /**
   * A toggle's state, such as Bold being on: `aria-pressed` and a neutral
   * fill. Leave it out for plain actions. For a set of toggles, a
   * `ToggleGroup` with `variant="ghost"` and `tone="neutral"` looks the
   * same and joins the toolbar's arrow keys.
   */
  pressed?: boolean;
  /** A keyboard hint for the tooltip, such as "Ctrl+B". */
  shortcut?: string;
  /**
   * Another trigger to render as this button, such as `<Menu.Trigger />`
   * or `<Select.Trigger />`, so it joins the toolbar's arrow keys.
   */
  render?: ReactElement;
  className?: string;
}

/** A toolbar control: an icon button with a tooltip, a toggle, or text. */
export const ToolbarButton = forwardRef<HTMLButtonElement, ToolbarButtonProps>(
  function ToolbarButton(props, ref) {
    const {
      label,
      icon,
      showLabel,
      pressed,
      shortcut,
      render,
      className,
      ...rest
    } = props;
    const iconOnly = !!icon && !showLabel;
    const button = (
      <BaseToolbar.Button
        ref={ref}
        render={render}
        aria-label={iconOnly ? label : undefined}
        aria-pressed={pressed}
        aria-keyshortcuts={shortcut}
        className={cx(buttonStyles({ iconOnly }), className)}
        {...rest}
      >
        {icon}
        {!iconOnly && label}
      </BaseToolbar.Button>
    );
    if (!iconOnly) return button;
    return (
      <Tooltip title={shortcut ? `${label} (${shortcut})` : label}>
        {button}
      </Tooltip>
    );
  },
);
