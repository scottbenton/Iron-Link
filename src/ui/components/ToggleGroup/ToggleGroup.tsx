import { Toggle as BaseToggle } from "@base-ui/react/toggle";
import { ToggleGroup as BaseToggleGroup } from "@base-ui/react/toggle-group";
import {
  ComponentProps,
  ReactNode,
  Ref,
  createContext,
  useContext,
} from "react";

import { focusRing } from "ui/styles/focus";
import { LayoutProps, withLayoutProps } from "ui/styles/layoutProps";

import { css, cva, cx } from "styled-system/css";

import { useControllableState } from "../Field";
import { Tooltip } from "../Tooltip";

type ToggleSize = "sm" | "md";
export type ToggleGroupTone = "accent" | "neutral";
export type ToggleGroupVariant = "outline" | "ghost";

const ToggleGroupContext = createContext<{
  size: ToggleSize;
  tone: ToggleGroupTone;
  variant: ToggleGroupVariant;
}>({ size: "md", tone: "accent", variant: "outline" });

interface ToggleGroupBaseProps extends LayoutProps {
  /** The ToggleGroupItems. */
  children: ReactNode;
  /** Names the group for screen readers. Required unless a label is nearby. */
  "aria-label"?: string;
  "aria-labelledby"?: string;
  size?: ToggleSize;
  /**
   * The pressed item's colour: the scheme's accent (a tool picker), or
   * neutral greys for controls that should stay quiet, like text
   * formatting.
   */
  tone?: ToggleGroupTone;
  /**
   * Outline is a bordered group; ghost has no border, background or gaps
   * to speak of, so it sits inside a toolbar beside its buttons.
   */
  variant?: ToggleGroupVariant;
  /** Stretch the group to its container, sharing the width between items. */
  fullWidth?: boolean;
  orientation?: "horizontal" | "vertical";
  disabled?: boolean;
  className?: string;
  ref?: Ref<HTMLDivElement>;
}

export interface ToggleGroupSingleProps<V extends string>
  extends ToggleGroupBaseProps {
  multiple?: false;
  /** The pressed item, or null for none, when controlled. */
  value?: V | null;
  defaultValue?: V | null;
  onValueChange?: (value: V | null) => void;
  /**
   * Let pressing the pressed item clear the choice. Off by default, so one
   * item always stays pressed, as a tool picker needs.
   */
  deselectable?: boolean;
}

export interface ToggleGroupMultipleProps<V extends string>
  extends ToggleGroupBaseProps {
  /** Any number of items may be pressed, like Bold and Italic. */
  multiple: true;
  value?: V[];
  defaultValue?: V[];
  onValueChange?: (value: V[]) => void;
  deselectable?: never;
}

export type ToggleGroupProps<V extends string = string> =
  | ToggleGroupSingleProps<V>
  | ToggleGroupMultipleProps<V>;

const groupStyles = cva({
  base: {
    boxSizing: "border-box",
    display: "inline-flex",
    alignItems: "stretch",
    maxWidth: "100%",
    "&[data-orientation=vertical]": { flexDirection: "column" },
    "&[data-full-width]": { display: "flex", width: "100%" },
    "&[data-full-width] > *": { flex: "1 1 0", minWidth: 0 },
  },
  variants: {
    variant: {
      outline: {
        gap: "1",
        padding: "1",
        borderWidth: "1px",
        borderStyle: "solid",
        borderColor: "border.default",
        borderRadius: "md",
        background: "bg.surface",
      },
      ghost: { gap: "0.5" },
    },
  },
  defaultVariants: { variant: "outline" },
});

/**
 * Item states. Hover is a lighter version of the pressed look, so pressing
 * an item changes its fill only, once: its text is already in the pressed
 * colour. A pressed item hovered or held gets a stronger fill. The rules
 * are ordered by specificity, not source order (Panda sorts atomic rules
 * itself): hover and pressed-hover are 0,3,0 and 0,4,0, press is 0,4,0 and
 * sets the same fill as pressed-hover, so no two rules that apply at once
 * disagree. Items have no ledge, so they never move.
 */
