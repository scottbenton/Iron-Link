import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  Stack,
} from "@mui/material";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { DialogTitleWithCloseButton } from "components/DialogTitleWithCloseButton";
import { PermissionsSelector } from "components/permissions/PermissionsSelector";

import { useUID } from "stores/auth.store";
import { useWorldPermission } from "stores/world.store";
import { useWorldEntriesStore } from "stores/worldEntries.store";

import { isGuideEquivalent } from "repositories/shared.types";

import { IWorldEntry } from "services/worldEntries.service";

import { getEditorErrorMessage } from "../categories/categoryEditor.utils";
import { getWorldEntryPermissionOptions } from "./worldEntryPermissions";

// Mounted only while open, so each opening starts from the entry's current
// permissions.
export function WorldEntryShareDialog({
  entry,
  onClose,
}: {
  entry: IWorldEntry;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const uid = useUID();
  const permission = useWorldPermission();
  const updateEntry = useWorldEntriesStore((store) => store.updateEntry);
  const [permissions, setPermissions] = useState({
    readPermissions: entry.readPermissions,
    editPermissions: entry.editPermissions,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();

  const { readOptions, editOptions } = getWorldEntryPermissionOptions(t, {
    isAuthor: !!uid && uid === entry.authorId,
    isGuide: !!permission && isGuideEquivalent(permission),
  });

  const save = async () => {
    setSaving(true);
    setError(undefined);
    try {
      await updateEntry(entry.id, permissions);
      onClose();
    } catch (cause) {
      setError(getEditorErrorMessage(cause));
      setSaving(false);
    }
  };

  return (
    <Dialog open onClose={saving ? undefined : onClose}>
      <DialogTitleWithCloseButton onClose={() => !saving && onClose()}>
        {t("worlds.entries.share-named", "Share {{name}}", {
          name: entry.name,
        })}
      </DialogTitleWithCloseButton>
      <DialogContent>
        <Stack spacing={2}>
          {error && <Alert severity="error">{error}</Alert>}
          <PermissionsSelector
            readOptions={readOptions}
            editOptions={editOptions}
            readPermissions={permissions.readPermissions}
            editPermissions={permissions.editPermissions}
            onChange={({ readPermissions, editPermissions }) =>
              setPermissions((current) => ({
                readPermissions: readPermissions ?? current.readPermissions,
                editPermissions: editPermissions ?? current.editPermissions,
              }))
            }
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit" disabled={saving}>
          {t("common.cancel", "Cancel")}
        </Button>
        <Button onClick={save} variant="contained" disabled={saving}>
          {t("common.save-changes", "Save Changes")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
