import { Select as BaseSelect } from "@base-ui/react/select";
import { CaretDown, CaretUp, Check } from "@phosphor-icons/react";
import { Fragment, ReactNode, Ref, useMemo } from "react";

import { css, cx } from "styled-system/css";

import {
  FieldOwnProps,
  FieldShell,
  fieldAdornmentStyles,
  fieldShellStyles,
} from "../Field";
import {
  listGroupLabelStyles,
  listItemCheckStyles,
  listItemDescriptionStyles,
  listItemIconStyles,
  listItemStyles,
  listItemTextStyles,
  listPopupStyles,
  listPositionerStyles,
  listSeparatorStyles,
  listStyles,
} from "./popupStyles";

export type SelectValue = string | number;

/** One choice in a Select. */
export interface SelectOption<V extends SelectValue = string> {
  value: V;
  /** What the option and the trigger show. */
  label: ReactNode;
  /** A second, muted line under the label in the list. */
  description?: ReactNode;
  /** An icon before the label, in the list and the trigger. */
  icon?: ReactNode;
  disabled?: boolean;
}

/** Options under a heading. */
export interface SelectOptionGroup<V extends SelectValue = string> {
  label: ReactNode;
  options: SelectOption<V>[];
}

export type SelectOptions<V extends SelectValue = string> = (
  | SelectOption<V>
  | SelectOptionGroup<V>
)[];

function isGroup<V extends SelectValue>(
  entry: SelectOption<V> | SelectOptionGroup<V>,
): entry is SelectOptionGroup<V> {
  return "options" in entry;
}

interface SelectCommonProps<V extends SelectValue> extends FieldOwnProps {
  /** The choices, flat or in groups. */
  options: SelectOptions<V>;
  /** Shown in the trigger while nothing is chosen. */
  placeholder?: ReactNode;
  /** `sm` for dense panels, with a smaller muted label. */
  size?: "sm" | "md";
  /** `quiet` shows no border or well until hovered or focused. */
  variant?: "outline" | "quiet";
  /** Submitted with a form. */
  name?: string;
  /** Shows the choice but does not open. */
  readOnly?: boolean;
  /** An icon before the value in the trigger. */
  startAdornment?: ReactNode;
  /** Formats the chosen value(s) in the trigger. */
  renderValue?: (value: V | V[]) => ReactNode;
  /** Names the select when there is no visible label. */
  "aria-label"?: string;
  id?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Class for the field (label, trigger, help and error together). */
  className?: string;
  /** Class for the trigger. */
  triggerClassName?: string;
  /** Class for the popup. */
  popupClassName?: string;
  ref?: Ref<HTMLButtonElement>;
}

interface SelectSingleProps<V extends SelectValue> {
  multiple?: false;
  /** The chosen value, or null for none. */
  value?: V | null;
  defaultValue?: V | null;
  onValueChange?: (value: V | null) => void;
}

interface SelectMultipleProps<V extends SelectValue> {
  /** Several values may be chosen; the popup stays open between picks. */
  multiple: true;
  value?: V[];
  defaultValue?: V[];
  onValueChange?: (value: V[]) => void;
}

export type SelectProps<V extends SelectValue = string> = SelectCommonProps<V> &
  (SelectSingleProps<V> | SelectMultipleProps<V>);

const triggerExtra = css({
  "&[data-readonly]": { cursor: "default" },
});

const valueStyles = css({
  display: "flex",
  alignItems: "center",
  gap: "2",
  flex: "1 1 auto",
  minWidth: 0,
  overflow: "hidden",
  whiteSpace: "nowrap",
  textOverflow: "ellipsis",
  "& > span": { overflow: "hidden", textOverflow: "ellipsis" },
  "& > svg": { flex: "none", width: "18px", height: "18px", color: "fg.muted" },
});

const placeholderStyles = css({ color: "fg.subtle" });

const caretStyles = css({
  display: "inline-flex",
  flex: "none",
  color: "fg.muted",
  transition: "rotate token(durations.fast) token(easings.out)",
  "& > svg": { width: "16px", height: "16px" },
  "[data-popup-open] &": { rotate: "180deg" },
  "[data-disabled] &": { color: "fg.disabled" },
});

const scrollArrowStyles = css({
  position: "absolute",
  insetInline: 0,
  zIndex: 1,
  display: "grid",
  placeItems: "center",
  height: "20px",
  background: "bg.surface",
  color: "fg.muted",
  cursor: "default",
  "&[data-side=top], &[data-direction=up]": {
    top: 0,
    borderTopRadius: "md",
  },
  "&[data-side=bottom], &[data-direction=down]": {
    bottom: 0,
    borderBottomRadius: "md",
  },
  "& > svg": { width: "12px", height: "12px" },
});

/**
 * Choose one value (or several, with `multiple`) from a list. The trigger sits
 * in the same well as a text field so form rows line up; the list opens below
 * it as a surface card, with a check on the chosen option.
 *
 * ```tsx
 * <Select
 *   label="Ruleset"
 *   options={[
 *     { value: "ironsworn", label: "Ironsworn" },
 *     { value: "starforged", label: "Starforged" },
 *   ]}
 *   value={ruleset}
 *   onValueChange={setRuleset}
 * />
 * ```
 */
