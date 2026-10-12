import {
  Alert,
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
import { PermissionsSelector } from "components/permissions/PermissionsSelector";

import { useUID } from "stores/auth.store";
import {
  useWorldPermission,
  useWorldPermissionControlsShown,
} from "stores/world.store";
import { useWorldEntriesStore } from "stores/worldEntries.store";

import { isGuideEquivalent } from "repositories/shared.types";

import { IWorldCategory } from "services/worldCategories.service";

import { getEditorErrorMessage } from "../categories/categoryEditor.utils";
import {
  getDefaultWorldEntryPermissions,
  getWorldEntryPermissionOptions,
} from "./worldEntryPermissions";

// Creates an entry from a name, plus who can view it when the world has
// anyone to hide it from. Edit access follows from the role's defaults.
export function WorldEntryCreateDialog({
  category,
  onCreated,
  onClose,
}: {
  category: IWorldCategory;
  onCreated: (entryId: string) => void;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const uid = useUID();
  const permission = useWorldPermission();
  const controlsShown = useWorldPermissionControlsShown();
  const createEntry = useWorldEntriesStore((store) => store.createEntry);
  const isGuide = !!permission && isGuideEquivalent(permission);

  const [name, setName] = useState("");
  // Null until the user picks a visibility, so the defaults follow the
  // permission controls if they finish loading while the dialog is open.
  const [chosenPermissions, setChosenPermissions] = useState<ReturnType<
    typeof getDefaultWorldEntryPermissions
  > | null>(null);
  const permissions =
    chosenPermissions ??
    getDefaultWorldEntryPermissions(isGuide, controlsShown);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();

  const { readOptions, editOptions } = getWorldEntryPermissionOptions(t, {
    isAuthor: true,
    isGuide,
  });

  const save = async (event?: FormEvent) => {
    event?.preventDefault();
    if (!uid || !name.trim() || saving) return;
    setSaving(true);
    setError(undefined);
    try {
      const entryId = await createEntry(
        uid,
        category.worldId,
        category.id,
        name.trim(),
        permissions.readPermissions,
        permissions.editPermissions,
      );
      onCreated(entryId);
    } catch (cause) {
      setError(getEditorErrorMessage(cause));
      setSaving(false);
    }
  };

  return (
    <Dialog
      open
      fullWidth
      maxWidth="xs"
      onClose={saving ? undefined : onClose}
      slotProps={{ paper: { component: "form", onSubmit: save } }}
    >
      <DialogTitleWithCloseButton onClose={() => !saving && onClose()}>
        {t("worlds.entries.new-in", "New {{category}} entry", {
          category: category.name,
        })}
      </DialogTitleWithCloseButton>
      <DialogContent>
        <Stack spacing={3} useFlexGap sx={{ pt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField
            label={t("worlds.entries.name", "Name")}
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            autoFocus
            fullWidth
          />
          {controlsShown && (
            <PermissionsSelector
              readOptions={readOptions}
              editOptions={editOptions}
              readPermissions={permissions.readPermissions}
              editPermissions={permissions.editPermissions}
              hideEditOptions
              onChange={({ readPermissions, editPermissions }) =>
                setChosenPermissions({
                  readPermissions:
                    readPermissions ?? permissions.readPermissions,
                  editPermissions:
                    editPermissions ?? permissions.editPermissions,
                })
              }
            />
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit" disabled={saving}>
          {t("common.cancel", "Cancel")}
        </Button>
        <Button
          type="submit"
          variant="contained"
          disabled={saving || !name.trim()}
        >
          {t("worlds.entries.create", "Create")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
