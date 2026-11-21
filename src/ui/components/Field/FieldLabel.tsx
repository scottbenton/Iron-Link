import { Field as BaseField } from "@base-ui/react/field";
import { ComponentProps, ReactNode } from "react";

import { cx } from "styled-system/css";
import { visuallyHidden } from "styled-system/patterns";

import { fieldLabelRecipe, fieldRequiredStyles } from "./fieldStyles";
import { FieldSize } from "./fieldTypes";

export interface FieldLabelProps
  extends Omit<ComponentProps<typeof BaseField.Label>, "className"> {
  className?: string;
  required?: boolean;
  requiredIndicator?: ReactNode;
  hidden?: boolean;
  size?: FieldSize;
}

/** The field's label, tied to its control. */
export function FieldLabel(props: FieldLabelProps) {
  const {
    className,
    required,
    requiredIndicator = "*",
    hidden,
    size = "md",
    children,
    ...rest
  } = props;
  return (
    <BaseField.Label
      className={cx(
        fieldLabelRecipe({ size }),
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
    </BaseField.Label>
  );
}
