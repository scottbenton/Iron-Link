import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "ui/components/Button";
import {
  Dialog,
  DialogActions,
  DialogBody,
  DialogHeader,
} from "ui/components/Dialog";
import { TextField } from "ui/components/TextField";

export interface NameItemDialogProps {
  open: boolean;
  onClose: () => void;
  /** Gets the trimmed name; a blank one can't be saved. */
  onSave: (name: string) => void;
  name: string;
  itemLabel: string;
}

/** Names a new folder or note, or renames one. Each opening starts afresh. */
export function NameItemDialog(props: NameItemDialogProps) {
  const { open, onClose, onSave, name, itemLabel } = props;
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);

  const [draft, setDraft] = useState(name);
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setDraft(name);
  }
  const trimmed = draft.trim();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      initialFocus={inputRef}
      onSubmit={() => {
        if (!trimmed) return;
        onSave(trimmed);
        onClose();
      }}
    >
      <DialogHeader
        title={t("notes.name-item-dialog.title", "{{itemLabel}} Name", {
          itemLabel,
        })}
      />
      <DialogBody>
        <TextField
          ref={inputRef}
          label={t("notes.name-item-dialog.input-label", "Name")}
          value={draft}
          onValueChange={setDraft}
          required
        />
      </DialogBody>
      <DialogActions>
        <Button variant="ghost" onClick={onClose}>
          {t("common.cancel", "Cancel")}
        </Button>
        <Button variant="primary" type="submit" disabled={!trimmed}>
          {t("common.save", "Save")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
