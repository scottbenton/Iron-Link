import { Field as BaseField } from "@base-ui/react/field";
import { ComponentProps } from "react";

import { CssProp, withCssProp } from "ui/styles/cssProp";

import { cx } from "styled-system/css";

import { fieldRootRecipe } from "./fieldStyles";
import { FieldSize } from "./fieldTypes";
import { InFieldContext } from "./inFieldContext";

export interface FieldRootProps
  extends Omit<ComponentProps<typeof BaseField.Root>, "className">,
    CssProp {
  className?: string;
  /** `sm` sets the parts closer together. */
  size?: FieldSize;
}

/**
 * Groups a label, a control, help text and an error, and wires them with
 * aria. Most callers want `Field`, or a control's own `label` props.
 */
export function FieldRoot(props: FieldRootProps) {
  const { className, size = "md", ...rest } = withCssProp(props);
  return (
    <InFieldContext.Provider value>
      <BaseField.Root
        className={cx(fieldRootRecipe({ size }), className)}
        {...rest}
      />
    </InFieldContext.Provider>
  );
}
