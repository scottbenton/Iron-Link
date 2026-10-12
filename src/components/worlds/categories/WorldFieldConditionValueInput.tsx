import { Autocomplete, TextField } from "@mui/material";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { useWorldCategoriesStore } from "stores/worldCategories.store";
import { useWorldEntriesStore } from "stores/worldEntries.store";

import {
  WORLD_FIELD_VALUE_MAX_LENGTH,
  getWorldFieldKind,
} from "lib/worldFieldRules";

import type { IWorldFieldDefinition } from "services/worldFieldDefinitions.service";

// Picks a value to compare instead of typing it, so a typo can never silently
// break a rule. Text and open lists may still use a value nobody has stored
// yet; strict lists only offer their options, and a linked entry picks one of
// the entries its field can link to.
export function WorldFieldConditionValueInput({
  field,
  label,
  value,
  disabled,
  onChange,
}: {
  field: IWorldFieldDefinition | undefined;
  label: string;
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  const { t } = useTranslation();
  const kind = field ? getWorldFieldKind(field) : undefined;
  const fieldId = field?.id;
  const targetCategoryId = field?.configuration.targetCategoryId;
  const getFieldOptions = useWorldCategoriesStore(
    (store) => store.getFieldOptions,
  );
  const entries = useWorldEntriesStore((store) =>
    kind === "linkedEntry"
      ? Object.values(store.entryState.entries)
          .filter((entry) => entry.categoryId === targetCategoryId)
          .map((entry) => ({ id: entry.id, name: entry.name }))
          .sort((a, b) => a.name.localeCompare(b.name))
      : [],
  );
  const [loaded, setLoaded] = useState<{
    fieldId: string;
    options: string[];
  }>();
  const listed = kind === "text" || kind === "optionList";
  useEffect(() => {
    if (!listed || !fieldId) return;
    let active = true;
    getFieldOptions(fieldId)
      .then((options) => {
        if (active) setLoaded({ fieldId, options });
      })
      .catch(() => {
        // The value can still be kept or, where allowed, typed.
        if (active) setLoaded({ fieldId, options: [] });
      });
    return () => {
      active = false;
    };
  }, [listed, fieldId, getFieldOptions]);

  const small = { size: "small" as const, fullWidth: true, disabled };
  if (kind === "linkedEntry") {
    const ids = entries.map((entry) => entry.id);
    return (
      <Autocomplete
        // Keyed by field: typed text belongs to one field's values and must
        // not linger when the source changes and its value resets.
        key={fieldId}
        {...small}
        options={value && !ids.includes(value) ? [...ids, value] : ids}
        value={value || null}
        getOptionLabel={(id) =>
          entries.find((entry) => entry.id === id)?.name ??
          t("worlds.fields.missing-entry", "Unavailable entry")
        }
        onChange={(_, next) => onChange(next ?? "")}
        renderInput={(params) => (
          <TextField
            {...params}
            inputProps={{
              ...params.inputProps,
              maxLength: WORLD_FIELD_VALUE_MAX_LENGTH,
            }}
            label={label}
          />
        )}
      />
    );
  }

  const options = loaded && loaded.fieldId === fieldId ? loaded.options : [];
  const open = kind === "text" || !!field?.configuration.allowOther;
  return (
    <Autocomplete
      key={fieldId}
      {...small}
      freeSolo={open}
      autoSelect={open}
      loading={listed && loaded?.fieldId !== fieldId}
      // A strict list keeps a value that is no longer among its options
      // visible, so the author can see what to replace.
      options={
        value && !options.includes(value) ? [...options, value] : options
      }
      value={value || null}
      onChange={(_, next) => onChange(next?.trim() ?? "")}
      renderInput={(params) => (
        <TextField
          {...params}
          inputProps={{
            ...params.inputProps,
            maxLength: WORLD_FIELD_VALUE_MAX_LENGTH,
          }}
          label={label}
        />
      )}
    />
  );
}
