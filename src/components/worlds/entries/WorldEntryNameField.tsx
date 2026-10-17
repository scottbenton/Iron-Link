import CasinoIcon from "@mui/icons-material/Casino";
import {
  Box,
  IconButton,
  InputAdornment,
  InputBase,
  Tooltip,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

import { useDebouncedSync } from "hooks/useDebouncedSync";

import { useWorldEntriesStore } from "stores/worldEntries.store";

import {
  getWorldEntryNameGenerator,
  rollWorldEntryName,
} from "lib/worldEntryNames";

import { IWorldEntry } from "services/worldEntries.service";

import { useResolvedWorldEntryFields } from "./useResolvedWorldEntryFields";
import { useWorldOracleRoller } from "./useWorldOracleRoller";

// The entry's heading. Editors rename it in place; the name saves after a
// pause, like the world name, and a blank name is never saved. Where the
// world's rules have names for this kind of entry, dice roll one.
export function WorldEntryNameField({
  entry,
  canEdit,
}: {
  entry: IWorldEntry;
  canEdit: boolean;
}) {
  const { id: entryId, name } = entry;
  const { t } = useTranslation();
  const { lookup } = useWorldOracleRoller(entry.worldId);
  const { fields, values } = useResolvedWorldEntryFields(entry);
  const nameGenerator = canEdit
    ? getWorldEntryNameGenerator(
        new Set(fields.map((field) => field.key)),
        (key) => {
          const field = fields.find((candidate) => candidate.key === key);
          const value = field && values[field.id]?.value;
          return typeof value === "string" ? value : undefined;
        },
        lookup,
      )
    : undefined;
  const rollLabel = t("worlds.entries.roll-name", "Roll a name");
  const updateEntry = useWorldEntriesStore((store) => store.updateEntry);
  const focusRequested = useWorldEntriesStore(
    (store) => store.focusNameEntryId === entryId,
  );
  const requestNameFocus = useWorldEntriesStore(
    (store) => store.requestNameFocus,
  );
  const inputRef = useRef<HTMLInputElement>(null);
  // A just-created entry opens with its placeholder name selected.
  useEffect(() => {
    if (!focusRequested || !canEdit || !inputRef.current) return;
    inputRef.current.focus();
    inputRef.current.select();
    requestNameFocus(null);
  }, [focusRequested, canEdit, requestNameFocus]);

  const persistName = useCallback(
    (newName: string) => {
      const trimmedName = newName.trim();
      if (!trimmedName || trimmedName === name) return;
      updateEntry(entryId, { name: trimmedName }).catch(() => {});
    },
    [entryId, name, updateEntry],
  );
  const [value, setValue] = useDebouncedSync(persistName, name);
  const blank = canEdit && !value.trim();

  return (
    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
      <Typography
        variant="h4"
        component="h1"
        fontFamily={(theme) => theme.typography.fontFamilyTitle}
        sx={{ overflowWrap: "anywhere" }}
      >
        {canEdit ? (
          <InputBase
            value={value}
            onChange={(event) => setValue(event.currentTarget.value)}
            error={blank}
            fullWidth
            inputRef={inputRef}
            endAdornment={
              nameGenerator && (
                <InputAdornment position="end">
                  <Tooltip title={rollLabel}>
                    <IconButton
                      aria-label={rollLabel}
                      onClick={() => {
                        const rolled = rollWorldEntryName(
                          nameGenerator,
                          lookup,
                        );
                        if (rolled) setValue(rolled);
                      }}
                    >
                      <CasinoIcon />
                    </IconButton>
                  </Tooltip>
                </InputAdornment>
              )
            }
            slotProps={{
              input: { "aria-label": t("worlds.entries.name", "Name") },
            }}
            sx={{ font: "inherit", color: "inherit", p: 0 }}
          />
        ) : (
          name
        )}
      </Typography>
      {blank && (
        <Typography variant="body2" color="error" role="alert">
          {t("worlds.entries.name-required", "An entry needs a name.")}
        </Typography>
      )}
    </Box>
  );
}
