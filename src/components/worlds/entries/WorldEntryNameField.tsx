import { Box, InputBase, Typography } from "@mui/material";
import { useCallback, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

import { useDebouncedSync } from "hooks/useDebouncedSync";

import { useWorldEntriesStore } from "stores/worldEntries.store";

// The entry's heading. Editors rename it in place; the name saves after a
// pause, like the world name, and a blank name is never saved.
export function WorldEntryNameField({
  entryId,
  name,
  canEdit,
}: {
  entryId: string;
  name: string;
  canEdit: boolean;
}) {
  const { t } = useTranslation();
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