export function Select<V extends SelectValue = string>(props: SelectProps<V>) {
  const {
    options,
    placeholder,
    size = "md",
    variant = "outline",
    name,
    readOnly,
    startAdornment,
    renderValue,
    "aria-label": ariaLabel,
    id,
    open,
    onOpenChange,
    className,
    triggerClassName,
    popupClassName,
    ref,
    label,
    hideLabel,
    description,
    error,
    invalid,
    required,
    disabled,
    requiredIndicator,
    multiple,
    value,
    defaultValue,
    onValueChange,
  } = props;

  const flat = useMemo(
    () =>
      options.flatMap((entry) => (isGroup(entry) ? entry.options : [entry])),
    [options],
  );
  const items = useMemo(
    () => flat.map((option) => ({ value: option.value, label: option.label })),
    [flat],
  );
  const find = (v: V) => flat.find((option) => Object.is(option.value, v));

  const placeholderNode = (
    <span className={placeholderStyles}>{placeholder ?? " "}</span>
  );

  const showValue = (current: unknown) => {
    if (multiple) {
      const values = (current ?? []) as V[];
      if (values.length === 0) return placeholderNode;
      if (renderValue) return renderValue(values);
      return (
        <span>
          {values.map((v, index) => (
            <Fragment key={String(v)}>
              {index > 0 && ", "}
              {find(v)?.label ?? String(v)}
            </Fragment>
          ))}
        </span>
      );
    }
    if (current === null || current === undefined) return placeholderNode;
    if (renderValue) return renderValue(current as V);
    const option = find(current as V);
    return (
      <>
        {option?.icon}
        <span>{option?.label ?? String(current)}</span>
      </>
    );
  };

  const renderItem = (option: SelectOption<V>) => (
    <BaseSelect.Item
      key={String(option.value)}
      value={option.value}
      disabled={option.disabled}
      className={listItemStyles}
    >
      {option.icon && (
        <span className={listItemIconStyles} aria-hidden>
          {option.icon}
        </span>
      )}
      <span className={listItemTextStyles}>
        <BaseSelect.ItemText>{option.label}</BaseSelect.ItemText>
        {option.description && (
          <span className={listItemDescriptionStyles}>
            {option.description}
          </span>
        )}
      </span>
      <span className={listItemCheckStyles} aria-hidden>
        <Check weight="bold" />
      </span>
    </BaseSelect.Item>
  );

  return (
    <FieldShell
      label={label}
      hideLabel={hideLabel}
      description={description}
      error={error}
      invalid={invalid}
      required={required}
      disabled={disabled}
      requiredIndicator={requiredIndicator}
      name={name}
      className={className}
      size={size}
      labelPart={BaseSelect.Label}
      wrap={(content) => (
        <BaseSelect.Root<V, boolean>
          id={id}
          items={items}
          multiple={multiple}
          value={value as never}
          defaultValue={defaultValue as never}
          onValueChange={(next) =>
            (onValueChange as (v: unknown) => void)?.(next)
          }
          open={open}
          onOpenChange={(next) => onOpenChange?.(next)}
          name={name}
          disabled={disabled}
          readOnly={readOnly}
          required={required}
        >
          {content}
          <BaseSelect.Portal>
            <BaseSelect.Positioner
              className={cx("ui-root", listPositionerStyles)}
              sideOffset={6}
              alignItemWithTrigger={false}
            >
              <BaseSelect.Popup className={cx(listPopupStyles, popupClassName)}>
                <BaseSelect.ScrollUpArrow className={scrollArrowStyles}>
                  <CaretUp weight="bold" />
                </BaseSelect.ScrollUpArrow>
                <BaseSelect.List className={listStyles}>
                  {options.map((entry, index) =>
                    isGroup(entry) ? (
                      <Fragment key={`group-${index}`}>
                        {index > 0 && (
                          <BaseSelect.Separator
                            className={listSeparatorStyles}
                          />
                        )}
                        <BaseSelect.Group>
                          <BaseSelect.GroupLabel
                            className={listGroupLabelStyles}
                          >
                            {entry.label}
                          </BaseSelect.GroupLabel>
                          {entry.options.map(renderItem)}
                        </BaseSelect.Group>
                      </Fragment>
                    ) : (
                      renderItem(entry)
                    ),
                  )}
                </BaseSelect.List>
                <BaseSelect.ScrollDownArrow className={scrollArrowStyles}>
                  <CaretDown weight="bold" />
                </BaseSelect.ScrollDownArrow>
              </BaseSelect.Popup>
            </BaseSelect.Positioner>
          </BaseSelect.Portal>
        </BaseSelect.Root>
      )}
    >
      <BaseSelect.Trigger
        ref={ref}
        className={cx(
          fieldShellStyles({ kind: "button", size, variant }),
          triggerExtra,
          triggerClassName,
        )}
        aria-label={ariaLabel}
      >
        {startAdornment && (
          <span className={fieldAdornmentStyles}>{startAdornment}</span>
        )}
        <BaseSelect.Value className={valueStyles}>{showValue}</BaseSelect.Value>
        <BaseSelect.Icon className={caretStyles}>
          <CaretDown weight="bold" />
        </BaseSelect.Icon>
      </BaseSelect.Trigger>
    </FieldShell>
  );
}
