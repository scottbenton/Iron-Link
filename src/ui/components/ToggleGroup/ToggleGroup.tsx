import { Toggle as BaseToggle } from "@base-ui/react/toggle";
import { ToggleGroup as BaseToggleGroup } from "@base-ui/react/toggle-group";
import {
  ComponentProps,
  ReactNode,
  Ref,
  createContext,
  useContext,
} from "react";

import { css, cva, cx } from "styled-system/css";

import { useControllableState } from "../Field";
import { Tooltip } from "../Tooltip";

type ToggleSize = "sm" | "md";

const ToggleGroupContext = createContext<{ size: ToggleSize }>({ size: "md" });

interface ToggleGroupBaseProps {
  /** The ToggleGroupItems. */
  children: ReactNode;
  /** Names the group for screen readers. Required unless a label is nearby. */
  "aria-label"?: string;
  "aria-labelledby"?: string;
  size?: ToggleSize;
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

const groupStyles = css({
  boxSizing: "border-box",
  display: "inline-flex",
  alignItems: "stretch",
  gap: "1",
  padding: "1",
  maxWidth: "100%",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "border.default",
  borderRadius: "md",
  background: "bg.surface",
  "&[data-orientation=vertical]": { flexDirection: "column" },
  "&[data-full-width]": { display: "flex", width: "100%" },
  "&[data-full-width] > *": { flex: "1 1 0", minWidth: 0 },
});

const itemStyles = cva({
  base: {
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
    transitionProperty: "background-color, color, box-shadow",
    transitionDuration: "fast",
    transitionTimingFunction: "linear",
    "& > svg": { flex: "none" },
    _hover: { background: "overlay.hover", color: "fg.default" },
    "&:active": {
      background: "overlay.pressed",
      transitionDuration: "instant",
    },
    _focusVisible: {
      outline: "2px solid token(colors.focusRing)",
      outlineOffset: "1px",
    },
    "&[data-pressed]": {
      background: "accent.soft",
      color: "accent.fg",
      boxShadow: "inset 0 0 0 1px token(colors.accent.solid)",
    },
    "&:is(:disabled, [data-disabled])": {
      cursor: "not-allowed",
      background: "transparent",
      color: "fg.disabled",
      boxShadow: "none",
    },
    "&:is(:disabled, [data-disabled])[data-pressed]": {
      background: "bg.muted",
      boxShadow: "inset 0 0 0 1px token(colors.border.default)",
    },
  },
  variants: {
    size: {
      sm: {
        minHeight: "28px",
        minWidth: "28px",
        paddingInline: "2",
        fontSize: "sm",
        "& > svg": { width: "16px", height: "16px" },
      },
      md: {
        minHeight: "34px",
        minWidth: "34px",
        paddingInline: "3",
        fontSize: "sm",
        "& > svg": { width: "18px", height: "18px" },
      },
    },
    iconOnly: { true: { paddingInline: 0 } },
  },
});

const touchItem = css({ _touch: { minHeight: "touch", minWidth: "touch" } });

/**
 * A row of buttons that stay pressed: a tool picker, a view switch, text
 * formatting. One item at a time by default; `multiple` lets any number be
 * pressed. For a choice between views of the same content, a
 * SegmentedControl reads better.
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
    fullWidth,
    orientation = "horizontal",
    disabled,
    className,
    ref,
  } = props;

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
    <ToggleGroupContext.Provider value={{ size }}>
      <BaseToggleGroup<V>
        ref={ref}
        className={cx(groupStyles, className)}
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
  const { size } = useContext(ToggleGroupContext);
  const iconOnly = label !== undefined && isIconOnly(children);

  const button = (
    <BaseToggle<V>
      ref={ref}
      value={value}
      disabled={disabled}
      aria-label={iconOnly ? label : undefined}
      className={cx(itemStyles({ size, iconOnly }), touchItem, className)}
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
