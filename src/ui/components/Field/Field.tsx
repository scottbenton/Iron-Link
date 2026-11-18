import { Field as BaseField } from "@base-ui/react/field";
import { Fieldset as BaseFieldset } from "@base-ui/react/fieldset";
import { WarningCircle } from "@phosphor-icons/react";
import {
  ComponentProps,
  ComponentType,
  ReactNode,
  createContext,
  useContext,
} from "react";

import { css, cx } from "styled-system/css";
import { visuallyHidden } from "styled-system/patterns";

import {
  fieldDescriptionStyles,
  fieldErrorStyles,
  fieldLabelRowStyles,
  fieldLabelStyles,
  fieldRequiredStyles,
  fieldRootStyles,
} from "./fieldStyles";

/** True inside a `Field`, so a control inside one does not open another. */
const InFieldContext = createContext(false);

/** Whether the caller is inside a `Field` (or `FieldRoot`). */
export function useInField() {
  return useContext(InFieldContext);
}

/**
 * The props every form control shares for its label, help text and error.
 * Controls take them directly, MUI style (`<TextField label error />`), and
 * wire them to the control with aria for you.
 */
export interface FieldOwnProps {
  /** The visible label. Leave it out only when `aria-label` names the control. */
  label?: ReactNode;
  /** Keep the label for screen readers but hide it from view. */
  hideLabel?: boolean;
  /** Help text under the control, read as its description. */
  description?: ReactNode;
  /**
   * An error message under the control. Any message marks the field invalid;
   * `true` marks it invalid without a message.
   */
  error?: ReactNode;
  /** Marks the field invalid without a message (use `error` for one). */
  invalid?: boolean;
  /** The control must be filled. Adds a marker after the label. */
  required?: boolean;
  disabled?: boolean;
  /** The marker after a required field's label. Hidden from screen readers. */
  requiredIndicator?: ReactNode;
}

/** Whether an `error` prop marks the field invalid, and its message. */
export function resolveFieldError(error: ReactNode, invalid?: boolean) {
  const hasError =
    error !== undefined && error !== null && error !== false && error !== "";
  return {
    invalid: Boolean(invalid) || hasError,
    message: hasError && error !== true ? error : undefined,
  };
}

export interface FieldRootProps
  extends Omit<ComponentProps<typeof BaseField.Root>, "className"> {
  className?: string;
}

/**
 * Groups a label, a control, help text and an error, and wires them with
 * aria. Most callers want `Field`, or a control's own `label` props.
 */
export function FieldRoot(props: FieldRootProps) {
  const { className, ...rest } = props;
  return (
    <InFieldContext.Provider value>
      <BaseField.Root className={cx(fieldRootStyles, className)} {...rest} />
    </InFieldContext.Provider>
  );
}

export interface FieldLabelProps
  extends Omit<ComponentProps<typeof BaseField.Label>, "className"> {
  className?: string;
  required?: boolean;
  requiredIndicator?: ReactNode;
  hidden?: boolean;
}

/** The field's label, tied to its control. */
export function FieldLabel(props: FieldLabelProps) {
  const {
    className,
    required,
    requiredIndicator = "*",
    hidden,
    children,
    ...rest
  } = props;
  return (
    <BaseField.Label
      className={cx(fieldLabelStyles, hidden && visuallyHidden(), className)}
      {...rest}
    >
      {children}
      {required && (
        <span className={fieldRequiredStyles} aria-hidden>
          {requiredIndicator}
        </span>
      )}
    </BaseField.Label>
  );
}

export interface FieldDescriptionProps
  extends Omit<ComponentProps<typeof BaseField.Description>, "className"> {
  className?: string;
}

/** Help text under a control, read as its description. */
export function FieldDescription(props: FieldDescriptionProps) {
  const { className, ...rest } = props;
  return (
    <BaseField.Description
      className={cx(fieldDescriptionStyles, className)}
      {...rest}
    />
  );
}

