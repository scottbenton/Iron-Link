import { Alert, Skeleton } from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { RtcRichTextEditor } from "components/RichTextEditor";

import { useWorldEntriesStore } from "stores/worldEntries.store";

import type { ResolvedWorldFieldDefinition } from "lib/worldFieldRules";

import type { IWorldEntry } from "services/worldEntries.service";

import { WorldEntryLabelledField } from "./WorldEntryLabelledField";
import { WorldEntryLongTextToolbar } from "./WorldEntryLongTextToolbar";

// A collaborative document, edited and saved like a note. Its content is not
// kept with the other values, so it loads when the field appears.
export function WorldEntryLongTextField({
  entry,
  field,
  canEdit,
  onError,
}: {
  entry: IWorldEntry;
  field: ResolvedWorldFieldDefinition;
  canEdit: boolean;
  onError: (cause: unknown) => void;
}) {
  const { t } = useTranslation();
  const getFieldContent = useWorldEntriesStore(
    (store) => store.getFieldContent,
  );
  const setFieldContent = useWorldEntriesStore(
    (store) => store.setFieldContent,
  );
  const [content, setContent] = useState<Uint8Array>();
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let active = true;
    setContent(undefined);
    setLoadError(false);
    getFieldContent(entry.id, field.id)
      .then((loaded) => {
        if (active) setContent(loaded.content);
      })
      .catch(() => {
        if (active) setLoadError(true);
      });
    return () => {
      active = false;
    };
  }, [entry.id, field.id, getFieldContent]);

  const save = useCallback(
    (_documentId: string, document: Uint8Array) =>
      setFieldContent(entry.id, entry.worldId, field.id, document).catch(
        onError,
      ),
    [entry.id, entry.worldId, field.id, setFieldContent, onError],
  );

  return (
    <WorldEntryLabelledField label={field.label} helpText={field.helpText}>
      {loadError ? (
        <Alert severity="error">
          {t(
            "worlds.entries.long-text-load-error",
            "Could not load this field. Please reopen the entry to try again.",
          )}
        </Alert>
      ) : content ? (
        <RtcRichTextEditor
          id={`${entry.id}-${field.id}`}
          roomPrefix={`world-fields-${entry.worldId}`}
          documentPassword={entry.worldId}
          initialValue={content}
          onSave={canEdit ? save : undefined}
          Toolbar={WorldEntryLongTextToolbar}
          outlined
          minHeight={120}
        />
      ) : (
        <Skeleton
          variant="rounded"
          height={canEdit ? 120 : 48}
          aria-label={t("worlds.entries.field-loading", "Loading field…")}
        />
      )}
    </WorldEntryLabelledField>
  );
}
