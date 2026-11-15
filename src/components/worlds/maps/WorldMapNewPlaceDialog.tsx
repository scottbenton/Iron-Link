import CasinoIcon from "@mui/icons-material/Casino";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  TextField,
  Tooltip,
} from "@mui/material";
import { FormEvent, useState } from "react";
import { useTranslation } from "react-i18next";

import { useWorldCategoriesStore } from "stores/worldCategories.store";

import {
  getWorldEntryNameGenerator,
  rollWorldEntryName,
} from "lib/worldEntryNames";

import { useWorldOracleRoller } from "../entries/useWorldOracleRoller";

// Names a new place before it is made and pinned where the map was tapped.
// Where the world's rules have names for the chosen Location Type, dice roll
// one, as on the entry's own page.
export function WorldMapNewPlaceDialog({
  worldId,
  categoryId,
  locationType,
  onCreate,
  onClose,
}: {
  worldId: string;
  categoryId: string;
  locationType: string | null;
  onCreate: (name: string) => Promise<void>;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const trimmed = name.trim();
  const { lookup } = useWorldOracleRoller(worldId);
  const fieldKeys = useWorldCategoriesStore((store) =>
    Object.values(store.fieldDefinitions)
      .filter((field) => field.categoryId === categoryId)
      .map((field) => field.key)
      .join(" "),
  );
  const nameGenerator = getWorldEntryNameGenerator(
    new Set(fieldKeys.split(" ")),
    (key) => (key === "locationType" ? (locationType ?? undefined) : undefined),
    lookup,
  );
  const rollLabel = t("worlds.entries.roll-name", "Roll a name");

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
            slotProps={{
              input: {
                endAdornment: nameGenerator && (
                  <InputAdornment position="end">
                    <Tooltip title={rollLabel}>
                      <IconButton
                        aria-label={rollLabel}
                        disabled={busy}
                        onClick={() => {
                          const rolled = rollWorldEntryName(
                            nameGenerator,
                            lookup,
                          );
                          if (rolled) setName(rolled);
                        }}
                      >
                        <CasinoIcon />
                      </IconButton>
                    </Tooltip>
                  </InputAdornment>
                ),
              },
            }}
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
