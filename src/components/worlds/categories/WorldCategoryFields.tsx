import { Alert, Button, Paper, Stack, Typography } from "@mui/material";
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

import { WorldCategoryFieldRow } from "./WorldCategoryFieldRow";
import { WorldConfigurationDeleteDialog } from "./WorldConfigurationDeleteDialog";
import { WorldConfigurationSortList } from "./WorldConfigurationSortList";
import { FieldDraft, WorldFieldEditor } from "./WorldFieldEditor";
import {
  editorError,
  fieldChoiceLabel,
  getReferencingFields,
} from "./categoryEditor.utils";
import { useWorldConfigurationDeleteConfirmation } from "./useWorldConfigurationDeleteConfirmation";

export function WorldCategoryFields({
  category,
  fields,
  canEdit,
  canDelete,
  configurationReady,
}: {
  category: IWorldCategory;
  fields: IWorldFieldDefinition[];
  canEdit: boolean;
  canDelete: boolean;
  configurationReady: boolean;
}) {
  const { t } = useTranslation();
  const reorderFields = useWorldCategoriesStore((store) => store.reorderFields);
  const {
    confirm,
    request: deleteRequest,
    answer: answerDelete,
  } = useWorldConfigurationDeleteConfirmation();
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
        category.worldId,
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
        category.worldId,
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
  const reorder = (ids: string[]) => run(() => reorderFields(category.id, ids));
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
          <Button
            disabled={busy || !configurationReady}
            onClick={() => setEditor({ valueCount: 0 })}
          >
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
          {t(
            "worlds.fields.empty-state",
            "This category has no additional fields yet.",
          )}
        </Typography>
      )}
      <WorldConfigurationSortList
        items={fields.map((field) => ({
          id: field.id,
          label: fieldChoiceLabel(field, fields),
        }))}
        onReorder={reorder}
      >
        <Stack spacing={1}>
          {fields.map((field) => (
            <WorldCategoryFieldRow
              key={field.id}
              field={field}
              label={fieldChoiceLabel(field, fields)}
              subtitle={category.subtitleFieldDefinitionId === field.id}
              canEdit={canEdit}
              canDelete={canDelete}
              disabled={busy || !configurationReady}
              busy={busy}
              onEdit={() => edit(field)}
              onDelete={() => remove(field)}
            />
          ))}
        </Stack>
      </WorldConfigurationSortList>
      <Paper
        variant="outlined"
        sx={{ p: 2, color: "text.secondary", bgcolor: "action.hover" }}
      >
        <Typography fontWeight="bold">
          {t("worlds.fields.intrinsic-notes", "Notes")}
        </Typography>
        <Typography variant="body2">
          {t(
            "worlds.fields.intrinsic-notes-help",
            "Included with every entry. Notes cannot be removed or reordered.",
          )}
        </Typography>
      </Paper>
      <WorldConfigurationDeleteDialog
        request={deleteRequest}
        onAnswer={answerDelete}
      />
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
