import { NumberField as BaseNumberField } from "@base-ui/react/number-field";
import { Minus, Plus } from "@phosphor-icons/react";
import { CSSProperties, Ref, useRef } from "react";

import { css, cx } from "styled-system/css";

import {
  FieldOwnProps,
  FieldShell,
  fieldIconButtonStyles,
  fieldInputStyles,
  fieldRootStyles,
  fieldShellStyles,
  mergeRefs,
} from "../Field";
import { focusInputOnWellPress } from "../TextField";

export interface NumberFieldProps extends FieldOwnProps {
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
  size?: "sm" | "md";
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

const numberShell = css({
  gap: "1",
  paddingInline: "1",
  "&[data-fit]": { width: "fit-content", maxWidth: "100%" },
});

const numberInput = css({
  textAlign: "center",
  fontFamily: "heading",
  fontWeight: "semibold",
  fontSize: "lg",
  fontVariantNumeric: "tabular-nums",
  lineHeight: "none",
  "[data-fit] > &": {
    width: "calc(var(--number-chars) * 1ch + 1ch)",
    flex: "none",
  },
});

const numberInputSm = css({ fontSize: "md" });

const stepButton = css({
  "[data-size=sm] > &": { width: "24px", height: "24px" },
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
  } = props;
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
      wrap={(content) => (
        <BaseNumberField.Root
          className={fieldRootStyles}
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
        className={cx(fieldShellStyles({ size }), numberShell)}
        data-fit={fullWidth ? undefined : ""}
        data-size={size}
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
            numberInput,
            size === "sm" && numberInputSm,
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