export interface FieldErrorProps {
  /**
   * The message. When given it always shows; without it the error shows
   * Base UI's validation message (from `validate` or the native checks).
   */
  children?: ReactNode;
  /** Show only for one native validity state, such as `"valueMissing"`. */
  match?: ComponentProps<typeof BaseField.Error>["match"];
  className?: string;
}

/**
 * An error message with a warning icon. It joins the control's description
 * while shown, rises in gently and fades out.
 */
export function FieldError(props: FieldErrorProps) {
  const { children, match, className } = props;
  const hasMessage =
    children !== undefined && children !== null && children !== false;
  return (
    <BaseField.Error
      className={cx(fieldErrorStyles, className)}
      match={hasMessage ? true : match}
      {...(hasMessage ? { children } : {})}
      render={(errorProps) => {
        const { children: message, ...restProps } = errorProps;
        if (message === undefined || message === null || message === "") {
          // Invalid with nothing to say: keep the element, show nothing.
          return <div {...restProps} hidden />;
        }
        return (
          <div {...restProps}>
            <WarningCircle aria-hidden weight="bold" />
            <span>{message}</span>
          </div>
        );
      }}
    />
  );
}

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
}

const hiddenLabelRow = css({ display: "contents" });

/**
 * The frame a control renders itself in: a Field.Root with the label above,
 * help and error below. Inside an outer `Field` it renders the control alone
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
        className={cx(fieldLabelStyles, hideLabel && visuallyHidden())}
      >
        {label}
        {marker}
      </LabelPart>
    ) : (
      <FieldLabel
        hidden={hideLabel}
        required={required}
        requiredIndicator={requiredIndicator}
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

  return (
    <FieldRoot
      className={className}
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
      {description !== undefined && description !== null && (
        <FieldDescription>{description}</FieldDescription>
      )}
      <FieldError>{message}</FieldError>
    </FieldRoot>
  );
}

export interface FieldProps extends FieldOwnProps {
  /** The control, or several parts of a custom one. */
  children: ReactNode;
  name?: string;
  className?: string;
  validate?: ComponentProps<typeof BaseField.Root>["validate"];
  validationMode?: ComponentProps<typeof BaseField.Root>["validationMode"];
}

/**
 * A label, help text and error around any control, wired with aria. Library
 * controls take the same props themselves, so reach for `Field` when the
 * control is your own, or to label several parts together.
 *
 * ```tsx
 * <Field label="Pronouns" description="Shown on your character sheet.">
 *   <TextField />
 * </Field>
 * ```
 */
export function Field(props: FieldProps) {
  const { children, ...rest } = props;
  return <FieldShell {...rest}>{children}</FieldShell>;
}

const fieldsetStyles = css({
  boxSizing: "border-box",
  display: "grid",
  gap: "1",
  minWidth: 0,
  margin: 0,
  padding: 0,
  border: 0,
});

const legendStyles = css({
  marginBottom: "1",
});

export interface FieldsetProps
  extends Omit<ComponentProps<typeof BaseFieldset.Root>, "className"> {
  className?: string;
}

/** Groups related controls under one legend. */
export function Fieldset(props: FieldsetProps) {
  const { className, ...rest } = props;
  return (
    <BaseFieldset.Root className={cx(fieldsetStyles, className)} {...rest} />
  );
}

export interface FieldsetLegendProps
  extends Omit<ComponentProps<typeof BaseFieldset.Legend>, "className"> {
  className?: string;
  required?: boolean;
  requiredIndicator?: ReactNode;
  hidden?: boolean;
}

/** A fieldset's legend, styled like a field label. */
export function FieldsetLegend(props: FieldsetLegendProps) {
  const {
    className,
    required,
    requiredIndicator = "*",
    hidden,
    children,
    ...rest
  } = props;
  return (
    <BaseFieldset.Legend
      className={cx(
        fieldLabelStyles,
        legendStyles,
        hidden && visuallyHidden(),
        className,
      )}
      {...rest}
    >
      {children}
      {required && (
        <span className={fieldRequiredStyles} aria-hidden>
          {requiredIndicator}
        </span>
      )}
    </BaseFieldset.Legend>
  );
}
