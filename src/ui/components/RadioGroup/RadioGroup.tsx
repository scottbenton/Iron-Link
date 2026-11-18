import { Fieldset as BaseFieldset } from "@base-ui/react/fieldset";
import { Radio as BaseRadio } from "@base-ui/react/radio";
import { RadioGroup as BaseRadioGroup } from "@base-ui/react/radio-group";
import { ReactNode, Ref, createContext, useContext, useId } from "react";

import { LayoutProps, withLayoutProps } from "ui/styles/layoutProps";

import { css, cx } from "styled-system/css";

import {
  ChoiceItem,
  choiceBoxStyles,
  choiceListStyles,
  radioDotStyles,
} from "../Checkbox";
import {
  FieldError,
  FieldOwnProps,
  FieldRoot,
  FieldsetLegend,
  fieldDescriptionStyles,
  fieldsetDescriptionStyles,
  resolveFieldError,
} from "../Field";

const RadioSizeContext = createContext<"sm" | "md">("md");

export interface RadioGroupProps<V = string>
  extends FieldOwnProps,
    LayoutProps {
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
  gap: "2",
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
  } = withLayoutProps(props);
  const { invalid, message } = resolveFieldError(error, invalidProp);
  const descriptionId = useId();
  const hasDescription =
    description !== undefined && description !== null && description !== "";

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
        aria-describedby={hasDescription ? descriptionId : undefined}
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
        {hasDescription && (
          // A plain element, not a Field description: Base UI would add a
          // field's description to every choice inside it, so each one would
          // repeat the group's help. The group alone is described by it.
          <p
            id={descriptionId}
            className={cx(fieldDescriptionStyles, fieldsetDescriptionStyles)}
          >
            {description}
          </p>
        )}
        <RadioSizeContext.Provider value={size}>
          <div className={cx(choiceListStyles({ orientation }), listClassName)}>
            {children}
          </div>
        </RadioSizeContext.Provider>
      </BaseFieldset.Root>
      <FieldError>{message}</FieldError>
    </FieldRoot>
  );
}

export interface RadioProps<V = string> extends LayoutProps {
  /** What choosing this radio sets the group to. */
  value: V;
  /** The text beside the circle, and the radio's name. Pressing it chooses. */
  label?: ReactNode;
  /**
   * A muted line under the label, read as the radio's description. Pressing
   * it chooses too.
   */
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
  } = withLayoutProps(props);
  const size = useContext(RadioSizeContext);
  return (
    <ChoiceItem
      className={className}
      disabled={disabled}
      size={size}
      label={label}
      description={description}
      hasAriaLabel={Boolean(ariaLabel)}
      control={(labelledBy) => (
        <BaseRadio.Root
          ref={ref}
          value={value}
          disabled={disabled}
          aria-label={ariaLabel}
          aria-labelledby={labelledBy}
          className={choiceBoxStyles({ shape: "radio", size })}
        >
          <BaseRadio.Indicator keepMounted className={radioDotStyles} />
        </BaseRadio.Root>
      )}
    />
  );
}
