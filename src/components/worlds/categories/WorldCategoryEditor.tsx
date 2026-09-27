import {
  Alert,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  MenuItem,
  Stack,
  TextField,
} from "@mui/material";
import deepEqual from "fast-deep-equal";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { IconColors, IconDefinition } from "types/Icon.type";

import { IWorldCategory } from "services/worldCategories.service";
import { IWorldFieldDefinition } from "services/worldFieldDefinitions.service";

import { WorldCategoryIcon } from "./WorldCategoryIcon";
import { editorError, fieldChoiceLabel } from "./categoryEditor.utils";
import { CATEGORY_ICONS } from "./categoryIcons";

export interface CategoryDraft {
  name: string;
  icon: IconDefinition;
  supportsHierarchy: boolean;
  supportsMap: boolean;
  supportsBonds: boolean;
  subtitleFieldDefinitionId: string | null;
}

export function WorldCategoryEditor({
  category,
  fields,
  readOnly = false,
  onSave,
  onClose,
}: {
  category?: IWorldCategory;
  readOnly?: boolean;
  fields: IWorldFieldDefinition[];
  onSave: (draft: CategoryDraft) => Promise<void>;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState<CategoryDraft>({
    name: category?.name ?? "",
    icon: category?.icon ?? { key: null, color: null },
    supportsHierarchy: category?.supportsHierarchy ?? false,
    supportsMap: category?.supportsMap ?? false,
    supportsBonds: category?.supportsBonds ?? false,
    subtitleFieldDefinitionId: category?.subtitleFieldDefinitionId ?? null,
  });
  const initialDraft = useRef(draft).current;
  const hasChanges =
    !category ||
    !deepEqual({ ...draft, name: draft.name.trim() }, initialDraft);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();
  const save = async () => {
    if (!hasChanges) return;
    setSaving(true);
    setError(undefined);
    try {
      await onSave({ ...draft, name: draft.name.trim() });
      onClose();
    } catch (cause) {
      setError(
        editorError(
          cause,
          t(
            "worlds.categories.save-error",
            "Could not save this category. Please try again.",
          ),
        ),
      );
    } finally {
      setSaving(false);
    }
  };
  return (
    <Dialog open fullWidth maxWidth="sm" onClose={saving ? undefined : onClose}>
      <DialogTitle>
        {readOnly
          ? t("worlds.categories.view", "Category configuration")
          : category
            ? t("worlds.categories.edit", "Edit category")
            : t("worlds.categories.add", "Add category")}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField
            autoFocus
            required
            label={t("worlds.categories.name", "Category name")}
            value={draft.name}
            onChange={(event) =>
              setDraft({ ...draft, name: event.target.value })
            }
            disabled={saving || readOnly}
          />
          <TextField
            select
            label={t("worlds.categories.icon", "Category icon")}
            value={draft.icon.key ?? ""}
            onChange={(event) =>
              setDraft({
                ...draft,
                icon: { ...draft.icon, key: event.target.value || null },
              })
            }
            disabled={saving || readOnly}
          >
            <MenuItem value="">{t("common.none", "None")}</MenuItem>
            {draft.icon.key &&
              !CATEGORY_ICONS.some(
                (choice) => choice.key === draft.icon.key,
              ) && (
                <MenuItem value={draft.icon.key}>
                  {t("worlds.categories.custom-icon", "Custom icon")}
                </MenuItem>
              )}
            {CATEGORY_ICONS.map((choice) => (
              <MenuItem key={choice.key} value={choice.key}>
                <WorldCategoryIcon
                  icon={{ key: choice.key, color: draft.icon.color }}
                />{" "}
                {t(`worlds.categories.icon-${choice.key}`, choice.label)}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label={t("worlds.categories.icon-color", "Icon color")}
            value={draft.icon.color ?? ""}
            onChange={(event) =>
              setDraft({
                ...draft,
                icon: {
                  ...draft.icon,
                  color: (event.target.value || null) as IconColors | null,
                },
              })
            }
            disabled={saving || readOnly}
          >
            <MenuItem value="">{t("common.default", "Default")}</MenuItem>
            {Object.values(IconColors).map((color) => (
              <MenuItem key={color} value={color}>
                {color}
              </MenuItem>
            ))}
          </TextField>
          <FormControlLabel
            control={
              <Checkbox
                checked={draft.supportsHierarchy}
                disabled={saving || readOnly}
                onChange={(_, checked) =>
                  setDraft({ ...draft, supportsHierarchy: checked })
                }
              />
            }
            label={t(
              "worlds.categories.hierarchy",
              "Supports parent and child entries",
            )}
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={draft.supportsMap}
                disabled={saving || readOnly}
                onChange={(_, checked) =>
                  setDraft({ ...draft, supportsMap: checked })
                }
              />
            }
            label={t("worlds.categories.map", "Supports maps")}
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={draft.supportsBonds}
                disabled={saving || readOnly}
                onChange={(_, checked) =>
                  setDraft({ ...draft, supportsBonds: checked })
                }
              />
            }
            label={t("worlds.categories.bonds", "Supports bonds")}
          />
          {category && (
            <TextField
              select
              label={t("worlds.categories.subtitle", "Entry subtitle field")}
              value={draft.subtitleFieldDefinitionId ?? ""}
              onChange={(event) =>
                setDraft({
                  ...draft,
                  subtitleFieldDefinitionId: event.target.value || null,
                })
              }
              disabled={saving || readOnly}
            >
              <MenuItem value="">{t("common.none", "None")}</MenuItem>
              {fields.map((field) => (
                <MenuItem key={field.id} value={field.id}>
                  {fieldChoiceLabel(field, fields)}
                </MenuItem>
              ))}
            </TextField>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button disabled={saving} onClick={onClose}>
          {readOnly ? t("common.close", "Close") : t("common.cancel", "Cancel")}
        </Button>
        {!readOnly && (
          <Button
            disabled={saving || !draft.name.trim() || !hasChanges}
            onClick={save}
            variant="contained"
          >
            {t("common.save", "Save")}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
