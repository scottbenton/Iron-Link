import { Field as BaseField } from "@base-ui/react/field";
import { ReactNode } from "react";

import { cx } from "styled-system/css";

import { useInField } from "../Field";
import { choiceItemStyles } from "./choiceStyles";

/**
 * The frame of one checkbox or radio: its label, box and description.
 * Inside a field (a CheckboxGroup, a RadioGroup, a `Field`) it is a
 * Field.Item, so the group's label and error still apply; on its own it is
 * its own Field.Root, so a lone Checkbox needs no wrapper.
 */
export function ChoiceItem(props: {
  children: ReactNode;
  disabled?: boolean;
  className?: string;
}) {
  const { children, disabled, className } = props;
  const inField = useInField();
  const Part = inField ? BaseField.Item : BaseField.Root;
  return (
    <Part
      className={cx(choiceItemStyles, className)}
      disabled={disabled}
      data-disabled={disabled || undefined}
    >
      {children}
    </Part>
  );
}
