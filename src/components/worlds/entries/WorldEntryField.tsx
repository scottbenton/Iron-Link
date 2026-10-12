import { Alert, Stack } from "@mui/material";
import { useCallback, useState } from "react";

import { useWorldEntriesStore } from "stores/worldEntries.store";

import {
  type ResolvedWorldFieldDefinition,
  getWorldFieldKind,
} from "lib/worldFieldRules";

import type { IWorldEntry } from "services/worldEntries.service";
import type {
  IWorldEntryFieldValue,
  WorldFieldValue,
} from "services/worldEntryFieldValues.service";

import { getEditorErrorMessage } from "../categories/categoryEditor.utils";
import type { WorldNavigation } from "../worldNavigation";
import { WorldEntryLinkedEntryField } from "./WorldEntryLinkedEntryField";
import { WorldEntryLongTextField } from "./WorldEntryLongTextField";
import { WorldEntryOptionListField } from "./WorldEntryOptionListField";
import { WorldEntryTextField } from "./WorldEntryTextField";

// One field of an entry, with the input its kind needs. An emptied field
// deletes its value rather than storing a blank one.
export function WorldEntryField({
  entry,
  field,
  value,
  canEdit,
  navigation,
}: {
  entry: IWorldEntry;
  field: ResolvedWorldFieldDefinition;
  value: IWorldEntryFieldValue | undefined;
  canEdit: boolean;
  navigation: WorldNavigation;
}) {
  const setFieldValue = useWorldEntriesStore((store) => store.setFieldValue);
  const deleteFieldValue = useWorldEntriesStore(
    (store) => store.deleteFieldValue,
  );
  const [error, setError] = useState<string>();

  const showError = useCallback(
    (cause: unknown) => setError(getEditorErrorMessage(cause)),
    [],
  );
  const save = useCallback(
    (next: WorldFieldValue | null) => {
      const empty = Array.isArray(next) ? next.length === 0 : !next;
      setError(undefined);
      (empty
        ? deleteFieldValue(entry.id, field.id)
        : setFieldValue(entry.id, entry.worldId, field.id, next)
      ).catch(showError);
    },
    [
      entry.id,
      entry.worldId,
      field.id,
      setFieldValue,
      deleteFieldValue,
      showError,
    ],
  );

  let input;
  switch (getWorldFieldKind(field)) {
    case "text":
      input = (
        <WorldEntryTextField
          field={field}
          value={typeof value?.value === "string" ? value.value : ""}
          canEdit={canEdit}
          onSave={(next) => save(next || null)}
        />
      );
      break;
    case "longText":
      input = (
        <WorldEntryLongTextField
          entry={entry}
          field={field}
          canEdit={canEdit}
          onError={showError}
        />
      );
      break;
    case "optionList":
      input = (
        <WorldEntryOptionListField
          field={field}
          value={value?.value}
          canEdit={canEdit}
          onSave={save}
        />
      );
      break;
    case "linkedEntry":
      input = (
        <WorldEntryLinkedEntryField
          entry={entry}
          field={field}
          value={value?.value}
          canEdit={canEdit}
          navigation={navigation}
          onSave={save}
          onError={showError}
        />
      );
      break;
  }

  return (
    <Stack spacing={1}>
      {input}
      {error && (
        <Alert severity="error" onClose={() => setError(undefined)}>
          {error}
        </Alert>
      )}
    </Stack>
  );
}
