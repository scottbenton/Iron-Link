import { Toolbar as BaseToolbar } from "@base-ui/react/toolbar";
import { ComponentProps, ReactElement, ReactNode, forwardRef } from "react";

import { LayoutProps, withLayoutProps } from "ui/styles/layoutProps";

import { css, cva, cx } from "styled-system/css";

import { Tooltip } from "../Tooltip";

const rootStyles = cva({
  base: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: "0.5",
    boxSizing: "border-box",
    fontFamily: "body",
    "&[data-orientation=vertical]": {
      flexDirection: "column",
      alignItems: "stretch",
    },
  },
  variants: {
    variant: {
      /** A bar across the top of an editor: surface, padding, a hairline. */
      bar: {
        paddingBlock: "1.5",
        paddingInline: "2",
        background: "bg.surface",
        borderBottom: "1px solid token(colors.border.subtle)",
      },
      /** Just the controls, for a toolbar inside something else. */
      plain: {},
    },
  },
  defaultVariants: { variant: "bar" },
});

export interface ToolbarProps
  extends Omit<ComponentProps<typeof BaseToolbar.Root>, "className">,
    LayoutProps {
  /** Names the toolbar, such as "Formatting". */
  "aria-label": string;
  variant?: "bar" | "plain";
  className?: string;
}

/**
 * A row of controls with one Tab stop: arrow keys, Home and End move
 * between them (a roving tab index). Build it from `ToolbarButton`s,
 * `ToolbarGroup`s and `ToolbarSeparator`s, as in the rich text editor.
 */
export const Toolbar = forwardRef<HTMLDivElement, ToolbarProps>(
  function Toolbar(props, ref) {
    const { variant, className, ...rest } = withLayoutProps(props);
    return (
      <BaseToolbar.Root
        ref={ref}
        className={cx(rootStyles({ variant }), className)}
        {...rest}
      />
    );
  },
);

export interface ToolbarGroupProps
  extends Omit<ComponentProps<typeof BaseToolbar.Group>, "className"> {
  /** Names the group for screen readers, such as "Text style". */
  "aria-label"?: string;
  className?: string;
}

/** Related controls kept together, such as bold, italic and strikethrough. */
export const ToolbarGroup = forwardRef<HTMLDivElement, ToolbarGroupProps>(
  function ToolbarGroup(props, ref) {
    const { className, ...rest } = props;
    return (
      <BaseToolbar.Group
        ref={ref}
        className={cx(
          css({ display: "flex", alignItems: "center", gap: "0.5" }),
          className,
        )}
        {...rest}
      />
    );
  },
);

export interface ToolbarSeparatorProps
  extends Omit<ComponentProps<typeof BaseToolbar.Separator>, "className"> {
  className?: string;
}

/** A hairline between groups. */
export function ToolbarSeparator(props: ToolbarSeparatorProps) {
  const { className, ...rest } = props;
  return (
    <BaseToolbar.Separator
      className={cx(
        css({
          flex: "none",
          width: "1px",
          height: "20px",
          marginInline: "1",
          background: "border.default",
          "&[data-orientation=horizontal]": {
            width: "auto",
            height: "1px",
            marginInline: 0,
            marginBlock: "1",
          },
        }),
        className,
      )}
      {...rest}
    />
  );
}

const buttonStyles = cva({
  base: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "1.5",
    flex: "none",
    boxSizing: "border-box",
    height: "32px",
    margin: 0,
    border: 0,
    borderRadius: "sm",
    background: "transparent",
    color: "fg.muted",
    fontFamily: "body",
    fontWeight: "semibold",
    fontSize: "sm",
    whiteSpace: "nowrap",
    cursor: "pointer",
    userSelect: "none",
    WebkitTapHighlightColor: "transparent",
    // Toolbar buttons have no ledge: they never move, they change colour,
    // fill and text together. A pressed toggle is a neutral overlay fill,
    // like a ghost, neutral ToggleGroup, so the bar stays quiet. The rules
    // rely on specificity, not source order (Panda sorts atomic rules):
    // hover 0,3,0; a held press and a hovered pressed toggle 0,4,0 with the
    // same fill.
    transition:
      "background-color token(durations.fast) linear, color token(durations.fast) linear",
    outline: "none",
    _hoverable: {
      "&:hover:not([aria-pressed=true], :disabled, [data-disabled])": {
        background: "overlay.hover",
        color: "fg.default",
      },
      "&[aria-pressed=true]:hover:not(:disabled, [data-disabled])": {
        background: "overlay.pressed",
      },
    },
    "&:is(:active, [data-pressed]):not(:disabled):not([data-disabled])": {
      background: "overlay.pressed",
      color: "fg.default",
      transitionDuration: "instant",
    },
    "&[aria-pressed=true]": {
      background: "overlay.selected",
      color: "fg.default",
    },
    _focusVisible: {
      outline: "2px solid token(colors.focusRing)",
      outlineOffset: "0",
    },
    "&:is(:disabled, [data-disabled])": {
      cursor: "not-allowed",
      color: "fg.disabled",
      background: "transparent",
    },
    "& svg": { flex: "none", width: "18px", height: "18px" },
    _touch: { height: "touch" },
  },
  variants: {
    iconOnly: {
      true: { width: "32px", padding: 0, _touch: { width: "touch" } },
      false: { paddingInline: "2" },
    },
  },
});

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

export interface ToolbarLinkProps
  extends Omit<ComponentProps<typeof BaseToolbar.Link>, "className"> {
  className?: string;
}

/** A link in a toolbar, such as Help. */
export const ToolbarLink = forwardRef<HTMLAnchorElement, ToolbarLinkProps>(
  function ToolbarLink(props, ref) {
    const { className, ...rest } = props;
    return (
      <BaseToolbar.Link
        ref={ref}
        className={cx(
          buttonStyles({ iconOnly: false }),
          css({ textDecoration: "none" }),
          className,
        )}
        {...rest}
      />
    );
  },
);

/** Text at the end of a toolbar, such as "Saved". Pushes itself right. */
export function ToolbarStatus(props: ComponentProps<"span">) {
  const { className, ...rest } = props;
  return (
    <span
      className={cx(
        css({
          marginInlineStart: "auto",
          paddingInline: "2",
          fontSize: "xs",
          color: "fg.subtle",
        }),
        className,
      )}
      {...rest}
    />
  );
}
