import AddIcon from "@mui/icons-material/Add";
import {
  Alert,
  Button,
  Card,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { v4 as uuid } from "uuid";

import { WorldSettingsSection } from "components/worlds/WorldSettingsSection";

import { useWorldCategoriesStore } from "stores/worldCategories.store";

import {
  generateWorldFieldKey,
  isWorldCategoryReferenceType,
  withoutWorldFieldOracleBindings,
} from "lib/worldFieldRules";

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
  isRetiredGMNotes,
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
  const visibleFields = fields.filter((field) => !isRetiredGMNotes(field));
  const reorderFields = useWorldCategoriesStore((store) => store.reorderFields);
  const targetCategories = useWorldCategoriesStore((store) =>
    Object.values(store.categories)
      .filter((candidate) => candidate.worldId === category.worldId)
      .sort(
        (a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name),
      ),
  );
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
  // Called from the field editor, which shows any error and closes itself
  // once the field is gone.
  const remove = async (field: IWorldFieldDefinition) => {
    const references = getReferencingFields(field.id, fields);
    if (references.length) {
      throw new Error(
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
    return confirmed;
  };
  const reorder = (ids: string[]) => {
    let visibleIndex = 0;
    const completeOrder = fields.map((field) =>
      isRetiredGMNotes(field) ? field.id : ids[visibleIndex++],
    );
    return run(() => reorderFields(category.id, completeOrder));
  };
  const save = async (draft: FieldDraft, createNew: boolean) => {
    const categoryReference = isWorldCategoryReferenceType(draft.type);
    const normalized = {
      ...draft,
      binding: categoryReference ? null : draft.binding,
      configuration: {
        ...draft.configuration,
        targetCategoryId: categoryReference
          ? draft.configuration.targetCategoryId
          : undefined,
        rules: categoryReference
          ? withoutWorldFieldOracleBindings(draft.configuration.rules)
          : draft.configuration.rules,
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
    <WorldSettingsSection
      title={t("worlds.fields.title", "Fields")}
      action={
        canEdit && (
          <Button
            startIcon={<AddIcon />}
            disabled={busy || !configurationReady}
            onClick={() => setEditor({ valueCount: 0 })}
          >
            {t("worlds.fields.add", "Add field")}
          </Button>
        )
      }
    >
      {error && (
        <Alert
          severity="error"
          onClose={() => setError(undefined)}
          sx={{ mb: 2 }}
        >
          {error}
        </Alert>
      )}
      <Card variant="outlined">
        <List disablePadding>
          <WorldConfigurationSortList
            items={visibleFields.map((field) => ({
              id: field.id,
              label: fieldChoiceLabel(field, fields),
            }))}
            onReorder={reorder}
          >
            {visibleFields.map((field) => (
              <WorldCategoryFieldRow
                key={field.id}
                field={field}
                label={fieldChoiceLabel(field, fields)}
                subtitle={category.subtitleFieldDefinitionId === field.id}
                canEdit={canEdit}
                disabled={busy || !configurationReady}
                busy={busy}
                divider
                onEdit={() => edit(field)}
              />
            ))}
          </WorldConfigurationSortList>
          {visibleFields.length === 0 && (
            <ListItem divider>
              <ListItemText
                secondary={t(
                  "worlds.fields.empty-state",
                  "This category has no additional fields yet.",
                )}
              />
            </ListItem>
          )}
          <ListItem sx={{ bgcolor: "action.hover" }}>
            <ListItemText
              sx={{ pl: canEdit ? 5 : 0 }}
              primary={t("worlds.fields.intrinsic-notes", "Notes")}
              secondary={t(
                "worlds.fields.intrinsic-notes-help",
                "Included with every entry. Notes cannot be removed or reordered.",
              )}
              slotProps={{ primary: { color: "text.secondary" } }}
            />
          </ListItem>
        </List>
      </Card>
      <WorldConfigurationDeleteDialog
        request={deleteRequest}
        onAnswer={answerDelete}
      />
      {editor && (
        <WorldFieldEditor
          key={editor.field?.id ?? "new"}
          worldId={category.worldId}
          field={editor.field}
          fields={visibleFields}
          categories={targetCategories}
          valueCount={editor.valueCount}
          readOnly={!canEdit}
          onClose={() => setEditor(undefined)}
          onSave={save}
          onDelete={
            canDelete && editor.field
              ? () => remove(editor.field as IWorldFieldDefinition)
              : undefined
          }
        />
      )}
    </WorldSettingsSection>
  );
}
