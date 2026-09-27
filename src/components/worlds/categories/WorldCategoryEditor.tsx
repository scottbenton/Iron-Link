import {
  Alert,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  FormControlLabel,
  MenuItem,
  Stack,
  TextField,
} from "@mui/material";
import deepEqual from "fast-deep-equal";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { DialogTitleWithCloseButton } from "components/DialogTitleWithCloseButton";

import { IconDefinition } from "types/Icon.type";

import { IWorldCategory } from "services/worldCategories.service";
import { IWorldFieldDefinition } from "services/worldFieldDefinitions.service";

import { WorldCategoryIconPicker } from "./WorldCategoryIconPicker";
import { editorError, fieldChoiceLabel } from "./categoryEditor.utils";

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
      <DialogTitleWithCloseButton onClose={() => !saving && onClose()}>
        {readOnly
          ? t("worlds.categories.view", "Category configuration")
          : category
            ? t("worlds.categories.edit", "Edit category")
            : t("worlds.categories.add", "Add category")}
      </DialogTitleWithCloseButton>
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
          <WorldCategoryIconPicker
            value={draft.icon}
            onChange={(icon) =>
              setDraft({ ...draft, icon: icon ?? { key: null, color: null } })
            }
            disabled={saving || readOnly}
          />
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
      <DialogActions sx={{ px: 3, py: 2 }}>
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
