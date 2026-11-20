import { Field as BaseField } from "@base-ui/react/field";
import { ComponentProps, ComponentType, ReactNode } from "react";

import { css, cx } from "styled-system/css";
import { visuallyHidden } from "styled-system/patterns";

import { FieldDescription } from "./FieldDescription";
import { FieldError } from "./FieldError";
import { FieldLabel } from "./FieldLabel";
import { FieldRoot } from "./FieldRoot";
import {
  fieldLabelRecipe,
  fieldLabelRowStyles,
  fieldRequiredStyles,
} from "./fieldStyles";
import { FieldOwnProps, FieldSize } from "./fieldTypes";
import { resolveFieldError } from "./resolveFieldError";
import { useInField } from "./useInField";

/** What a control hands `FieldShell` to label it. */
export interface FieldShellProps extends FieldOwnProps {
  children: ReactNode;
  /** Wraps the label and the control, such as a Select's root. */
  wrap?: (content: ReactNode) => ReactNode;
  /**
   * The label part to render, for controls with their own (Select.Label).
   * Defaults to Field.Label, a native label.
   */
  labelPart?: ComponentType<{ className?: string; children?: ReactNode }>;
  /** Shown at the end of the label row, such as a slider's value. */
  labelAccessory?: ReactNode;
  /** The field's name, for form submission and Form errors. */
  name?: string;
  /** Class for the field root (label, control, help and error together). */
  className?: string;
  /** Passed to Field.Root for Base UI validation. */
  validate?: ComponentProps<typeof BaseField.Root>["validate"];
  validationMode?: ComponentProps<typeof BaseField.Root>["validationMode"];
  /** `sm` gives a smaller, muted label and tighter spacing. */
  size?: FieldSize;
}

const hiddenLabelRow = css({ display: "contents" });

/**
 * The frame a control renders itself in: a Field.Root with the label above
 * the control and its help text and error below it. Inside an outer `Field` it renders the control alone
 * (wrapped), so the outer field labels it.
 */
export function FieldShell(props: FieldShellProps) {
  const {
    children,
    wrap = (content: ReactNode) => content,
    labelPart: LabelPart,
    labelAccessory,
    label,
    hideLabel,
    description,
    error,
    invalid: invalidProp,
    required,
    disabled,
    requiredIndicator = "*",
    name,
    className,
    validate,
    validationMode,
    size = "md",
  } = props;
  const inField = useInField();
  if (inField) return <>{wrap(children)}</>;

  const { invalid, message } = resolveFieldError(error, invalidProp);

  const marker = required ? (
    <span className={fieldRequiredStyles} aria-hidden>
      {requiredIndicator}
    </span>
  ) : null;

  let labelNode: ReactNode = null;
  if (label !== undefined && label !== null) {
    labelNode = LabelPart ? (
      <LabelPart
        className={cx(
          fieldLabelRecipe({ size }),
          hideLabel && visuallyHidden(),
        )}
      >
        {label}
        {marker}
      </LabelPart>
    ) : (
      <FieldLabel
        hidden={hideLabel}
        required={required}
        requiredIndicator={requiredIndicator}
        size={size}
      >
        {label}
      </FieldLabel>
    );
    if (labelAccessory) {
      labelNode = (
        <div className={hideLabel ? hiddenLabelRow : fieldLabelRowStyles}>
          {labelNode}
          {labelAccessory}
        </div>
      );
    }
  }

  // Help text sits under the control, like MUI's helper text, so fields
  // side by side line up whether or not they have any. The error goes after
  // it.
  const descriptionNode =
    description !== undefined && description !== null && description !== "" ? (
      <FieldDescription>{description}</FieldDescription>
    ) : null;

  return (
    <FieldRoot
      className={className}
      size={size}
      invalid={invalid || undefined}
      disabled={disabled}
      name={name}
      validate={validate}
      validationMode={validationMode}
    >
      {wrap(
        <>
          {labelNode}
          {children}
        </>,
      )}
      {descriptionNode}
      <FieldError>{message}</FieldError>
    </FieldRoot>
  );
}
