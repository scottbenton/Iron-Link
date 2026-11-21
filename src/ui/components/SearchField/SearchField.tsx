import { MagnifyingGlass } from "@phosphor-icons/react";
import { KeyboardEvent, forwardRef } from "react";

import { useControllableState } from "../../hooks/useControllableState";
import { TextField, TextFieldProps } from "../TextField";

export interface SearchFieldProps
  extends Omit<TextFieldProps, "type" | "clearable" | "startAdornment"> {
  /** Named "Search" by default, and hidden; pass `hideLabel={false}` to show it. */
  label?: TextFieldProps["label"];
}

/**
 * A search input: a magnifier, a clear button while there is text, and
 * Escape to clear. Escape on an empty field passes on, so it still closes a
 * dialog or popover around it.
 *
 * ```tsx
 * <SearchField label="Search moves" value={query} onValueChange={setQuery} />
 * ```
 */
export const SearchField = forwardRef<HTMLInputElement, SearchFieldProps>(
  function SearchField(props, ref) {
    const {
      label = "Search",
      hideLabel = true,
      value: valueProp,
      defaultValue = "",
      onValueChange,
      onKeyDown,
      onClear,
      autoComplete = "off",
      ...rest
    } = props;
    const [value, setValue] = useControllableState(
      valueProp,
      defaultValue,
      onValueChange,
    );

    return (
      <TextField
        ref={ref}
        type="search"
        label={label}
        hideLabel={hideLabel}
        autoComplete={autoComplete}
        startAdornment={<MagnifyingGlass aria-hidden />}
        clearable
        value={value}
        onValueChange={setValue}
        onClear={onClear}
        onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
          onKeyDown?.(event);
          if (event.defaultPrevented) return;
          if (event.key === "Escape" && value !== "") {
            event.preventDefault();
            event.stopPropagation();
            setValue("");
            onClear?.();
          }
        }}
        {...rest}
      />
    );
  },
);
