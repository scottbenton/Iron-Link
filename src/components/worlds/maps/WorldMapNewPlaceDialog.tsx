import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from "@mui/material";
import { FormEvent, useState } from "react";
import { useTranslation } from "react-i18next";

// Names a new place before it is made and pinned where the map was tapped.
export function WorldMapNewPlaceDialog({
  locationType,
  onCreate,
  onClose,
}: {
  locationType: string | null;
  onCreate: (name: string) => Promise<void>;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const trimmed = name.trim();

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!trimmed || busy) return;
    setBusy(true);
    onCreate(trimmed)
      .then(onClose)
      .catch(() => setBusy(false));
  };

  return (
    <Dialog
      open
      fullWidth
      maxWidth="xs"
      onClose={() => !busy && onClose()}
      aria-labelledby="world-map-new-place-title"
    >
      <form onSubmit={submit}>
        <DialogTitle id="world-map-new-place-title">
          {locationType
            ? t("worlds.maps.pins.new-of-type", "New {{type}}", {
                type: locationType,
              })
            : t("worlds.maps.pins.new", "New place")}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            margin="dense"
            label={t("worlds.maps.pins.name", "Name")}
            value={name}
            disabled={busy}
            onChange={(event) => setName(event.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button disabled={busy} onClick={onClose}>
            {t("common.cancel", "Cancel")}
          </Button>
          <Button type="submit" variant="contained" disabled={busy || !trimmed}>
            {busy
              ? t("worlds.maps.pins.adding", "Adding place")
              : t("worlds.maps.pins.add", "Add place")}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
