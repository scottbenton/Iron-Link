import { Alert, Skeleton } from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { RtcRichTextEditor } from "components/RichTextEditor";

import { useWorldEntriesStore } from "stores/worldEntries.store";

import type { ResolvedWorldFieldDefinition } from "lib/worldFieldRules";

import type { RichTextContentStore } from "services/richTextContent.service";
import type { IWorldEntry } from "services/worldEntries.service";

import { WorldEntryFieldShell } from "./WorldEntryFieldShell";
import { WorldEntryLongTextToolbar } from "./WorldEntryLongTextToolbar";

const UNVERSIONED = "unversioned";

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

  // Long text values have no version to guard a save with, so the last save
  // wins, as before; Long text is being retired rather than given merges.
  const contentStore = useMemo<RichTextContentStore>(
    () => ({
      read: async () => ({ updatedAt: UNVERSIONED }),
      write: (document) =>
        setFieldContent(entry.id, entry.worldId, field.id, document).then(
          () => UNVERSIONED,
        ),
      writeBeacon: (document) => {
        setFieldContent(entry.id, entry.worldId, field.id, document).catch(
          onError,
        );
      },
    }),
    [entry.id, entry.worldId, field.id, setFieldContent, onError],
  );

  return (
    <WorldEntryFieldShell label={field.label} helpText={field.helpText}>
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
          roomKeySource={
            field.gmOnly
              ? { guideWorldId: entry.worldId }
              : { worldEntryId: entry.id }
          }
          initialValue={content}
          contentStore={canEdit ? contentStore : undefined}
          onSaveError={onError}
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
    </WorldEntryFieldShell>
  );
}
