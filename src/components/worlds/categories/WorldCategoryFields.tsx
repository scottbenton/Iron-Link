import {
  Alert,
  Box,
  Button,
  Chip,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { useConfirm } from "material-ui-confirm";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { v4 as uuid } from "uuid";

import { useWorldCategoriesStore } from "stores/worldCategories.store";

import { generateWorldFieldKey } from "lib/worldFieldRules";

import {
  IWorldCategory,
  WorldCategoriesService,
} from "services/worldCategories.service";
import {
  IWorldFieldDefinition,
  WorldFieldType,
} from "services/worldFieldDefinitions.service";

import { FieldDraft, WorldFieldEditor } from "./WorldFieldEditor";
import {
  FIELD_TYPE_LABELS,
  editorError,
  fieldChoiceLabel,
  getReferencingFields,
} from "./categoryEditor.utils";

export function WorldCategoryFields({
  category,
  fields,
  canEdit,
  canDelete,
}: {
  category: IWorldCategory;
  fields: IWorldFieldDefinition[];
  canEdit: boolean;
  canDelete: boolean;
}) {
  const { t } = useTranslation();
  const confirm = useConfirm();
  const createField = useWorldCategoriesStore(
    (store) => store.createFieldDefinition,
  );
  const updateField = useWorldCategoriesStore(
    (store) => store.updateFieldDefinition,
  );
  const deleteField = useWorldCategoriesStore(
    (store) => store.deleteFieldDefinition,
  );
  const [editor, setEditor] = useState<{
    field?: IWorldFieldDefinition;
    valueCount: number;
  }>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    setError(undefined);
    try {
      await action();
    } catch (cause) {
      setError(
        editorError(
          cause,
          t(
            "worlds.fields.action-error",
            "Could not update these fields. Please try again.",
          ),
        ),
      );
    } finally {
      setBusy(false);
    }
  };
  const edit = (field: IWorldFieldDefinition) =>
    run(async () => {
      if (!canEdit) {
        setEditor({ field, valueCount: 0 });
        return;
      }
      const counts = await WorldCategoriesService.getCategoryCounts(
        category.id,
      );
      setEditor({ field, valueCount: counts.valueCounts[field.id] ?? 0 });
    });
  const remove = (field: IWorldFieldDefinition) =>
    run(async () => {
      const references = getReferencingFields(field.id, fields);
      if (references.length) {
        setError(
          t(
            "worlds.fields.referenced-delete",
            "This field is used by conditions in {{fields}}. Remove or redirect those conditions before deleting it.",
            {
              fields: references
                .map((reference) => fieldChoiceLabel(reference, fields))
                .join(", "),
            },
          ),
        );
        return;
      }
      const counts = await WorldCategoriesService.getCategoryCounts(
        category.id,
      );
      const { confirmed } = await confirm({
        title: t("worlds.fields.delete", "Delete field"),
        description: t(
          "worlds.fields.delete-confirmation",
          'Delete "{{label}}"? This permanently deletes {{count}} stored values across this category’s entries. This cannot be undone.',
          { label: field.label, count: counts.valueCounts[field.id] ?? 0 },
        ),
        confirmationText: t("common.delete", "Delete"),
      });
      if (confirmed) await deleteField(field.id);
    });
  const move = (index: number, offset: number) =>
    run(async () => {
      const next = [...fields];
      [next[index], next[index + offset]] = [next[index + offset], next[index]];
      await WorldCategoriesService.reorderFields(
        category.id,
        next.map((field) => field.id),
      );
    });
  const save = async (draft: FieldDraft, createNew: boolean) => {
    const normalized = {
      ...draft,
      configuration: {
        ...draft.configuration,
        suggestions:
          draft.type !== WorldFieldType.Text
            ? []
            : [
                ...new Set(
                  draft.configuration.suggestions
                    .map((suggestion) => suggestion.trim())
                    .filter(Boolean),
                ),
              ],
      },
    };
    if (editor?.field && !createNew) {
      await updateField(editor.field.id, normalized);
    } else {
      const id = uuid();
      await createField(category.worldId, category.id, {
        ...normalized,
        id,
        key: generateWorldFieldKey(id),
        binding: normalized.binding ?? undefined,
        sortOrder: fields.length
          ? Math.max(...fields.map((field) => field.sortOrder)) + 1
          : 0,
      });
    }
  };
  return (
    <Stack spacing={2}>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography variant="h6">
          {t("worlds.fields.title", "Fields")}
        </Typography>
        {canEdit && (
          <Button disabled={busy} onClick={() => setEditor({ valueCount: 0 })}>
            {t("worlds.fields.add", "Add field")}
          </Button>
        )}
      </Stack>
      {error && (
        <Alert severity="error" onClose={() => setError(undefined)}>
          {error}
        </Alert>
      )}
      {fields.length === 0 && (
        <Typography color="text.secondary">
          {t("worlds.fields.empty-state", "This category has no fields yet.")}
        </Typography>
      )}
      {fields.map((field, index) => (
        <Paper variant="outlined" sx={{ p: 2 }} key={field.id}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            gap={1}
            justifyContent="space-between"
          >
            <Box>
              <Typography fontWeight="bold">
                {fieldChoiceLabel(field, fields)}
              </Typography>
              <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                <Chip
                  size="small"
                  label={t(
                    `worlds.fields.type-${field.type}`,
                    FIELD_TYPE_LABELS[field.type],
                  )}
                />
                {field.configuration.rules.length > 0 && (
                  <Chip
                    size="small"
                    label={
                      field.configuration.rules.length === 1
                        ? t("worlds.fields.rule-count-one", "1 rule")
                        : t("worlds.fields.rule-count", "{{count}} rules", {
                            count: field.configuration.rules.length,
                          })
                    }
                  />
                )}
                {field.gmOnly && (
                  <Chip
                    size="small"
                    label={t("worlds.fields.gm-badge", "GM only")}
                  />
                )}
                {category.subtitleFieldDefinitionId === field.id && (
                  <Chip
                    size="small"
                    label={t("worlds.fields.subtitle-badge", "Subtitle")}
                  />
                )}
              </Stack>
            </Box>
            <Stack direction="row" flexWrap="wrap">
              {canEdit && (
                <>
                  <Button
                    aria-label={t(
                      "worlds.fields.move-up-label",
                      "Move {{label}} up",
                      { label: fieldChoiceLabel(field, fields) },
                    )}
                    disabled={busy || index === 0}
                    onClick={() => move(index, -1)}
                  >
                    {t("common.move-up", "Move up")}
                  </Button>
                  <Button
                    aria-label={t(
                      "worlds.fields.move-down-label",
                      "Move {{label}} down",
                      { label: fieldChoiceLabel(field, fields) },
                    )}
                    disabled={busy || index === fields.length - 1}
                    onClick={() => move(index, 1)}
                  >
                    {t("common.move-down", "Move down")}
                  </Button>
                </>
              )}
              <Button disabled={busy} onClick={() => edit(field)}>
                {canEdit
                  ? t("common.edit", "Edit")
                  : t("worlds.fields.view", "Field configuration")}
              </Button>
              {canDelete && (
                <Button
                  color="error"
                  disabled={busy}
                  onClick={() => remove(field)}
                >
                  {t("worlds.fields.delete", "Delete field")}
                </Button>
              )}
            </Stack>
          </Stack>
        </Paper>
      ))}
      {editor && (
        <WorldFieldEditor
          key={editor.field?.id ?? "new"}
          worldId={category.worldId}
          field={editor.field}
          fields={fields}
          valueCount={editor.valueCount}
          readOnly={!canEdit}
          onClose={() => setEditor(undefined)}
          onSave={save}
        />
      )}
    </Stack>
  );
}
