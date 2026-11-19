import { Combobox as BaseCombobox } from "@base-ui/react/combobox";
import { CaretDown, Check, Plus, X } from "@phosphor-icons/react";
import { ReactNode, Ref, useMemo, useRef } from "react";

import { LayoutProps, withLayoutProps } from "ui/styles/layoutProps";

import { css, cx } from "styled-system/css";
import { visuallyHidden } from "styled-system/patterns";

import {
  FieldOwnProps,
  FieldShell,
  fieldAdornmentStyles,
  fieldIconButtonStyles,
  fieldInputRecipe,
  fieldShellStyles,
  mergeRefs,
  useControllableState,
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
  listStatusStyles,
  listStyles,
} from "../Select";
import { Spinner } from "../Spinner";
import { focusInputOnWellPress } from "../TextField";

/** One choice in a Combobox. Values are string ids; labels are plain text. */
export interface ComboboxOption<V extends string = string> {
  value: V;
  /** Shown in the list, the input and chips, and matched against the query. */
  label: string;
  /** A second, muted line in the list. */
  description?: ReactNode;
  /** An icon before the label in the list. */
  icon?: ReactNode;
  disabled?: boolean;
  /** A heading to list the option under. Groups keep first-seen order. */
  group?: string;
}

interface ComboboxCommonProps<V extends string>
  extends FieldOwnProps,
    LayoutProps {
  /** The choices. For async search, pass the latest results. */
  options: ComboboxOption<V>[];
  /** The typed text, when controlled (async search reads it). */
  inputValue?: string;
  defaultInputValue?: string;
  onInputValueChange?: (inputValue: string) => void;
  placeholder?: string;
  /**
   * How options match the query. The default matches the label, ignoring
   * case and accents. Pass `null` when the options are already filtered,
   * as with server search.
   */
  filter?: ((option: ComboboxOption<V>, query: string) => boolean) | null;
  /** Shows a loading row instead of the empty row, for async search. */
  loading?: boolean;
  loadingLabel?: string;
  /** Shown when nothing matches. */
  emptyLabel?: ReactNode;
  /**
   * Offers a "Create" row for text that matches no option. The caller
   * creates the record and then selects its value.
   */
  onCreate?: (text: string) => void;
  /** The create row's text. */
  createLabel?: (text: string) => ReactNode;
  /**
   * Typed text becomes a value as it is: Enter adds it. For free-form tag
   * lists, usually with `multiple` and few or no options.
   */
  freeText?: boolean;
  /** Leave chosen options out of the list (multiple). */
  hideSelected?: boolean;
  /** Highlight the first match while typing, so Enter picks it. */
  autoHighlight?: boolean;
  /** `sm` for dense panels, with a smaller muted label. */
  size?: "sm" | "md";
  /** `quiet` shows no border or well until hovered or focused. */
  variant?: "outline" | "quiet";
  name?: string;
  readOnly?: boolean;
  /** An icon before the input. */
  startAdornment?: ReactNode;
  /** Shows a clear button while something is chosen. Default true. */
  clearable?: boolean;
  clearLabel?: string;
  /** The name of the button that opens the list. */
  openLabel?: string;
  /** The name of a chip's remove button. */
  removeLabel?: (label: string) => string;
  /** Names the input when there is no visible label. */
  "aria-label"?: string;
  id?: string;
  className?: string;
  inputClassName?: string;
  popupClassName?: string;
  ref?: Ref<HTMLInputElement>;
}

interface ComboboxSingleProps<V extends string> {
  multiple?: false;
  value?: V | null;
  defaultValue?: V | null;
  onValueChange?: (value: V | null) => void;
}

interface ComboboxMultipleProps<V extends string> {
  /** Several values, shown as chips in the field. */
  multiple: true;
  value?: V[];
  defaultValue?: V[];
  onValueChange?: (value: V[]) => void;
}

export type ComboboxProps<V extends string = string> = ComboboxCommonProps<V> &
  (ComboboxSingleProps<V> | ComboboxMultipleProps<V>);

/** The value of the "Create" row; never handed to the caller. */
const CREATE = "\u0000combobox-create";

