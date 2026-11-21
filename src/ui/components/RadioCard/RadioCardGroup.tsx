import { Fieldset as BaseFieldset } from "@base-ui/react/fieldset";
import { RadioGroup as BaseRadioGroup } from "@base-ui/react/radio-group";
import { CSSProperties, ReactNode } from "react";

import { CssProp, withCssProp } from "ui/styles/cssProp";

import { css, cx } from "styled-system/css";

import {
  FieldDescription,
  FieldError,
  FieldOwnProps,
  FieldRoot,
  FieldsetLegend,
  fieldsetDescriptionStyles,
  resolveFieldError,
} from "../Field";

export interface RadioCardGroupProps<V = string>
  extends FieldOwnProps,
    CssProp {
  /** The RadioCards. */
  children: ReactNode;
  value?: V;
  defaultValue?: V;
  onValueChange?: (value: V) => void;
  /**
   * Cards per row from the `sm` breakpoint up; they stack below it. Leave it
   * out to fit as many as `minCardWidth` allows.
   */
  columns?: number;
  /** The narrowest a card gets when `columns` is not set. */
  minCardWidth?: string;
  name?: string;
  readOnly?: boolean;
  /** Names the group when there is no visible legend. */
  "aria-label"?: string;
  className?: string;
  /** Class for the grid of cards. */
  gridClassName?: string;
}

const groupStyles = css({
  boxSizing: "border-box",
  display: "grid",
  gap: "2",
  minWidth: 0,
  margin: 0,
  padding: 0,
  border: 0,
});

const gridStyles = css({
  display: "grid",
  gap: "3",
  gridTemplateColumns:
    "repeat(auto-fill, minmax(min(100%, var(--radio-card-min, 200px)), 1fr))",
  // Room for the cards' ledge under the last row.
  paddingBottom: "0.5",
  "&[data-columns]": {
    gridTemplateColumns: "minmax(0, 1fr)",
    sm: {
      gridTemplateColumns: "repeat(var(--radio-card-columns), minmax(0, 1fr))",
    },
  },
});

/**
 * A radio group of large cards, each with a title, a description and an
 * optional icon: choosing a ruleset or a game type. Arrow keys move the
 * choice; Tab reaches only the chosen card.
 */
export function RadioCardGroup<V = string>(props: RadioCardGroupProps<V>) {
  const {
    children,
    value,
    defaultValue,
    onValueChange,
    columns,
    minCardWidth,
    name,
    readOnly,
    "aria-label": ariaLabel,
    className,
    gridClassName,
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

  const gridStyle = {
    ...(columns ? { "--radio-card-columns": columns } : {}),
    ...(minCardWidth ? { "--radio-card-min": minCardWidth } : {}),
  } as CSSProperties;

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
        render={
          <BaseRadioGroup<V>
            value={value}
            defaultValue={defaultValue}
            onValueChange={(next) => onValueChange?.(next)}
            disabled={disabled}
            readOnly={readOnly}
            required={required}
            name={name}
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
        {description !== undefined && description !== null && (
          <FieldDescription className={fieldsetDescriptionStyles}>
            {description}
          </FieldDescription>
        )}
        <div
          className={cx(gridStyles, gridClassName)}
          data-columns={columns ? "" : undefined}
          style={gridStyle}
        >
          {children}
        </div>
      </BaseFieldset.Root>
      <FieldError>{message}</FieldError>
    </FieldRoot>
  );
}
