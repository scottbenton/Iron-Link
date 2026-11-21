import { Field as BaseField } from "@base-ui/react/field";
import { ComponentProps, ReactNode } from "react";

import { CssProp, withCssProp } from "ui/styles/cssProp";

import { FieldShell } from "./FieldShell";
import { FieldOwnProps, FieldSize } from "./fieldTypes";

export interface FieldProps extends FieldOwnProps, CssProp {
  /** The control, or several parts of a custom one. */
  children: ReactNode;
  /** `sm` gives a smaller, muted label and tighter spacing. */
  size?: FieldSize;
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
  const { children, ...rest } = withCssProp(props);
  return <FieldShell {...rest}>{children}</FieldShell>;
}
