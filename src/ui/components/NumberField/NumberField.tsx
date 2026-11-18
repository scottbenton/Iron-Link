import { NumberField as BaseNumberField } from "@base-ui/react/number-field";
import { Minus, Plus } from "@phosphor-icons/react";
import { CSSProperties, Ref, useRef } from "react";

import { LayoutProps, withLayoutProps } from "ui/styles/layoutProps";

import { css, cva, cx } from "styled-system/css";

import {
  FieldOwnProps,
  FieldShell,
  fieldIconButtonStyles,
  fieldInputStyles,
  fieldRootRecipe,
  fieldShellStyles,
  mergeRefs,
} from "../Field";
import { focusInputOnWellPress } from "../TextField";

export interface NumberFieldProps extends FieldOwnProps, LayoutProps {
  /** The number, or null while empty, when controlled. */
  value?: number | null;
  defaultValue?: number;
  /** Called on every change: typing, the buttons, arrow keys. */
  onValueChange?: (value: number | null) => void;
  /** Called once a change settles: on blur, a button press, a key. */
  onValueCommitted?: (value: number | null) => void;
  min?: number;
  max?: number;
  /** The step of the buttons and arrow keys. Default 1. */
  step?: number;
  /** The step with Alt held. */
  smallStep?: number;
  /** The step with Shift held, and of Page Up and Page Down. */
  largeStep?: number;
  /** How the number is shown, such as a unit or fraction digits. */
  format?: Intl.NumberFormatOptions;
  /** Show "+" before positive numbers, as stats and adds do (+2, 0, -1). */
  showSign?: boolean;
  /** Hide the - and + buttons; arrow keys still step. */
  hideButtons?: boolean;
  /** Stretch to the container. By default the field fits its number. */
  fullWidth?: boolean;
  /** Characters the input is sized for when not `fullWidth`. */
  chars?: number;
  /**
   * `sm` (32px, with a smaller muted label) for dense rows and details
   * panels; `md` (40px) everywhere else.
   */
  size?: "sm" | "md";
  /**
   * `quiet` shows no border or well until hovered or focused, so the number
   * reads as text, as in a world entry's details.
   */
  variant?: "outline" | "quiet";
  name?: string;
  readOnly?: boolean;
  placeholder?: string;
  /** Names the field when there is no visible label. */
  "aria-label"?: string;
  /** The name of the - button. */
  decrementLabel?: string;
  /** The name of the + button. */
  incrementLabel?: string;
  id?: string;
  className?: string;
  inputClassName?: string;
  ref?: Ref<HTMLInputElement>;
}

// Every rule below is keyed on `[data-number-field]` as well as its class,
// so it outranks the shared field styles it changes whatever the stylesheet
// order (two plain classes setting one property would race).
const numberShell = css({
  "&[data-number-field]": {
    gap: "1",
    paddingInline: "1",
  },
  "&[data-number-field][data-fit]": {
    width: "fit-content",
    maxWidth: "100%",
  },
  // A quiet field reaches past its column by `spacing.2` plus its border,
  // so its first button lines up with the label.
  "&[data-number-field][data-variant=quiet]": { paddingInline: "2" },
  "&[data-number-field][data-variant=quiet][data-fit]": {
    width: "fit-content",
    maxWidth: "calc(100% + 2 * (1px + token(spacing.2)))",
  },
});

const numberInput = cva({
  base: {
    "[data-number-field] > &": {
      textAlign: "center",
      fontFamily: "heading",
      fontWeight: "bold",
      fontSize: "lg",
      fontVariantNumeric: "tabular-nums",
      lineHeight: "none",
    },
    "[data-number-field][data-fit] > &": {
      width: "calc(var(--number-chars) * 1ch + 1ch)",
      flex: "none",
    },
  },
  variants: {
    size: {
      sm: { "[data-number-field] > &": { fontSize: "md" } },
      md: {},
    },
  },
  defaultVariants: { size: "md" },
});

const stepButton = css({
  "[data-number-field][data-size=sm] > &": {
    width: "24px",
    height: "24px",
    _touch: { width: "32px", height: "32px" },
  },
});

/**
 * A number with - and + buttons, for stat values (-2 to +5), adds, momentum
 * and counts. Arrow keys step, Shift steps by `largeStep`, and the value is
 * kept between `min` and `max`.
 *
 * ```tsx
 * <NumberField label="Edge" min={1} max={3} value={edge} onValueChange={setEdge} />
 * ```
 */
export function NumberField(props: NumberFieldProps) {
  const {
    value,
    defaultValue,
    onValueChange,
    onValueCommitted,
    min,
    max,
    step,
    smallStep,
    largeStep,
    format,
    showSign,
    hideButtons,
    fullWidth,
    chars = 3,
    size = "md",
    variant = "outline",
    name,
    readOnly,
    placeholder,
    "aria-label": ariaLabel,
    decrementLabel = "Decrease",
    incrementLabel = "Increase",
    id,
    className,
    inputClassName,
    ref,
    label,
    hideLabel,
    description,
    error,
    invalid,
    required,
    disabled,
    requiredIndicator,
  } = withLayoutProps(props);
  const inputRef = useRef<HTMLInputElement>(null);
  const resolvedFormat: Intl.NumberFormatOptions | undefined = showSign
    ? { signDisplay: "exceptZero", ...format }
    : format;

  return (
    <FieldShell
      label={label}
      hideLabel={hideLabel}
      description={description}
      error={error}
      invalid={invalid}
      required={required}
      disabled={disabled}
      requiredIndicator={requiredIndicator}
      name={name}
      className={className}
      size={size}
      wrap={(content) => (
        <BaseNumberField.Root
          className={fieldRootRecipe({ size })}
          id={id}
          value={value}
          defaultValue={defaultValue}
          onValueChange={(next) => onValueChange?.(next)}
          onValueCommitted={(next) => onValueCommitted?.(next)}
          min={min}
          max={max}
          step={step}
          smallStep={smallStep}
          largeStep={largeStep}
          format={resolvedFormat}
          name={name}
          disabled={disabled}
          readOnly={readOnly}
          required={required}
        >
          {content}
        </BaseNumberField.Root>
      )}
    >
      <BaseNumberField.Group
        className={cx(fieldShellStyles({ size, variant }), numberShell)}
        data-number-field=""
        data-fit={fullWidth ? undefined : ""}
        data-size={size}
        data-variant={variant}
        data-disabled={disabled || undefined}
        data-readonly={readOnly || undefined}
        style={{ "--number-chars": chars } as CSSProperties}
        onMouseDown={(event) => focusInputOnWellPress(event, inputRef.current)}
      >
        {!hideButtons && !readOnly && (
          <BaseNumberField.Decrement
            className={cx(fieldIconButtonStyles, stepButton)}
            aria-label={decrementLabel}
          >
            <Minus weight="bold" />
          </BaseNumberField.Decrement>
        )}
        <BaseNumberField.Input
          ref={mergeRefs(ref, inputRef)}
          className={cx(
            fieldInputStyles,
            numberInput({ size }),
            inputClassName,
          )}
          placeholder={placeholder}
          aria-label={ariaLabel}
        />
        {!hideButtons && !readOnly && (
          <BaseNumberField.Increment
            className={cx(fieldIconButtonStyles, stepButton)}
            aria-label={incrementLabel}
          >
            <Plus weight="bold" />
          </BaseNumberField.Increment>
        )}
      </BaseNumberField.Group>
    </FieldShell>
  );
}