interface ItemGroup {
  label: string | null;
  items: string[];
}

/**
 * The chips and the input after them. They take the room left beside the
 * buttons and wrap onto more rows inside it, so the buttons stay at the
 * well's end, on the first row.
 */
const chipsStyles = css({
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  gap: "1",
  flex: "1 1 0%",
  minWidth: 0,
  minHeight: "var(--chip-row)",
});

/** A row's height, for parts that line up with the first row of chips. */
const firstRowStyles = css({ height: "var(--chip-row, auto)" });

const chipStyles = css({
  boxSizing: "border-box",
  display: "inline-flex",
  alignItems: "center",
  gap: "0.5",
  maxWidth: "100%",
  minHeight: "calc(var(--chip-row, 28px) - 2px)",
  paddingInlineStart: "10px",
  paddingInlineEnd: "2px",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "border.control",
  borderRadius: "full",
  background: "bg.surface",
  color: "fg.default",
  fontSize: "sm",
  fontWeight: "medium",
  lineHeight: "none",
  cursor: "default",
  outline: "none",
  transitionProperty: "background-color, border-color, color",
  transitionDuration: "fast",
  transitionTimingFunction: "linear",
  "& > span": {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    paddingBlock: "1",
  },
  "&:is([data-highlighted], :focus-visible, :focus-within)": {
    background: "accent.soft",
    borderColor: "accent.fg",
    color: "accent.fg",
  },
  "[data-disabled] &": {
    background: "bg.emphasized",
    borderColor: "border.default",
    color: "fg.disabled",
  },
});

const chipRemoveStyles = css({
  boxSizing: "border-box",
  appearance: "none",
  display: "inline-grid",
  placeItems: "center",
  flex: "none",
  width: "20px",
  height: "20px",
  margin: 0,
  padding: 0,
  border: 0,
  borderRadius: "full",
  background: "transparent",
  color: "inherit",
  cursor: "pointer",
  "& > svg": { width: "12px", height: "12px" },
  _hover: { background: "overlay.hover" },
  _pressed: { background: "overlay.pressed" },
  "&:is(:disabled, [data-disabled])": { display: "none" },
});

const endButtonsStyles = css({
  display: "inline-flex",
  alignItems: "center",
  gap: "0.5",
  flex: "none",
  marginInlineEnd: "-1",
});

const triggerCaretStyles = css({
  "& > svg": {
    transition: "rotate token(durations.fast) token(easings.out)",
  },
  "&[data-popup-open] > svg": { rotate: "180deg" },
});

const createIconStyles = css({
  display: "inline-flex",
  flex: "none",
  color: "accent.fg",
  "& > svg": { width: "icon.md", height: "icon.md" },
});

/**
 * A text input that filters a list as you type: pick one value, or several
 * shown as chips. Works with async search (`filter={null}`, `loading`), an
 * empty row, and a "Create" row for text that matches nothing.
 *
 * ```tsx
 * <Combobox
 *   label="Linked entries"
 *   multiple
 *   options={entries.map((e) => ({ value: e.id, label: e.name }))}
 *   value={linked}
 *   onValueChange={setLinked}
 *   onCreate={createEntry}
 * />
 * ```
 */
