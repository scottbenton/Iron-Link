import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { useWorldMapsStore } from "stores/worldMaps.store";

// Confirms clearing every painted cell. Pins and the background stay.
export function WorldMapClearDialog({
  entryId,
  open,
  onClose,
  onError,
}: {
  entryId: string;
  open: boolean;
  onClose: () => void;
  onError: (cause: unknown) => void;
}) {
  const { t } = useTranslation();
  const clearMap = useWorldMapsStore((store) => store.clearMap);
  const [busy, setBusy] = useState(false);

  return (
    <Dialog
      open={open}
      onClose={() => !busy && onClose()}
      aria-labelledby="world-map-clear-title"
    >
      <DialogTitle id="world-map-clear-title">
        {t("worlds.maps.clear.title", "Clear this map?")}
      </DialogTitle>
      <DialogContent>
        <DialogContentText>
          {t(
            "worlds.maps.clear.message",
            "Every painted cell and path is removed. Pins and the background image stay where they are. This cannot be undone.",
          )}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button disabled={busy} onClick={onClose}>
          {t("common.cancel", "Cancel")}
        </Button>
        <Button
          color="error"
          variant="contained"
          disabled={busy}
          onClick={() => {
            setBusy(true);
            clearMap(entryId)
              .then(onClose)
              .catch(onError)
              .finally(() => setBusy(false));
          }}
        >
          {busy
            ? t("worlds.maps.clear.clearing", "Clearing map")
            : t("worlds.maps.clear.confirm", "Clear map")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
