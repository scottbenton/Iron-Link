import { CheckboxGroup as BaseCheckboxGroup } from "@base-ui/react/checkbox-group";
import { Fieldset as BaseFieldset } from "@base-ui/react/fieldset";
import { ReactNode } from "react";

import { css, cx } from "styled-system/css";

import { choiceListStyles } from "../Checkbox";
import {
  FieldDescription,
  FieldError,
  FieldOwnProps,
  FieldRoot,
  FieldsetLegend,
  fieldsetDescriptionStyles,
  resolveFieldError,
} from "../Field";

export interface CheckboxGroupProps extends FieldOwnProps {
  /** The Checkboxes, each with a `value`. */
  children: ReactNode;
  /** The `value`s of the ticked checkboxes, when controlled. */
  value?: string[];
  defaultValue?: string[];
  onValueChange?: (value: string[]) => void;
  /**
   * Every child's `value`. Needed only for a "select all" Checkbox with
   * `parent`.
   */
  allValues?: string[];
  /** Stack the choices (default) or run them in a wrapping row. */
  orientation?: "vertical" | "horizontal";
  /** Submitted with a form, and the key for Form errors. */
  name?: string;
  /** Names the group when there is no visible legend. */
  "aria-label"?: string;
  className?: string;
}

const groupStyles = css({
  boxSizing: "border-box",
  display: "grid",
  gap: "2",
  minWidth: 0,
  margin: 0,
  padding: 0,
  border: 0,
});

/**
 * Several checkboxes under one legend, sharing a description and an error.
 * The legend (`label`) names the group for screen readers.
 *
 * ```tsx
 * <CheckboxGroup label="Expansions" value={expansions} onValueChange={set}>
 *   <Checkbox value="delve" label="Ironsworn: Delve" />
 *   <Checkbox value="starsmith" label="Starsmith" />
 * </CheckboxGroup>
 * ```
 */
export function CheckboxGroup(props: CheckboxGroupProps) {
  const {
    children,
    value,
    defaultValue,
    onValueChange,
    allValues,
    orientation = "vertical",
    name,
    "aria-label": ariaLabel,
    className,
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
          <BaseCheckboxGroup
            value={value}
            defaultValue={defaultValue}
            onValueChange={(next) => onValueChange?.(next)}
            allValues={allValues}
            disabled={disabled}
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
        {description !== undefined && description !== null && (
          <FieldDescription className={fieldsetDescriptionStyles}>
            {description}
          </FieldDescription>
        )}
        <div className={cx(choiceListStyles({ orientation }))}>{children}</div>
      </BaseFieldset.Root>
      <FieldError>{message}</FieldError>
    </FieldRoot>
  );
}
