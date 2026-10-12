import {
  Autocomplete,
  type AutocompleteRenderInputParams,
  Box,
  Chip,
  TextField,
  Typography,
} from "@mui/material";
import { useMemo, useState } from "react";

import { useWorldCategoriesStore } from "stores/worldCategories.store";

import {
  type ResolvedWorldFieldDefinition,
  WORLD_FIELD_VALUE_MAX_LENGTH,
  normalizeWorldFieldOptions,
} from "lib/worldFieldRules";

import type { WorldFieldValue } from "services/worldEntryFieldValues.service";

import { WorldEntryLabelledField } from "./WorldEntryLabelledField";
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
}: {
  field: ResolvedWorldFieldDefinition;
  value: WorldFieldValue | null | undefined;
  canEdit: boolean;
  onSave: (value: WorldFieldValue | null) => void;
}) {
  const getFieldOptions = useWorldCategoriesStore(
    (store) => store.getFieldOptions,
  );
  const { multiple, allowOther: open, suggestions } = field.configuration;
  const [fetched, setFetched] = useState<string[]>();
  const [loading, setLoading] = useState(false);
  // Stable between renders: the autocomplete clears typed text whenever its
  // value changes identity.
  const selected = useMemo(() => getWorldFieldValueList(value), [value]);

  if (!canEdit) {
    return (
      <WorldEntryLabelledField label={field.label}>
        {multiple ? (
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
            {selected.map((option) => (
              <Chip key={option} size="small" label={option} />
            ))}
          </Box>
        ) : (
          <Typography sx={{ overflowWrap: "anywhere" }}>
            {selected[0]}
          </Typography>
        )}
      </WorldEntryLabelledField>
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
      inputProps={{
        ...params.inputProps,
        maxLength: WORLD_FIELD_VALUE_MAX_LENGTH,
      }}
      label={field.label}
      helperText={field.helpText || undefined}
    />
  );

  if (multiple) {
    return (
      <Autocomplete
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
      />
    );
  }
  return (
    <Autocomplete
      freeSolo={open}
      autoSelect={open}
      options={options}
      value={selected[0] ?? null}
      loading={loading}
      onOpen={loadOptions}
      onChange={(_, next) => onSave(next?.trim() || null)}
      renderInput={input}
    />
  );
}
