import {
  Box,
  FormControl,
  FormHelperText,
  FormLabel,
  MenuItem,
  TextField,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { useWorldCategoriesStore } from "stores/worldCategories.store";

import { normalizeWorldSubtitleValue } from "lib/worldEntrySubtitle";
import { normalizeWorldFieldConfiguration } from "lib/worldFieldConfiguration";

import type { IWorldCategorySubtitleOverride } from "services/worldCategories.service";
import type { IWorldFieldDefinition } from "services/worldFieldDefinitions.service";

import { fieldChoiceLabel } from "./categoryEditor.utils";

// One subtitle choice per value of a single-choice subtitle field, such as
// Region for a Sector. A value left on the default shows the subtitle field
// itself, and entries fall back to it while the chosen field is empty.
export function WorldCategorySubtitleOverrides({
  subtitleField,
  fields,
  value,
  disabled,
  onChange,
}: {
  subtitleField: IWorldFieldDefinition;
  fields: IWorldFieldDefinition[];
  value: IWorldCategorySubtitleOverride[];
  disabled: boolean;
  onChange: (overrides: IWorldCategorySubtitleOverride[]) => void;
}) {
  const { t } = useTranslation();
  const types = useSubtitleFieldValues(subtitleField, value);
  const choices = fields.filter((field) => field.id !== subtitleField.id);
  if (types.length === 0 || choices.length === 0) return null;

  const overrideFor = (type: string) =>
    value.find(
      (override) =>
        normalizeWorldSubtitleValue(override.value) ===
          normalizeWorldSubtitleValue(type) &&
        choices.some((field) => field.id === override.fieldDefinitionId),
    );
  const setOverride = (type: string, fieldDefinitionId: string) => {
    const rest = value.filter(
      (override) =>
        normalizeWorldSubtitleValue(override.value) !==
        normalizeWorldSubtitleValue(type),
    );
    onChange(
      fieldDefinitionId ? [...rest, { value: type, fieldDefinitionId }] : rest,
    );
  };

  return (
    <FormControl component="fieldset">
      <FormLabel component="legend">
        {t("worlds.categories.subtitle-overrides", "Subtitle by {{field}}", {
          field: subtitleField.label,
        })}
      </FormLabel>
      <FormHelperText sx={{ mx: 0, mt: 0, mb: 1.5 }}>
        {t(
          "worlds.categories.subtitle-overrides-help",
          "Show a different field for some types. An entry shows its {{field}} when that field is empty or hidden.",
          { field: subtitleField.label },
        )}
      </FormHelperText>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fill, minmax(min(100%, 14rem), 1fr))",
          gap: 2,
        }}
      >
        {types.map((type) => (
          <TextField
            key={type}
            select
            size="small"
            label={type}
            value={overrideFor(type)?.fieldDefinitionId ?? ""}
            disabled={disabled}
            // The default reads as the subtitle field's own name.
            slotProps={{
              select: { displayEmpty: true },
              inputLabel: { shrink: true },
            }}
            onChange={(event) => setOverride(type, event.target.value)}
          >
            <MenuItem value="">{subtitleField.label}</MenuItem>
            {choices.map((field) => (
              <MenuItem key={field.id} value={field.id}>
                {fieldChoiceLabel(field, fields, t)}
              </MenuItem>
            ))}
          </TextField>
        ))}
      </Box>
    </FormControl>
  );
}

// The values a subtitle field offers: its options, the ones entries already
// use, then any an override names, each once.
function useSubtitleFieldValues(
  field: IWorldFieldDefinition,
  overrides: IWorldCategorySubtitleOverride[],
) {
  const getFieldOptions = useWorldCategoriesStore(
    (store) => store.getFieldOptions,
  );
  const [used, setUsed] = useState<string[]>([]);
  useEffect(() => {
    setUsed([]);
    let active = true;
    getFieldOptions(field.id)
      .then((options) => active && setUsed(options))
      // The configured options still work.
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [field.id, getFieldOptions]);

  return useMemo(() => {
    const { suggestions } = normalizeWorldFieldConfiguration(
      field.configuration,
      field.type,
    );
    const seen = new Set<string>();
    return [
      ...suggestions,
      ...used,
      ...overrides.map((override) => override.value),
    ]
      .map((type) => type.trim())
      .filter((type) => {
        const key = normalizeWorldSubtitleValue(type);
        if (!type || seen.has(key)) return false;
        seen.add(key);
        return true;
      });
  }, [field, used, overrides]);
}
