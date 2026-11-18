import { Field as BaseField } from "@base-ui/react/field";
import { Input as BaseInput } from "@base-ui/react/input";
import { X } from "@phosphor-icons/react";
import {
  ChangeEvent,
  ComponentProps,
  MouseEvent,
  ReactNode,
  forwardRef,
  useRef,
} from "react";

import { LayoutProps, withLayoutProps } from "ui/styles/layoutProps";

import { cx } from "styled-system/css";

import {
  FieldOwnProps,
  FieldShell,
  fieldAdornmentStyles,
  fieldIconButtonStyles,
  fieldInputStyles,
  fieldShellStyles,
  mergeRefs,
  useControllableState,
} from "../Field";
import { Tooltip } from "../Tooltip";

type NativeInputProps = Omit<
  ComponentProps<"input">,
  | "size"
  | "value"
  | "defaultValue"
  | "onChange"
  | "className"
  | "children"
  | "ref"
  | "disabled"
  | "required"
  // The input's own width and height attributes give way to the layout
  // props, which size the whole field.
  | "width"
  | "height"
>;

export interface TextFieldProps
  extends FieldOwnProps,
    NativeInputProps,
    LayoutProps {
  /** The text. Use with `onChange` or `onValueChange`. */
  value?: string;
  /** The starting text when uncontrolled. */
  defaultValue?: string;
  /** The native change event, as with MUI. */
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
  /** The new text, after `onChange`. Also called with "" when cleared. */
  onValueChange?: (value: string) => void;
  /**
   * `sm` (32px, with a smaller muted label) for dense rows, toolbars and
   * details panels; `md` (40px) everywhere else.
   */
  size?: "sm" | "md";
  /**
   * `quiet` shows no border or well until hovered or focused, so the value
   * reads as text, as in a world entry's details.
   */
  variant?: "outline" | "quiet";
  /** An icon or unit before the text, such as a magnifier. */
  startAdornment?: ReactNode;
  /** An icon, unit or button after the text, such as an oracle roll button. */
  endAdornment?: ReactNode;
  /** Shows a clear button while there is text. */
  clearable?: boolean;
  /** The clear button's name and tooltip. */
  clearLabel?: string;
  /** Called after the clear button empties the field. */
  onClear?: () => void;
  /** Class for the field (label, well, help and error together). */
  className?: string;
  /** Class for the well around the input. */
  shellClassName?: string;
  /** Class for the input element itself. */
  inputClassName?: string;
  /** Validation run by Base UI; return an error message or nothing. */
  validate?: ComponentProps<typeof BaseField.Root>["validate"];
  validationMode?: ComponentProps<typeof BaseField.Root>["validationMode"];
}

/** Moves focus to the input when a press lands on the well but not a button. */
export function focusInputOnWellPress(
  event: MouseEvent<HTMLElement>,
  input: HTMLElement | null,
) {
  const target = event.target as HTMLElement;
  if (!input || target === input) return;
  if (target.closest("button, a, input, textarea, select, [role=button]")) {
    return;
  }
  event.preventDefault();
  input.focus();
}

/**
 * A single line text input in an inset well, with its label, help text and
 * error. The ref reaches the input element.
 *
 * ```tsx
 * <TextField label="Character name" required error={nameError} />
 * ```
 */
export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  function TextField(props, ref) {
    const {
      label,
      hideLabel,
      description,
      error,
      invalid,
      required,
      disabled,
      requiredIndicator,
      value: valueProp,
      defaultValue = "",
      onChange,
      onValueChange,
      size = "md",
      variant = "outline",
      startAdornment,
      endAdornment,
      clearable,
      clearLabel = "Clear",
      onClear,
      className,
      shellClassName,
      inputClassName,
      readOnly,
      name,
      validate,
      validationMode,
      ...inputProps
    } = withLayoutProps(props);

    const inputRef = useRef<HTMLInputElement>(null);
    const [value, setValue] = useControllableState(
      valueProp,
      defaultValue,
      onValueChange,
    );

    const showClear = clearable && value !== "" && !disabled && !readOnly;

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
        validate={validate}
        validationMode={validationMode}
        size={size}
      >
        <div
          className={cx(fieldShellStyles({ size, variant }), shellClassName)}
          data-disabled={disabled || undefined}
          data-readonly={readOnly || undefined}
          onMouseDown={(event) =>
            focusInputOnWellPress(event, inputRef.current)
          }
        >
          {startAdornment && (
            <span className={fieldAdornmentStyles}>{startAdornment}</span>
          )}
          <BaseInput
            ref={mergeRefs(ref, inputRef)}
            className={cx(fieldInputStyles, inputClassName)}
            value={value}
            onChange={(event: ChangeEvent<HTMLInputElement>) => {
              onChange?.(event);
              setValue(event.target.value);
            }}
            disabled={disabled}
            required={required}
            readOnly={readOnly}
            name={name}
            // The layout props are gone from `inputProps`, though its type
            // keeps them.
            {...(inputProps as NativeInputProps)}
          />
          {showClear && (
            <Tooltip title={clearLabel}>
              <button
                type="button"
                className={fieldIconButtonStyles}
                aria-label={clearLabel}
                // Keyboard users clear with the keys; one Tab stop per field.
                tabIndex={-1}
                onClick={() => {
                  setValue("");
                  onClear?.();
                  inputRef.current?.focus();
                }}
              >
                <X weight="bold" />
              </button>
            </Tooltip>
          )}
          {endAdornment && (
            <span className={fieldAdornmentStyles}>{endAdornment}</span>
          )}
        </div>
      </FieldShell>
    );
  },
);
