import {
  Autocomplete,
  type AutocompleteRenderInputParams,
  Box,
  Chip,
  TextField,
  Typography,
} from "@mui/material";
import { type ReactNode, useId, useMemo, useState } from "react";

import { useWorldCategoriesStore } from "stores/worldCategories.store";

import {
  type ResolvedWorldFieldDefinition,
  WORLD_FIELD_VALUE_MAX_LENGTH,
  normalizeWorldFieldOptions,
} from "lib/worldFieldRules";

import type { WorldFieldValue } from "services/worldEntryFieldValues.service";

import {
  WorldEntryFieldShell,
  getWorldEntryFieldHelpId,
  useEmptyFieldText,
  worldEntryValueInputSx,
} from "./WorldEntryFieldShell";
import { getWorldFieldValueList } from "./worldEntryFieldValue";

// Picks from the field's options. An open list also offers values other
// entries already use, fetched each time it opens, and accepts typed ones. A
// strict list only offers its options, but keeps showing a stored value that
// is no longer among them.
export function WorldEntryOptionListField({
  field,
  value,
  canEdit,
  onSave,
  onRoll,
}: {
  field: ResolvedWorldFieldDefinition;
  value: WorldFieldValue | null | undefined;
  canEdit: boolean;
  onSave: (value: WorldFieldValue | null) => void;
  // Rolls the field's oracle; offered only where it has one.
  onRoll?: () => void;
}) {
  const getFieldOptions = useWorldCategoriesStore(
    (store) => store.getFieldOptions,
  );
  const { multiple, allowOther: open, suggestions } = field.configuration;
  const inputId = useId();
  const emptyText = useEmptyFieldText();
  const [fetched, setFetched] = useState<string[]>();
  const [loading, setLoading] = useState(false);
  // Stable between renders: the autocomplete clears typed text whenever its
  // value changes identity.
  const selected = useMemo(() => getWorldFieldValueList(value), [value]);

  if (!canEdit) {
    return (
      <WorldEntryFieldShell label={field.label}>
        {multiple ? (
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mt: 0.25 }}>
            {selected.map((option) => (
              <Chip key={option} size="small" label={option} />
            ))}
          </Box>
        ) : (
          <Typography sx={{ fontSize: 15, overflowWrap: "anywhere" }}>
            {selected[0]}
          </Typography>
        )}
      </WorldEntryFieldShell>
    );
  }

  const options = [
    ...new Set([...((open && fetched) || suggestions), ...selected]),
  ];
  const loadOptions = () => {
    if (!open) return;
    setLoading(true);
    getFieldOptions(field.id)
      .then(setFetched)
      // The configured options and typed values still work.
      .catch(() => {})
      .finally(() => setLoading(false));
  };
  const input = (params: AutocompleteRenderInputParams) => (
    <TextField
      {...params}
      variant="standard"
      placeholder={selected.length ? undefined : emptyText}
      inputProps={{
        ...params.inputProps,
        maxLength: WORLD_FIELD_VALUE_MAX_LENGTH,
        "aria-describedby": field.helpText
          ? getWorldEntryFieldHelpId(inputId)
          : undefined,
      }}
      InputProps={{
        ...params.InputProps,
        disableUnderline: true,
        sx: worldEntryValueInputSx,
      }}
    />
  );
  const shell = (control: ReactNode) => (
    <WorldEntryFieldShell
      label={field.label}
      helpText={field.helpText || undefined}
      inputId={inputId}
      onRoll={onRoll}
      empty={!selected.length}
    >
      {control}
    </WorldEntryFieldShell>
  );

  if (multiple) {
    return shell(
      <Autocomplete
        id={inputId}
        multiple
        freeSolo={open}
        autoSelect={open}
        filterSelectedOptions
        options={options}
        value={selected}
        loading={loading}
        onOpen={loadOptions}
        onChange={(_, next) => onSave(normalizeWorldFieldOptions(next))}
        renderValue={(values, getItemProps) =>
          values.map((option, index) => {
            const { key, ...itemProps } = getItemProps({ index });
            return (
              <Chip key={key} size="small" label={option} {...itemProps} />
            );
          })
        }
        renderInput={input}
      />,
    );
  }
  return shell(
    <Autocomplete
      id={inputId}
      freeSolo={open}
      autoSelect={open}
      options={options}
      value={selected[0] ?? null}
      loading={loading}
      onOpen={loadOptions}
      onChange={(_, next) => onSave(next?.trim() || null)}
      renderInput={input}
    />,
  );
}
