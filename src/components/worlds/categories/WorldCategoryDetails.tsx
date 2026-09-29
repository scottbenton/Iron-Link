import { Alert, Box, MenuItem, Stack, TextField } from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { WorldSettingsSection } from "components/worlds/WorldSettingsSection";

import { useDebouncedSync } from "hooks/useDebouncedSync";

import { useWorldCategoriesStore } from "stores/worldCategories.store";

import type { IWorldCategory } from "services/worldCategories.service";
import type { IWorldFieldDefinition } from "services/worldFieldDefinitions.service";

import { WorldCategoryCapabilities } from "./WorldCategoryCapabilities";
import { WorldCategoryIconPicker } from "./WorldCategoryIconPicker";
import { editorError, fieldChoiceLabel } from "./categoryEditor.utils";

type CategoryChanges = Partial<Omit<IWorldCategory, "id" | "worldId">>;

// Category details save as they change, like the world name. Toggles show
// their new value right away and fall back if the save fails.
export function WorldCategoryDetails({
  category,
  fields,
  readOnly,
  disabled,
}: {
  category: IWorldCategory;
  fields: IWorldFieldDefinition[];
  readOnly: boolean;
  disabled: boolean;
}) {
  const { t } = useTranslation();
  const updateCategory = useWorldCategoriesStore(
    (store) => store.updateCategory,
  );
  const [pending, setPending] = useState<CategoryChanges>({});
  const [error, setError] = useState<string>();
  useEffect(() => {
    setPending({});
  }, [category]);
  const current = { ...category, ...pending };
  const inactive = readOnly || disabled;

  const save = useCallback(
    (changes: CategoryChanges) => {
      setError(undefined);
      setPending((previous) => ({ ...previous, ...changes }));
      updateCategory(category.id, changes).catch((cause) => {
        setPending((previous) => {
          const next = { ...previous };
          (Object.keys(changes) as (keyof CategoryChanges)[]).forEach(
            (key) => delete next[key],
          );
          return next;
        });
        setError(
          editorError(
            cause,
            t(
              "worlds.categories.save-error",
              "Could not save this category. Please try again.",
            ),
          ),
        );
      });
    },
    [category.id, updateCategory, t],
  );
  const persistName = useCallback(
    (name: string) => {
      const trimmed = name.trim();
      if (trimmed && trimmed !== category.name) save({ name: trimmed });
    },
    [category.name, save],
  );
  const [name, setName] = useDebouncedSync(
    inactive ? undefined : persistName,
    category.name,
    800,
  );

  return (
    <WorldSettingsSection title={t("worlds.categories.details", "Details")}>
      <Stack spacing={3} useFlexGap>
        {error && (
          <Alert severity="error" onClose={() => setError(undefined)}>
            {error}
          </Alert>
        )}
        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
          <WorldCategoryIconPicker
            value={current.icon}
            disabled={inactive}
            onChange={(icon) =>
              save({ icon: icon ?? { key: null, color: null } })
            }
          />
          <TextField
            required
            fullWidth
            label={t("worlds.categories.name", "Category name")}
            value={name}
            disabled={inactive}
            error={!inactive && !name.trim()}
            helperText={
              inactive
                ? undefined
                : t(
                    "worlds.categories.name-help",
                    "Changes save automatically.",
                  )
            }
            onChange={(event) => setName(event.target.value)}
          />
        </Box>
        <TextField
          select
          fullWidth
          label={t("worlds.categories.subtitle", "Entry subtitle field")}
          helperText={t(
            "worlds.categories.subtitle-help",
            "Shown under each entry's name in lists.",
          )}
          value={current.subtitleFieldDefinitionId ?? ""}
          disabled={inactive}
          onChange={(event) =>
            save({ subtitleFieldDefinitionId: event.target.value || null })
          }
        >
          <MenuItem value="">{t("common.none", "None")}</MenuItem>
          {fields.map((field) => (
            <MenuItem key={field.id} value={field.id}>
              {fieldChoiceLabel(field, fields)}
            </MenuItem>
          ))}
        </TextField>
        <WorldCategoryCapabilities
          value={current}
          disabled={inactive}
          onChange={save}
        />
      </Stack>
    </WorldSettingsSection>
  );
}
