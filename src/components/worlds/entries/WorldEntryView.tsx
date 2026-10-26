import {
  Alert,
  Box,
  Button,
  LinearProgress,
  Stack,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import { ReactNode, useCallback, useState } from "react";
import { useTranslation } from "react-i18next";

import { EmptyState } from "components/Layout/EmptyState";
import { LinkComponent } from "components/LinkComponent";

import { useWorldFieldEntrySnapshots } from "hooks/useWorldFieldEntrySnapshots";

import { useWorldIsGuided } from "stores/world.store";
import { useWorldCategoriesStore } from "stores/worldCategories.store";
import { useWorldEntriesStore } from "stores/worldEntries.store";

import { countWorldEntryChildren } from "lib/worldEntryParents";
import { getWorldEntrySubtitle } from "lib/worldEntrySubtitle";

import { IWorldCategory } from "services/worldCategories.service";

import { getEditorErrorMessage } from "../categories/categoryEditor.utils";
import { WorldEntryMap } from "../maps/WorldEntryMap";
import type { WorldNavigation } from "../worldNavigation";
import { WorldEntryFields } from "./WorldEntryFields";
import { WorldEntryHeaderIcon } from "./WorldEntryHeaderIcon";
import { WorldEntryNameField } from "./WorldEntryNameField";
import { WorldEntryNotes } from "./WorldEntryNotes";
import { WorldEntryPlaces } from "./WorldEntryPlaces";

const READ_ONLY = {
  canEdit: false,
  canDelete: false,
  canChangePermissions: false,
};

// One entry's page: its portrait or icon, name and subtitle, then its
// fields and Notes. In a category with nesting or maps, Details, Map and
// Places are tabs under the header; Places lists the entries inside this one
// and Map holds the entry's map. Its actions sit
// in the strip above, which the manager renders, or beside the name when the
// manager passes them in. The manager also listens to the world's entries, so
// moving here
// from the list needs no loading.
export function WorldEntryView({
  category,
  entryId,
  navigation,
  headerActions,
}: {
  category: IWorldCategory;
  entryId: string;
  navigation: WorldNavigation;
  headerActions?: ReactNode;
}) {
  const { t } = useTranslation();
  // An entry this window just created counts as loading until the listener
  // delivers it, so its page never flashes as unavailable.
  const loading = useWorldEntriesStore(
    (store) =>
      store.entryState.loading || !!store.entryState.arriving?.[entryId],
  );
  const loadError = useWorldEntriesStore((store) => !!store.entryState.error);
  const entry = useWorldEntriesStore((store) => {
    const found = store.entryState.entries[entryId];
    return found?.categoryId === category.id ? found : undefined;
  });
  const permissions = useWorldEntriesStore(
    (store) => store.entryState.permissions[entryId] ?? READ_ONLY,
  );
  const guided = useWorldIsGuided();
  const [notesError, setNotesError] = useState<string>();
  const onNotesError = useCallback(
    (cause: unknown) => setNotesError(getEditorErrorMessage(cause)),
    [],
  );
  const subtitleField = useWorldCategoriesStore((store) =>
    category.subtitleFieldDefinitionId
      ? store.fieldDefinitions[category.subtitleFieldDefinitionId]
      : undefined,
  );
  const entries = useWorldEntriesStore((store) => store.entryState.entries);
  const snapshots = useWorldFieldEntrySnapshots();
  const placeCount = useWorldEntriesStore(
    (store) => countWorldEntryChildren(store.entryState.entries)[entryId] ?? 0,
  );

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

  const hasPlaces = category.supportsHierarchy;
  const hasMap = category.supportsMap;
  const requested =
    navigation.view.type === "entry" ? navigation.view.section : undefined;
  const section =
    requested === "places" && hasPlaces
      ? "places"
      : requested === "map" && hasMap
        ? "map"
        : "details";
  const detailsView = {
    type: "entry" as const,
    categoryId: category.id,
    entryId: entry.id,
  };
  const subtitle = getWorldEntrySubtitle(
    subtitleField,
    entry.id,
    snapshots,
    entries,
  );
  return (
    <Stack component="article" spacing={2.5} sx={{ flexGrow: 1 }}>
      <Box
        sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 2 }}
      >
        <WorldEntryHeaderIcon
          entry={entry}
          canEdit={permissions.canEdit}
          onError={onNotesError}
        />
        <Box sx={{ flex: "1 1 240px", minWidth: 0 }}>
          <WorldEntryNameField
            key={entry.id}
            entry={entry}
            canEdit={permissions.canEdit}
          />
          {subtitle && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ overflowWrap: "anywhere" }}
            >
              {subtitle}
            </Typography>
          )}
        </Box>
        {headerActions && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            {headerActions}
          </Box>
        )}
      </Box>
      {(hasPlaces || hasMap) && (
        <Tabs
          value={section}
          aria-label={t("worlds.entries.views", "{{name}} views", {
            name: entry.name,
          })}
          sx={{ borderBottom: 1, borderColor: "divider", minHeight: 40 }}
        >
          <Tab
            value="details"
            label={t("worlds.entries.details", "Details")}
            component={LinkComponent}
            {...navigation.getLinkProps(detailsView)}
            sx={{ minHeight: 40 }}
          />
          {hasMap && (
            <Tab
              value="map"
              label={t("worlds.entries.map", "Map")}
              component={LinkComponent}
              {...navigation.getLinkProps({ ...detailsView, section: "map" })}
              sx={{ minHeight: 40 }}
            />
          )}
          {hasPlaces && (
            <Tab
              value="places"
              label={
                <Box component="span" sx={{ display: "flex", gap: 0.75 }}>
                  {t("worlds.entries.places", "Places")}
                  <Box component="span" sx={{ color: "text.secondary" }}>
                    {placeCount}
                  </Box>
                </Box>
              }
              component={LinkComponent}
              {...navigation.getLinkProps({
                ...detailsView,
                section: "places",
              })}
              sx={{ minHeight: 40 }}
            />
          )}
        </Tabs>
      )}
      {section === "map" ? (
        <WorldEntryMap
          key={entry.id}
          entry={entry}
          canEdit={permissions.canEdit}
          navigation={navigation}
        />
      ) : section === "places" ? (
        <WorldEntryPlaces
          entry={entry}
          category={category}
          navigation={navigation}
        />
      ) : (
        <>
          <WorldEntryFields
            entry={entry}
            category={category}
            canEdit={permissions.canEdit}
            guided={guided}
            navigation={navigation}
          />
          {notesError && (
            <Alert severity="error" onClose={() => setNotesError(undefined)}>
              {notesError}
            </Alert>
          )}
          <WorldEntryNotes
            key={entry.id}
            entry={entry}
            canEdit={permissions.canEdit}
            onError={onNotesError}
          />
        </>
      )}
    </Stack>
  );
}
