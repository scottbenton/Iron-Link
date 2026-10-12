import { TextField, Typography } from "@mui/material";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  type ResolvedWorldFieldDefinition,
  WORLD_FIELD_VALUE_MAX_LENGTH,
} from "lib/worldFieldRules";

import { WorldEntryLabelledField } from "./WorldEntryLabelledField";

const SAVE_DELAY_MS = 1000;

// One line that saves after a pause in typing, and when it loses focus.
// While it has focus, changes from other people wait until it is left, so
// they never replace what is being typed.
export function WorldEntryTextField({
  field,
  value,
  canEdit,
  onSave,
}: {
  field: ResolvedWorldFieldDefinition;
  value: string;
  canEdit: boolean;
  onSave: (value: string) => void;
}) {
  const [draft, setDraft] = useState(value);
  const [focused, setFocused] = useState(false);
  const [seenValue, setSeenValue] = useState(value);
  const edited = useRef(false);
  const pending = useRef<{
    value: string;
    timeout: ReturnType<typeof setTimeout>;
  }>(undefined);
  const onSaveRef = useRef(onSave);
  useEffect(() => {
    onSaveRef.current = onSave;
  });

  if (value !== seenValue) {
    setSeenValue(value);
    if (!focused) setDraft(value);
  }

  const flush = useCallback(() => {
    if (!pending.current) return;
    clearTimeout(pending.current.timeout);
    onSaveRef.current(pending.current.value);
    pending.current = undefined;
  }, []);
  // Leaving the entry saves what was typed rather than dropping it.
  useEffect(() => flush, [flush]);

  if (!canEdit) {
    return (
      <WorldEntryLabelledField label={field.label}>
        <Typography sx={{ overflowWrap: "anywhere" }}>{value}</Typography>
      </WorldEntryLabelledField>
    );
  }

  return (
    <TextField
      label={field.label}
      helperText={field.helpText || undefined}
      value={draft}
      fullWidth
      onFocus={() => setFocused(true)}
      onBlur={() => {
        flush();
        setFocused(false);
        // Without edits of its own, the field catches up with any change
        // made elsewhere while it had focus.
        if (!edited.current) setDraft(value);
        edited.current = false;
      }}
      onChange={(event) => {
        const next = event.target.value;
        setDraft(next);
        edited.current = true;
        if (pending.current) clearTimeout(pending.current.timeout);
        pending.current = {
          value: next,
          timeout: setTimeout(flush, SAVE_DELAY_MS),
        };
      }}
      slotProps={{ htmlInput: { maxLength: WORLD_FIELD_VALUE_MAX_LENGTH } }}
    />
  );
}
