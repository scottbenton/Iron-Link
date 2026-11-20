import { CheckboxGroup as BaseCheckboxGroup } from "@base-ui/react/checkbox-group";
import { Fieldset as BaseFieldset } from "@base-ui/react/fieldset";
import { ReactNode, useId } from "react";

import { CssProp, withCssProp } from "ui/styles/cssProp";

import { css, cx } from "styled-system/css";

import { Checkbox, choiceListStyles } from "../Checkbox";
import {
  FieldError,
  FieldOwnProps,
  FieldRoot,
  FieldsetLegend,
  fieldDescriptionStyles,
  fieldsetDescriptionStyles,
  resolveFieldError,
  useControllableState,
} from "../Field";

export interface CheckboxGroupProps extends FieldOwnProps, CssProp {
  /** The Checkboxes, each with a `value`. */
  children: ReactNode;
  /** The `value`s of the ticked checkboxes, when controlled. */
  value?: string[];
  defaultValue?: string[];
  onValueChange?: (value: string[]) => void;
  /**
   * The title of a "select all" checkbox above the choices, which are then
   * nested under it. Needs `allValues`.
   */
  allLabel?: ReactNode;
  /** The `value` of every choice that `allLabel`'s checkbox ticks. */
  allValues?: string[];
  /** Stack the choices (default) or run them in a wrapping row. */
  orientation?: "vertical" | "horizontal";
  /** Submitted with a form, and the key for Form errors. */
  name?: string;
  /** Names the group when there is no visible legend. */
  "aria-label"?: string;
  className?: string;
}

/**
 * The choices under a "select all" checkbox, indented so they line up with
 * its title: the box (20px) and its gap (10px).
 */
const nestedStyles = css({ paddingInlineStart: "30px" });

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
 * With `allLabel` and `allValues`, a "select all" checkbox heads the choices
 * and they sit nested under it, in a group it names. Pressing it ticks every
 * choice, or unticks them all when every one is already ticked; it shows a
 * dash while only some are.
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
    allLabel,
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
  } = withCssProp(props);
  const { invalid, message } = resolveFieldError(error, invalidProp);
  const descriptionId = useId();
  const allTitleId = useId();
  // The group keeps the value itself, rather than leaving it to Base UI,
  // so the "select all" box can work it out.
  const [current, setCurrent] = useControllableState<string[]>(
    value,
    defaultValue ?? [],
    onValueChange,
  );
  const hasAll = allLabel !== undefined && allLabel !== null && !!allValues;
  const allChecked =
    hasAll &&
    allValues.length > 0 &&
    allValues.every((v) => current.includes(v));
  const someChecked = hasAll && allValues.some((v) => current.includes(v));
  // Not Base UI's parent checkbox: that one cycles through the choices that
  // were ticked before it was first pressed, all, and none, so from none a
  // press brought back only the earlier choices. This one has two steps:
  // all, then none. Choices outside `allValues` are left as they are.
  function toggleAll() {
    if (!allValues) return;
    setCurrent(
      allChecked
        ? current.filter((v) => !allValues.includes(v))
        : [...current, ...allValues.filter((v) => !current.includes(v))],
    );
  }
  const list = (
    <div className={cx(choiceListStyles({ orientation }))}>{children}</div>
  );
  const hasDescription =
    description !== undefined && description !== null && description !== "";

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
        aria-describedby={hasDescription ? descriptionId : undefined}
        render={
          <BaseCheckboxGroup
            value={current}
            onValueChange={(next) => setCurrent(next)}
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
        {hasDescription && (
          // A plain element, not a Field description: Base UI would add a
          // field's description to every choice inside it, so each one would
          // repeat the group's help. The group alone is described by it.
          <p
            id={descriptionId}
            className={cx(fieldDescriptionStyles, fieldsetDescriptionStyles)}
          >
            {description}
          </p>
        )}
        {hasAll ? (
          <div className={cx(choiceListStyles())}>
            <Checkbox
              parent
              label={<span id={allTitleId}>{allLabel}</span>}
              checked={allChecked}
              indeterminate={someChecked && !allChecked}
              onCheckedChange={toggleAll}
            />
            <div
              role="group"
              aria-labelledby={allTitleId}
              className={nestedStyles}
            >
              {list}
            </div>
          </div>
        ) : (
          list
        )}
      </BaseFieldset.Root>
      <FieldError>{message}</FieldError>
    </FieldRoot>
  );
}
