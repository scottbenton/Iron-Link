import { ToggleGroup as BaseToggleGroup } from "@base-ui/react/toggle-group";
import { ReactNode, Ref } from "react";

import { CssProp, withCssProp } from "ui/styles/cssProp";

import { cva, cx } from "styled-system/css";

import { useControllableState } from "../../hooks/useControllableState";
import { ToggleGroupContext } from "./toggleGroupContext";
import {
  ToggleGroupTone,
  ToggleGroupVariant,
  ToggleSize,
} from "./toggleGroupTypes";

interface ToggleGroupBaseProps extends CssProp {
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
  } = withCssProp(props);

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
