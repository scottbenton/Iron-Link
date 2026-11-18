import { Field as BaseField } from "@base-ui/react/field";
import { ReactNode, useId } from "react";

import { cx } from "styled-system/css";

import { useInField } from "../Field";
import {
  choiceDescriptionStyles,
  choiceItemStyles,
  choiceLabelStyles,
  choiceTextStyles,
} from "./choiceStyles";

function hasContent(node: ReactNode) {
  return node !== undefined && node !== null && node !== false && node !== "";
}

export interface ChoiceItemProps {
  /**
   * Renders the box (a Checkbox.Root or Radio.Root). It gets the id of the
   * title to pass as `aria-labelledby`, so the control's name is the title
   * alone and the description is read as its description.
   */
  control: (labelledBy: string | undefined) => ReactNode;
  /** The title beside the box. */
  label?: ReactNode;
  /** A muted line under the title. */
  description?: ReactNode;
  size?: "sm" | "md";
  disabled?: boolean;
  /** The control is named by `aria-label` instead of the title. */
  hasAriaLabel?: boolean;
  className?: string;
}

/**
 * The frame of one checkbox or radio: the box, its title and the description
 * under the title, all inside one label so pressing any of it chooses.
 * Inside a field (a CheckboxGroup, a RadioGroup, a `Field`) it is a
 * Field.Item, so the group's label and error still apply; on its own it is
 * its own Field.Root, so a lone Checkbox needs no wrapper.
 */
export function ChoiceItem(props: ChoiceItemProps) {
  const {
    control,
    label,
    description,
    size = "md",
    disabled,
    hasAriaLabel,
    className,
  } = props;
  const inField = useInField();
  const titleId = useId();
  const Part = inField ? BaseField.Item : BaseField.Root;
  const hasLabel = hasContent(label);
  const hasDescription = hasContent(description);

  return (
    <Part
      className={cx(choiceItemStyles, className)}
      disabled={disabled}
      data-disabled={disabled || undefined}
    >
      <BaseField.Label
        className={choiceLabelStyles({ size })}
        data-disabled={disabled || undefined}
      >
        {control(hasLabel && !hasAriaLabel ? titleId : undefined)}
        {(hasLabel || hasDescription) && (
          <span className={choiceTextStyles}>
            {hasLabel && <span id={titleId}>{label}</span>}
            {hasDescription && (
              <BaseField.Description
                render={<span />}
                className={choiceDescriptionStyles({ size })}
                data-choice-description=""
              >
                {description}
              </BaseField.Description>
            )}
          </span>
        )}
      </BaseField.Label>
    </Part>
  );
}
