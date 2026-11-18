import {
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

import { getDialogFormSlotProps } from "lib/dialogForm.lib";

// Writes a truth of the Guides' own: a description everyone reads and a
// quest starter only Guides read. Mount it to open it.
export function WorldCustomTruthDialog({
  truthName,
  initialDescription,
  initialQuestStarter,
  onClose,
  onSave,
}: {
  truthName: string;
  initialDescription: string;
  initialQuestStarter: string;
  onClose: () => void;
  // Resolves once saved; rejects (having said why) to keep the dialog open.
  onSave: (description: string, questStarter: string) => Promise<void>;
}) {
  const { t } = useTranslation();
  const [description, setDescription] = useState(initialDescription);
  const [questStarter, setQuestStarter] = useState(initialQuestStarter);
  const [saving, setSaving] = useState(false);
  const ready = description.trim().length > 0 && !saving;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!ready) return;
    setSaving(true);
    try {
      await onSave(description.trim(), questStarter.trim());
      onClose();
    } catch {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      slotProps={getDialogFormSlotProps(handleSubmit)}
    >
      <DialogTitleWithCloseButton onClose={onClose}>
        {t("worlds.truths.write-named", "Write your own truth: {{name}}", {
          name: truthName,
        })}
      </DialogTitleWithCloseButton>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <TextField
            label={t("worlds.truths.description", "Description")}
            helperText={t(
              "worlds.truths.description-helper",
              "Everyone in the world reads this.",
            )}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            multiline
            minRows={4}
            required
            autoFocus
            fullWidth
          />
          <TextField
            label={t("worlds.truths.quest-starter", "Quest starter")}
            helperText={t(
              "worlds.truths.quest-starter-helper",
              "Guide only. Players never see this.",
            )}
            value={questStarter}
            onChange={(event) => setQuestStarter(event.target.value)}
            multiline
            minRows={3}
            fullWidth
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button color="inherit" onClick={onClose}>
          {t("common.cancel", "Cancel")}
        </Button>
        <Button type="submit" variant="contained" disabled={!ready}>
          {saving ? t("common.saving", "Saving") : t("common.save", "Save")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
