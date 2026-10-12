import { Alert, Box, Button, LinearProgress, Stack } from "@mui/material";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { EmptyState } from "components/Layout/EmptyState";
import { LinkComponent } from "components/LinkComponent";

import { useWorldPermissionControlsShown } from "stores/world.store";
import { useWorldEntriesStore } from "stores/worldEntries.store";

import { IWorldCategory } from "services/worldCategories.service";

import { getEditorErrorMessage } from "../categories/categoryEditor.utils";
import type { WorldNavigation } from "../worldNavigation";
import { WorldEntryActionsMenu } from "./WorldEntryActionsMenu";
import { WorldEntryFields } from "./WorldEntryFields";
import { WorldEntryIcon } from "./WorldEntryIcon";
import { WorldEntryNameField } from "./WorldEntryNameField";

const READ_ONLY = {
  canEdit: false,
  canDelete: false,
  canChangePermissions: false,
};

// One entry's detail view. The surrounding manager listens to the world's
// entries, so moving here from the list needs no loading.
export function WorldEntryView({
  category,
  entryId,
  navigation,
}: {
  category: IWorldCategory;
  entryId: string;
  navigation: WorldNavigation;
}) {
  const { t } = useTranslation();
  const loading = useWorldEntriesStore((store) => store.entryState.loading);
  const loadError = useWorldEntriesStore((store) => !!store.entryState.error);
  const entry = useWorldEntriesStore((store) => {
    const found = store.entryState.entries[entryId];
    return found?.categoryId === category.id ? found : undefined;
  });
  const permissions = useWorldEntriesStore(
    (store) => store.entryState.permissions[entryId] ?? READ_ONLY,
  );
  const controlsShown = useWorldPermissionControlsShown();
  const [error, setError] = useState<string>();

  if (loadError)
    return (
      <Alert severity="error">
        {t(
          "worlds.entries.load-error",
          "Could not load this entry. Please reopen it to try again.",
        )}
      </Alert>
    );
  if (loading)
    return (
      <LinearProgress
        aria-label={t("worlds.entries.loading", "Loading entry…")}
      />
    );
  if (!entry)
    return (
      <EmptyState
        title={t("worlds.entries.missing", "Entry unavailable")}
        message={t(
          "worlds.entries.not-found",
          "This entry was deleted, or you do not have access to it.",
        )}
        action={
          <Button
            LinkComponent={LinkComponent}
            {...navigation.getLinkProps({
              type: "category",
              categoryId: category.id,
            })}
          >
            {t("worlds.entries.back", "Back to {{category}}", {
              category: category.name,
            })}
          </Button>
        }
        sx={{ py: 4 }}
      />
    );

  return (
    <Stack component="article" spacing={2}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
        <WorldEntryIcon entry={entry} size="large" />
        <WorldEntryNameField
          key={entry.id}
          entryId={entry.id}
          name={entry.name}
          canEdit={permissions.canEdit}
        />
        <WorldEntryActionsMenu
          entry={entry}
          canShare={permissions.canChangePermissions && controlsShown}
          canDelete={permissions.canDelete}
          onDeleted={() =>
            navigation.navigate({ type: "category", categoryId: category.id })
          }
          onError={(cause) => setError(getEditorErrorMessage(cause))}
        />
      </Box>
      {error && (
        <Alert severity="error" onClose={() => setError(undefined)}>
          {error}
        </Alert>
      )}
      <WorldEntryFields
        entry={entry}
        category={category}
        canEdit={permissions.canEdit}
        permissionControlsShown={controlsShown}
      />
    </Stack>
  );
}