export function Combobox<V extends string = string>(props: ComboboxProps<V>) {
  const {
    options,
    inputValue: inputValueProp,
    defaultInputValue = "",
    onInputValueChange,
    placeholder,
    filter: filterProp,
    loading = false,
    loadingLabel = "Loading",
    emptyLabel = "No matches",
    onCreate,
    createLabel = (text: string) => `Create “${text}”`,
    freeText = false,
    hideSelected = false,
    autoHighlight,
    size = "md",
    variant = "outline",
    name,
    readOnly,
    startAdornment,
    clearable = true,
    clearLabel = "Clear",
    openLabel = "Show options",
    removeLabel = (label: string) => `Remove ${label}`,
    "aria-label": ariaLabel,
    id,
    className,
    inputClassName,
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
  } = withLayoutProps(props);
  const multiple = props.multiple === true;

  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useControllableState(
    inputValueProp,
    defaultInputValue,
    onInputValueChange,
  );
  const [value, setValue] = useControllableState<V | V[] | null>(
    props.value,
    props.defaultValue ?? (multiple ? [] : null),
    props.onValueChange as ((value: V | V[] | null) => void) | undefined,
  );
  const selected: V[] = multiple
    ? ((value as V[] | null) ?? [])
    : value === null || value === undefined
      ? []
      : [value as V];

  // Labels outlive the options that brought them, so a chosen value still
  // reads right after an async search replaces the list.
  const labels = useRef(new Map<string, string>());
  for (const option of options) labels.current.set(option.value, option.label);
  const labelOf = (v: string) => labels.current.get(v) ?? v;
  const optionOf = (v: string) => options.find((option) => option.value === v);

  const { contains } = BaseCombobox.useFilter({ sensitivity: "base" });

  const trimmed = query.trim();
  const lowered = trimmed.toLocaleLowerCase();
  const canCreate =
    (Boolean(onCreate) || freeText) &&
    trimmed !== "" &&
    !options.some((option) => option.label.toLocaleLowerCase() === lowered) &&
    !selected.some((v) => labelOf(v).toLocaleLowerCase() === lowered);

  const { items, grouped } = useMemo(() => {
    const visible = options
      .filter((option) => !(hideSelected && selected.includes(option.value)))
      .filter((option) => option.value !== CREATE);
    const hasGroups = visible.some((option) => option.group);
    if (!hasGroups) {
      const flat: string[] = visible.map((option) => option.value);
      if (canCreate) flat.push(CREATE);
      return { items: flat as unknown[], grouped: false };
    }
    const groups: ItemGroup[] = [];
    for (const option of visible) {
      const key = option.group ?? null;
      let group = groups.find((g) => g.label === key);
      if (!group) {
        group = { label: key, items: [] };
        groups.push(group);
      }
      group.items.push(option.value);
    }
    if (canCreate) groups.push({ label: null, items: [CREATE] });
    return { items: groups as unknown[], grouped: true };
    // `selected` is derived from `value` each render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options, hideSelected, canCreate, value]);

  const filter =
    filterProp === null
      ? null
      : (item: string, q: string) => {
          if (item === CREATE) return true;
          const option = optionOf(item);
          if (filterProp && option) return filterProp(option, q);
          return contains(labelOf(item), q);
        };

  const create = (text: string) => {
    if (onCreate) {
      onCreate(text);
    } else if (freeText) {
      labels.current.set(text, text);
      if (multiple) setValue([...selected, text as V]);
      else setValue(text as V);
    }
    if (multiple) setQuery("");
  };

  const handleValueChange = (next: unknown) => {
    if (multiple) {
      const values = (next as string[]) ?? [];
      if (values.includes(CREATE)) {
        create(trimmed);
        return;
      }
      setValue(values as V[]);
      setQuery("");
      return;
    }
    if (next === CREATE) {
      create(trimmed);
      return;
    }
    setValue((next as V | null) ?? null);
  };

  const renderItem = (item: string) => {
    if (item === CREATE) {
      return (
        <BaseCombobox.Item
          key={CREATE}
          value={CREATE}
          className={listItemStyles}
        >
          <span className={createIconStyles} aria-hidden>
            <Plus weight="bold" />
          </span>
          <span className={listItemTextStyles}>{createLabel(trimmed)}</span>
        </BaseCombobox.Item>
      );
    }
    const option = optionOf(item);
    return (
      <BaseCombobox.Item
        key={item}
        value={item}
        disabled={option?.disabled}
        className={listItemStyles}
      >
        {option?.icon && (
          <span className={listItemIconStyles} aria-hidden>
            {option.icon}
          </span>
        )}
        <span className={listItemTextStyles}>
          <span>{labelOf(item)}</span>
          {option?.description && (
            <span className={listItemDescriptionStyles}>
              {option.description}
            </span>
          )}
        </span>
        <span className={listItemCheckStyles} aria-hidden>
          <Check weight="bold" />
        </span>
      </BaseCombobox.Item>
    );
  };

  const input = (
    <BaseCombobox.Input
      ref={mergeRefs(ref, inputRef)}
      id={id}
      className={cx(fieldInputRecipe({ chips: multiple }), inputClassName)}
      placeholder={multiple && selected.length > 0 ? undefined : placeholder}
      aria-label={ariaLabel}
    />
  );

  const showClear = clearable && !disabled && !readOnly;

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
      wrap={(content) => (
        <BaseCombobox.Root<string, boolean>
          items={items}
          multiple={multiple}
          value={(multiple ? selected : (value ?? null)) as never}
          onValueChange={handleValueChange}
          inputValue={query}
          onInputValueChange={(next) => setQuery(next)}
          filter={filter}
          itemToStringLabel={(item) => (item === CREATE ? "" : labelOf(item))}
          autoHighlight={autoHighlight ?? (Boolean(onCreate) || freeText)}
          name={name}
          disabled={disabled}
          readOnly={readOnly}
          required={required}
        >
          {content}
          <BaseCombobox.Portal>
            <BaseCombobox.Positioner
              className={cx("ui-root", listPositionerStyles)}
              sideOffset={6}
            >
              <BaseCombobox.Popup
                className={cx(listPopupStyles, popupClassName)}
                aria-busy={loading || undefined}
              >
                <BaseCombobox.Status className={visuallyHidden()}>
                  {loading ? loadingLabel : null}
                </BaseCombobox.Status>
                {loading && (
                  <div className={listStatusStyles} aria-hidden>
                    <Spinner />
                    {loadingLabel}
                  </div>
                )}
                <BaseCombobox.Empty className={listStatusStyles}>
                  {loading ? null : emptyLabel}
                </BaseCombobox.Empty>
                <BaseCombobox.List className={listStyles}>
                  {grouped
                    ? (group: ItemGroup) => (
                        <BaseCombobox.Group
                          key={group.label ?? "\u0000"}
                          items={group.items}
                        >
                          {group.label !== null && (
                            <BaseCombobox.GroupLabel
                              className={listGroupLabelStyles}
                            >
                              {group.label}
                            </BaseCombobox.GroupLabel>
                          )}
                          <BaseCombobox.Collection>
                            {(item: string) => renderItem(item)}
                          </BaseCombobox.Collection>
                        </BaseCombobox.Group>
                      )
                    : (item: string) => renderItem(item)}
                </BaseCombobox.List>
              </BaseCombobox.Popup>
            </BaseCombobox.Positioner>
          </BaseCombobox.Portal>
        </BaseCombobox.Root>
      )}
    >
      <BaseCombobox.InputGroup
        className={fieldShellStyles({ size, variant, chips: multiple })}
        data-disabled={disabled || undefined}
        data-readonly={readOnly || undefined}
        onMouseDown={(event) => focusInputOnWellPress(event, inputRef.current)}
      >
        {startAdornment && (
          <span className={cx(fieldAdornmentStyles, firstRowStyles)}>
            {startAdornment}
          </span>
        )}
        {multiple ? (
          <BaseCombobox.Chips className={chipsStyles}>
            {selected.map((v) => (
              <BaseCombobox.Chip key={v} className={chipStyles}>
                <span>{labelOf(v)}</span>
                <BaseCombobox.ChipRemove
                  className={chipRemoveStyles}
                  aria-label={removeLabel(labelOf(v))}
                >
                  <X weight="bold" />
                </BaseCombobox.ChipRemove>
              </BaseCombobox.Chip>
            ))}
            {input}
          </BaseCombobox.Chips>
        ) : (
          input
        )}
        <span className={cx(endButtonsStyles, firstRowStyles)}>
          {showClear && (
            <BaseCombobox.Clear
              className={fieldIconButtonStyles}
              aria-label={clearLabel}
            >
              <X weight="bold" />
            </BaseCombobox.Clear>
          )}
          {!readOnly && (
            <BaseCombobox.Trigger
              className={cx(fieldIconButtonStyles, triggerCaretStyles)}
              aria-label={openLabel}
            >
              <CaretDown weight="bold" />
            </BaseCombobox.Trigger>
          )}
        </span>
      </BaseCombobox.InputGroup>
    </FieldShell>
  );
}
