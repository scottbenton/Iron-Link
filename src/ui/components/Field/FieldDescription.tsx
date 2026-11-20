import { Field as BaseField } from "@base-ui/react/field";
import { ComponentProps } from "react";

import { cx } from "styled-system/css";

import { fieldDescriptionStyles } from "./fieldStyles";

export interface FieldDescriptionProps
  extends Omit<ComponentProps<typeof BaseField.Description>, "className"> {
  className?: string;
}

/**
 * Help text, read as the control's description. Fields place it under the
 * control, before any error.
 */
export function FieldDescription(props: FieldDescriptionProps) {
  const { className, ...rest } = props;
  return (
    <BaseField.Description
      className={cx(fieldDescriptionStyles, className)}
      {...rest}
    />
  );
}