const itemStyles = cva({
  base: {
    "--toggle-ring-width": "1px",
    boxSizing: "border-box",
    appearance: "none",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "1.5",
    margin: 0,
    border: 0,
    borderRadius: "sm",
    background: "transparent",
    color: "fg.muted",
    font: "inherit",
    fontFamily: "body",
    fontWeight: "semibold",
    lineHeight: "none",
    whiteSpace: "nowrap",
    cursor: "pointer",
    outline: "none",
    WebkitTapHighlightColor: "transparent",
    // Fill, text and ring move together, on one duration and curve.
    transitionProperty: "background-color, color, box-shadow",
    transitionDuration: "fast",
    transitionTimingFunction: "linear",
    "& > svg": { flex: "none" },
    _hoverable: {
      "&:hover:not([data-pressed], :disabled, [data-disabled])": {
        background: "var(--toggle-hover-bg)",
        color: "var(--toggle-on-fg)",
      },
      "&[data-pressed]:hover:not(:disabled, [data-disabled])": {
        background: "var(--toggle-strong-bg)",
      },
    },
    "&:active:not(:disabled):not([data-disabled])": {
      background: "var(--toggle-strong-bg)",
      color: "var(--toggle-on-fg)",
      transitionDuration: "instant",
    },
    "&[data-pressed]": {
      background: "var(--toggle-on-bg)",
      color: "var(--toggle-on-fg)",
      boxShadow: "inset 0 0 0 var(--toggle-ring-width) var(--toggle-on-ring)",
    },
    _focusVisible: focusRing.outset,
    "&:is(:disabled, [data-disabled])": {
      cursor: "not-allowed",
      background: "transparent",
      color: "fg.disabled",
      boxShadow: "none",
    },
    "&:is(:disabled, [data-disabled])[data-pressed]": {
      background: "bg.muted",
      boxShadow:
        "inset 0 0 0 var(--toggle-ring-width) token(colors.border.default)",
    },
  },
  variants: {
    tone: {
      accent: {
        "--toggle-hover-bg":
          "color-mix(in oklab, token(colors.accent.soft) 60%, transparent)",
        "--toggle-on-bg": "{colors.accent.soft}",
        "--toggle-on-fg": "{colors.accent.fg}",
        "--toggle-on-ring": "{colors.accent.solid}",
        "--toggle-strong-bg":
          "color-mix(in oklab, token(colors.accent.fg) 12%, token(colors.accent.soft))",
      },
      neutral: {
        "--toggle-hover-bg": "{colors.overlay.hover}",
        "--toggle-on-bg": "{colors.overlay.selected}",
        "--toggle-on-fg": "{colors.fg.default}",
        "--toggle-on-ring": "{colors.border.default}",
        "--toggle-strong-bg": "{colors.overlay.pressed}",
      },
    },
    variant: {
      outline: {},
      // No ring: the fill alone marks the pressed item.
      ghost: { "--toggle-ring-width": "0px" },
    },
    size: {
      sm: {
        minHeight: "control.xs",
        minWidth: "control.xs",
        paddingInline: "2",
        fontSize: "sm",
        "& > svg": { width: "icon.md", height: "icon.md" },
      },
      md: {
        minHeight: "34px",
        minWidth: "34px",
        paddingInline: "3",
        fontSize: "sm",
        "& > svg": { width: "icon.md", height: "icon.md" },
      },
    },
    iconOnly: { true: { paddingInline: 0 } },
  },
  compoundVariants: [
    // The same size as a ToolbarButton, so a ghost group lines up in a bar.
    {
      variant: "ghost",
      size: "md",
      css: {
        minHeight: "control.sm",
        minWidth: "control.sm",
        paddingInline: "2",
      },
    },
    {
      variant: "ghost",
      size: "md",
      iconOnly: true,
      css: { paddingInline: 0 },
    },
  ],
  defaultVariants: { tone: "accent", variant: "outline", size: "md" },
});

const touchItem = css({ _touch: { minHeight: "touch", minWidth: "touch" } });

