import { Field as BaseField } from "@base-ui/react/field";
import { Fieldset as BaseFieldset } from "@base-ui/react/fieldset";
import { Radio as BaseRadio } from "@base-ui/react/radio";
import { RadioGroup as BaseRadioGroup } from "@base-ui/react/radio-group";
import { ReactNode, Ref, createContext, useContext } from "react";

import { css, cx } from "styled-system/css";

import {
  ChoiceItem,
  choiceBoxStyles,
  choiceDescriptionStyles,
  choiceLabelStyles,
  choiceListStyles,
  radioDotStyles,
} from "../Checkbox";
import {
  FieldDescription,
  FieldError,
  FieldOwnProps,
  FieldRoot,
  FieldsetLegend,
  resolveFieldError,
} from "../Field";

const RadioSizeContext = createContext<"sm" | "md">("md");

export interface RadioGroupProps<V = string> extends FieldOwnProps {
  /** The Radios. */
  children: ReactNode;
  /** The chosen value, when controlled. */
  value?: V;
  defaultValue?: V;
  onValueChange?: (value: V) => void;
  /** Stack the choices (default) or run them in a wrapping row. */
  orientation?: "vertical" | "horizontal";
  /** Size of every Radio inside. */
  size?: "sm" | "md";
  /** Submitted with a form, and the key for Form errors. */
  name?: string;
  readOnly?: boolean;
  /** Names the group when there is no visible legend. */
  "aria-label"?: string;
  className?: string;
  /** Class for the element that lays out the radios. */
  listClassName?: string;
}

const groupStyles = css({
  boxSizing: "border-box",
  display: "grid",
  gap: "1",
  minWidth: 0,
  margin: 0,
  padding: 0,
  border: 0,
  outline: "none",
});

/**
 * One choice from a few, all visible at once. The legend (`label`) names the
 * group; arrow keys move between the radios.
 *
 * ```tsx
 * <RadioGroup label="Game type" value={type} onValueChange={setType}
 *   orientation="horizontal">
 *   <Radio value="solo" label="Solo" />
 *   <Radio value="co-op" label="Co-op" />
 *   <Radio value="guided" label="Guided" />
 * </RadioGroup>
 * ```
 */
export function RadioGroup<V = string>(props: RadioGroupProps<V>) {
  const {
    children,
    value,
    defaultValue,
    onValueChange,
    orientation = "vertical",
    size = "md",
    name,
    readOnly,
    "aria-label": ariaLabel,
    className,
    listClassName,
    label,
    hideLabel,
    description,
    error,
    invalid: invalidProp,
    required,
    disabled,
    requiredIndicator,
  } = props;
  const { invalid, message } = resolveFieldError(error, invalidProp);

  return (
    <FieldRoot
      className={className}
      name={name}
      invalid={invalid || undefined}
      disabled={disabled}
    >
      <BaseFieldset.Root
        className={groupStyles}
        aria-label={ariaLabel}
        render={
          <BaseRadioGroup<V>
            value={value}
            defaultValue={defaultValue}
            onValueChange={(next) => onValueChange?.(next)}
            disabled={disabled}
            readOnly={readOnly}
            required={required}
            name={name}
          />
        }
      >
        {label !== undefined && label !== null && (
          <FieldsetLegend
            hidden={hideLabel}
            required={required}
            requiredIndicator={requiredIndicator}
          >
            {label}
          </FieldsetLegend>
        )}
        <RadioSizeContext.Provider value={size}>
          <div className={cx(choiceListStyles({ orientation }), listClassName)}>
            {children}
          </div>
        </RadioSizeContext.Provider>
      </BaseFieldset.Root>
      {description !== undefined && description !== null && (
        <FieldDescription>{description}</FieldDescription>
      )}
      <FieldError>{message}</FieldError>
    </FieldRoot>
  );
}

export interface RadioProps<V = string> {
  /** What choosing this radio sets the group to. */
  value: V;
  /** The text beside the circle. Pressing it chooses the radio. */
  label?: ReactNode;
  /** A muted line under the label, read as the radio's description. */
  description?: ReactNode;
  disabled?: boolean;
  /** Names the radio when there is no visible label. */
  "aria-label"?: string;
  className?: string;
  ref?: Ref<HTMLElement>;
}

/** One choice in a RadioGroup. */
export function Radio<V = string>(props: RadioProps<V>) {
  const {
    value,
    label,
    description,
    disabled,
    "aria-label": ariaLabel,
    className,
    ref,
  } = props;
  const size = useContext(RadioSizeContext);
  const hasDescription =
    description !== undefined && description !== null && description !== "";

  return (
    <ChoiceItem className={className} disabled={disabled}>
      <BaseField.Label
        className={choiceLabelStyles({ size })}
        data-disabled={disabled || undefined}
      >
        <BaseRadio.Root
          ref={ref}
          value={value}
          disabled={disabled}
          aria-label={ariaLabel}
          className={choiceBoxStyles({ shape: "radio", size })}
        >
          <BaseRadio.Indicator keepMounted className={radioDotStyles} />
        </BaseRadio.Root>
        {label}
      </BaseField.Label>
      {hasDescription && (
        <BaseField.Description className={choiceDescriptionStyles({ size })}>
          {description}
        </BaseField.Description>
      )}
    </ChoiceItem>
  );
}
