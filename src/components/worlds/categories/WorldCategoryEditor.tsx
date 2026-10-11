import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  Stack,
  TextField,
} from "@mui/material";
import { FormEvent, useState } from "react";
import { useTranslation } from "react-i18next";

import { DialogTitleWithCloseButton } from "components/DialogTitleWithCloseButton";

import { IconDefinition } from "types/Icon.type";

import { WorldCategoryCapabilities } from "./WorldCategoryCapabilities";
import { WorldCategoryIconPicker } from "./WorldCategoryIconPicker";
import { getEditorErrorMessage } from "./categoryEditor.utils";

export interface CategoryDraft {
  name: string;
  icon: IconDefinition;
  supportsHierarchy: boolean;
  supportsMap: boolean;
  supportsBonds: boolean;
}

// Creates a category. Existing categories are edited inline in settings.
export function WorldCategoryEditor({
  onSave,
  onClose,
}: {
  onSave: (draft: CategoryDraft) => Promise<void>;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState<CategoryDraft>({
    name: "",
    icon: { key: null, color: null },
    supportsHierarchy: false,
    supportsMap: false,
    supportsBonds: false,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();
  const save = async (event?: FormEvent) => {
    event?.preventDefault();
    if (!draft.name.trim() || saving) return;
    setSaving(true);
    setError(undefined);
    try {
      await onSave({ ...draft, name: draft.name.trim() });
      onClose();
    } catch (cause) {
      setError(getEditorErrorMessage(cause));
    } finally {
      setSaving(false);
    }
  };
  return (
    <Dialog
      open
      fullWidth
      maxWidth="sm"
      onClose={saving ? undefined : onClose}
      slotProps={{ paper: { component: "form", onSubmit: save } }}
    >
      <DialogTitleWithCloseButton onClose={() => !saving && onClose()}>
        {t("worlds.categories.add", "Add category")}
      </DialogTitleWithCloseButton>
      <DialogContent>
        <Stack spacing={3} useFlexGap sx={{ pt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}
          <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
            <WorldCategoryIconPicker
              value={draft.icon}
              onChange={(icon) =>
                setDraft({ ...draft, icon: icon ?? { key: null, color: null } })
              }
              disabled={saving}
            />
            <TextField
              autoFocus
              required
              fullWidth
              label={t("worlds.categories.name", "Category name")}
              value={draft.name}
              onChange={(event) =>
                setDraft({ ...draft, name: event.target.value })
              }
              disabled={saving}
            />
          </Box>
          <WorldCategoryCapabilities
            value={draft}
            disabled={saving}
            onChange={(changes) => setDraft({ ...draft, ...changes })}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button color="inherit" disabled={saving} onClick={onClose}>
          {t("common.cancel", "Cancel")}
        </Button>
        <Button
          type="submit"
          variant="contained"
          disabled={saving || !draft.name.trim()}
        >
          {t("worlds.categories.create", "Create category")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