/**
 * A row of buttons that stay pressed: a tool picker, a view switch, text
 * formatting. One item at a time by default; `multiple` lets any number be
 * pressed. For a choice between views of the same content, a
 * SegmentedControl reads better. `tone="neutral"` keeps it grey, and
 * `variant="ghost"` drops the border so it can sit in a Toolbar, where its
 * items join the toolbar's arrow keys.
 *
 * ```tsx
 * <ToggleGroup aria-label="Tool" value={tool} onValueChange={setTool}>
 *   <ToggleGroupItem value="pan" label="Pan"><HandGrabbing /></ToggleGroupItem>
 *   <ToggleGroupItem value="paint" label="Paint"><PaintBrush /></ToggleGroupItem>
 * </ToggleGroup>
 * ```
 */
export function ToggleGroup<V extends string = string>(
  props: ToggleGroupProps<V>,
) {
  const {
    children,
    "aria-label": ariaLabel,
    "aria-labelledby": ariaLabelledBy,
    size = "md",
    tone = "accent",
    variant = "outline",
    fullWidth,
    orientation = "horizontal",
    disabled,
    className,
    ref,
  } = withLayoutProps(props);

  const single = !props.multiple;
  const [current, setCurrent] = useControllableState<V[]>(
    props.value === undefined
      ? undefined
      : single
        ? props.value === null
          ? []
          : [props.value as V]
        : (props.value as V[]),
    single
      ? props.defaultValue
        ? [props.defaultValue as V]
        : []
      : ((props.defaultValue as V[] | undefined) ?? []),
    (next) => {
      if (props.multiple) props.onValueChange?.(next);
      else props.onValueChange?.(next[0] ?? null);
    },
  );

  return (
    <ToggleGroupContext.Provider value={{ size, tone, variant }}>
      <BaseToggleGroup<V>
        ref={ref}
        className={cx(groupStyles({ variant }), className)}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        data-full-width={fullWidth ? "" : undefined}
        orientation={orientation}
        disabled={disabled}
        multiple={!single}
        value={current}
        onValueChange={(next) => {
          if (single && next.length === 0 && !props.deselectable) return;
          setCurrent(next);
        }}
      >
        {children}
      </BaseToggleGroup>
    </ToggleGroupContext.Provider>
  );
}

export interface ToggleGroupItemProps<V extends string = string>
  extends Omit<
    ComponentProps<"button">,
    "value" | "className" | "children" | "ref" | "type"
  > {
  /** What pressing this item sets the group to. */
  value: V;
  /**
   * The item's name. With text `children` it is not needed; with an icon
   * alone it names the button and shows as its tooltip.
   */
  label?: string;
  /** An icon, text, or both. */
  children?: ReactNode;
  disabled?: boolean;
  /** Tooltip side for an icon-only item. */
  tooltipSide?: "top" | "bottom" | "left" | "right";
  className?: string;
  ref?: Ref<HTMLButtonElement>;
}

function isIconOnly(children: ReactNode) {
  if (typeof children === "string" || typeof children === "number") {
    return false;
  }
  if (Array.isArray(children)) {
    return !children.some(
      (child) => typeof child === "string" || typeof child === "number",
    );
  }
  return true;
}

/** One button in a ToggleGroup. */
export function ToggleGroupItem<V extends string = string>(
  props: ToggleGroupItemProps<V>,
) {
  const {
    value,
    label,
    children,
    disabled,
    tooltipSide,
    className,
    ref,
    ...buttonProps
  } = props;
  const { size, tone, variant } = useContext(ToggleGroupContext);
  const iconOnly = label !== undefined && isIconOnly(children);

  const button = (
    <BaseToggle<V>
      ref={ref}
      value={value}
      disabled={disabled}
      aria-label={iconOnly ? label : undefined}
      className={cx(
        itemStyles({ size, tone, variant, iconOnly }),
        touchItem,
        className,
      )}
      {...buttonProps}
    >
      {children ?? label}
    </BaseToggle>
  );

  return iconOnly ? (
    <Tooltip title={label} side={tooltipSide}>
      {button}
    </Tooltip>
  ) : (
    button
  );
}
