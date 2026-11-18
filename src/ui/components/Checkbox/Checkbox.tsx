import { Checkbox as BaseCheckbox } from "@base-ui/react/checkbox";
import { Field as BaseField } from "@base-ui/react/field";
import { ReactNode, Ref } from "react";

import { ChoiceItem } from "./ChoiceItem";
import {
  checkboxFillStyles,
  checkboxMarkStyles,
  choiceBoxStyles,
  choiceDescriptionStyles,
  choiceLabelStyles,
} from "./choiceStyles";

export interface CheckboxProps {
  /** Ticked, when controlled. */
  checked?: boolean;
  /** Ticked at first, when uncontrolled. */
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  /** Neither ticked nor not: a dash, as for a "select all" over a mixed set. */
  indeterminate?: boolean;
  disabled?: boolean;
  /** The text beside the box. Pressing it toggles the box. */
  label?: ReactNode;
  /** A muted line under the label, read as the checkbox's description. */
  description?: ReactNode;
  /** Submitted with a form. */
  name?: string;
  /**
   * Submitted with a form when ticked, and the checkbox's id inside a
   * CheckboxGroup.
   */
  value?: string;
  className?: string;
  size?: "sm" | "md";
  /** Names the checkbox when there is no visible label. */
  "aria-label"?: string;
  /** Must be ticked to submit. */
  required?: boolean;
  /** Shows the state but cannot be changed. */
  readOnly?: boolean;
  /** In a CheckboxGroup, ticks or unticks every other checkbox. */
  parent?: boolean;
  id?: string;
  ref?: Ref<HTMLElement>;
}

const tickPath = "M20 6 9 17l-5-5";
const dashPath = "M5.5 12h13";

/**
 * A checkbox with its label and optional description. Iron Link uses
 * checkboxes, never switches, for on/off settings in forms.
 *
 * ```tsx
 * <Checkbox
 *   label="Include Ironsworn: Delve"
 *   checked={delve}
 *   onCheckedChange={setDelve}
 * />
 * ```
 */
export function Checkbox(props: CheckboxProps) {
  const {
    checked,
    defaultChecked,
    onCheckedChange,
    indeterminate,
    disabled,
    label,
    description,
    name,
    value,
    className,
    size = "md",
    "aria-label": ariaLabel,
    required,
    readOnly,
    parent,
    id,
    ref,
  } = props;

  const hasDescription =
    description !== undefined && description !== null && description !== "";

  return (
    <ChoiceItem className={className} disabled={disabled}>
      <BaseField.Label
        className={choiceLabelStyles({ size })}
        data-disabled={disabled || undefined}
      >
        <BaseCheckbox.Root
          ref={ref}
          id={id}
          className={choiceBoxStyles({ shape: "checkbox", size })}
          checked={checked}
          defaultChecked={defaultChecked}
          onCheckedChange={(next) => onCheckedChange?.(next)}
          indeterminate={indeterminate}
          disabled={disabled}
          name={name}
          value={value}
          required={required}
          readOnly={readOnly}
          parent={parent}
          aria-label={ariaLabel}
        >
          <span className={checkboxFillStyles} aria-hidden />
          <svg className={checkboxMarkStyles} viewBox="0 0 24 24" aria-hidden>
            <path data-mark="tick" d={tickPath} />
            <path data-mark="dash" d={dashPath} />
          </svg>
        </BaseCheckbox.Root>
        {label}
      </BaseField.Label>
      {hasDescription && (
        <BaseField.Description className={choiceDescriptionStyles({ size })}>
          {description}
        </BaseField.Description>
      )}
    </ChoiceItem>
  );
}
