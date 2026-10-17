import { InputBase, Typography } from "@mui/material";
import { useCallback, useEffect, useId, useRef, useState } from "react";

import {
  type ResolvedWorldFieldDefinition,
  WORLD_FIELD_VALUE_MAX_LENGTH,
} from "lib/worldFieldRules";

import {
  WorldEntryFieldShell,
  getWorldEntryFieldHelpId,
  useEmptyFieldText,
  worldEntryValueInputSx,
} from "./WorldEntryFieldShell";

const SAVE_DELAY_MS = 1000;

// Text that wraps like the value it holds and saves after a pause in typing,
// and when it loses focus. Enter leaves the field rather than adding a line.
// While it has focus, changes from other people wait until it is left, so
// they never replace what is being typed. Saved text is trimmed.
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
  const inputId = useId();
  const emptyText = useEmptyFieldText();
  const [draft, setDraft] = useState(value);
  const [focused, setFocused] = useState(false);
  const [seenValue, setSeenValue] = useState(value);
  // The last text sent while no change to the stored value has arrived since.
  // Until one does, the stored value is older than what was saved.
  const [unconfirmed, setUnconfirmed] = useState<string>();
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
    setUnconfirmed(undefined);
    if (!focused) setDraft(value);
  }
  // Losing edit rights removes the input without a blur.
  if (!canEdit && focused) {
    setFocused(false);
    setDraft(value);
  }

  const flush = useCallback(() => {
    if (!pending.current) return;
    clearTimeout(pending.current.timeout);
    const saved = pending.current.value.trim();
    pending.current = undefined;
    setUnconfirmed(saved);
    onSaveRef.current(saved);
  }, []);
  // Leaving the entry saves what was typed rather than dropping it.
  useEffect(() => flush, [flush]);

  if (!canEdit) {
    return (
      <WorldEntryFieldShell label={field.label}>
        <Typography sx={{ fontSize: 15, overflowWrap: "anywhere" }}>
          {value}
        </Typography>
      </WorldEntryFieldShell>
    );
  }

  return (
    <WorldEntryFieldShell
      label={field.label}
      helpText={field.helpText || undefined}
      inputId={inputId}
    >
      <InputBase
        id={inputId}
        value={draft}
        placeholder={emptyText}
        multiline
        fullWidth
        onFocus={() => setFocused(true)}
        onBlur={() => {
          const saving = pending.current?.value.trim();
          flush();
          setFocused(false);
          // Leaving shows what was saved: the text just sent, a save whose
          // change has not arrived yet, or otherwise the stored value, which
          // takes in changes made elsewhere while the field had focus.
          setDraft(saving ?? unconfirmed ?? value);
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.nativeEvent.isComposing) {
            event.preventDefault();
            (event.target as HTMLElement).blur();
          }
        }}
        onChange={(event) => {
          // Pasted line breaks become spaces: the value is one line.
          const next = event.target.value.replace(/\r?\n/g, " ");
          setDraft(next);
          if (pending.current) clearTimeout(pending.current.timeout);
          pending.current = {
            value: next,
            timeout: setTimeout(flush, SAVE_DELAY_MS),
          };
        }}
        inputProps={{
          maxLength: WORLD_FIELD_VALUE_MAX_LENGTH,
          "aria-describedby": field.helpText
            ? getWorldEntryFieldHelpId(inputId)
            : undefined,
        }}
        sx={worldEntryValueInputSx}
      />
    </WorldEntryFieldShell>
  );
}
