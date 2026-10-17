import AddIcon from "@mui/icons-material/Add";
import CreateNewFolderIcon from "@mui/icons-material/CreateNewFolder";
import SettingsIcon from "@mui/icons-material/Settings";
import {
  Alert,
  Box,
  Button,
  IconButton,
  LinearProgress,
  Stack,
  Tooltip,
} from "@mui/material";
import { useConfirm } from "material-ui-confirm";
import { type ReactNode, useState } from "react";
import { useTranslation } from "react-i18next";

import type { BreadcrumbItem } from "components/Layout/BreadcrumbTrail";
import { LinkComponent } from "components/LinkComponent";

import { useWorldOracles } from "hooks/useWorldOracles";

import { useUID } from "stores/auth.store";
import { useWorldIsGuided } from "stores/world.store";
import { useWorldCategoriesStore } from "stores/worldCategories.store";
import { useWorldEntriesStore } from "stores/worldEntries.store";

import { WorldPermission, isGuideEquivalent } from "repositories/shared.types";

import { IWorldCategory } from "services/worldCategories.service";
import { IWorld } from "services/worlds.service";

import { WorldBreadcrumbs } from "../WorldBreadcrumbs";
import {
  WorldLayout,
  WorldViewActions,
  WorldViewLayout,
} from "../WorldViewLayout";
import { WorldEntryActions } from "../entries/WorldEntryActions";
import { WorldEntryView } from "../entries/WorldEntryView";
import { getDefaultWorldEntryPermissions } from "../entries/worldEntryPermissions";
import type { WorldNavigation } from "../worldNavigation";
import { WorldCategoryBrowser } from "./WorldCategoryBrowser";
import { WorldCategoryContents } from "./WorldCategoryContents";
import { CategoryDraft, WorldCategoryEditor } from "./WorldCategoryEditor";
import { WorldCategoryIcon } from "./WorldCategoryIcon";
import { WorldConfigurationView } from "./WorldConfigurationView";
import { WorldEntrySearch } from "./WorldEntrySearch";
import { getEditorErrorMessage } from "./categoryEditor.utils";

export function WorldCategoryManager({
  world,
  permission,
  navigation,
  layout,
  rootBreadcrumb,
  generalSettings,
}: {
  world: IWorld;
  permission: WorldPermission | null;
  navigation: WorldNavigation;
  layout: WorldLayout;
  rootBreadcrumb: BreadcrumbItem;
  generalSettings: ReactNode;
}) {
  const worldId = world.id;
  const { t } = useTranslation();
  const confirm = useConfirm();
  const oracles = useWorldOracles(worldId);
  const customized = useWorldCategoriesStore(
    (store) => store.configurationCustomized,
  );
  const defaultBindingsReady = useWorldCategoriesStore(
    (store) => store.defaultBindingsReady,
  );
  const reorderCategories = useWorldCategoriesStore(
    (store) => store.reorderCategories,
  );
  const categories = useWorldCategoriesStore((store) =>
    Object.values(store.categories)
      .filter((category) => category.worldId === worldId)
      .sort((a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id)),
  );
  const definitions = useWorldCategoriesStore(
    (store) => store.fieldDefinitions,
  );
  const loading = useWorldCategoriesStore((store) => store.loading);
  const loadError = useWorldCategoriesStore((store) => store.error);
  const createCategory = useWorldCategoriesStore(
    (store) => store.createCategory,
  );
  const deleteCategory = useWorldCategoriesStore(
    (store) => store.deleteCategory,
  );
  const uid = useUID();
  const createEntry = useWorldEntriesStore((store) => store.createEntry);
  const requestNameFocus = useWorldEntriesStore(
    (store) => store.requestNameFocus,
  );
  const getCategoryCounts = useWorldCategoriesStore(
    (store) => store.getCategoryCounts,
  );
  const [adding, setAdding] = useState(false);
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const view = navigation.view;
  // The manager stays mounted across destinations so the settings sidebar and
  // its icons do not rebuild on every click. Search text and action errors
  // belong to one destination, so clear them when it changes.
  const viewKey = `${view.type}:${"categoryId" in view ? view.categoryId : ""}:${
    "entryId" in view ? view.entryId : ""
  }`;
  const [previousViewKey, setPreviousViewKey] = useState(viewKey);
  if (previousViewKey !== viewKey) {
    setPreviousViewKey(viewKey);
    setSearch("");
    setError(undefined);
  }
  const configuring =
    view.type === "settings" || view.type === "category-settings";
  const selectedId = "categoryId" in view ? view.categoryId : undefined;
  const selected = categories.find((category) => category.id === selectedId);
  const showsEntries = view.type === "category" || view.type === "entry";
  // A new entry's page opens before the listener delivers it; it counts as
  // loading until then.
  const entriesLoading = useWorldEntriesStore(
    (store) =>
      store.entryState.loading ||
      (view.type === "entry" && !!store.entryState.arriving?.[view.entryId]),
  );
  const entry = useWorldEntriesStore((store) =>
    view.type === "entry" &&
    store.entryState.entries[view.entryId]?.categoryId === view.categoryId
      ? store.entryState.entries[view.entryId]
      : undefined,
  );
  const entryPermissions = useWorldEntriesStore((store) =>
    entry ? store.entryState.permissions[entry.id] : undefined,
  );
  const guided = useWorldIsGuided();
  const fields = Object.values(definitions)
    .filter(
      (field) => field.worldId === worldId && field.categoryId === selected?.id,
    )
    .sort((a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id));
  const canEdit = permission !== null && isGuideEquivalent(permission);
  const canCreateEntries =
    permission !== null &&
    permission !== WorldPermission.None &&
    permission !== WorldPermission.Viewer;
  const configurationReady =
    customized || (defaultBindingsReady && !oracles.loading && !oracles.error);
  const canDelete =
    permission === WorldPermission.Owner ||
    permission === WorldPermission.Editor;
  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    setError(undefined);
    try {
      await action();
    } catch (cause) {
      setError(getEditorErrorMessage(cause));
    } finally {
      setBusy(false);
    }
  };
  // Creates an entry with a placeholder name and the role's default sharing,
  // then opens it with the name selected, ready to type over or roll.
  const createEntryIn = (category: IWorldCategory) =>
    run(async () => {
      if (!uid) return;
      const { readPermissions, editPermissions } =
        getDefaultWorldEntryPermissions(canEdit, guided);
      const entryId = await createEntry(
        uid,
        category.worldId,
        category.id,
        t("worlds.entries.untitled", "Untitled"),
        readPermissions,
        editPermissions,
      );
      requestNameFocus(entryId);
      navigation.navigate({ type: "entry", categoryId: category.id, entryId });
    });
  const remove = (category: IWorldCategory) =>
    run(async () => {
      const { entryCount } = await getCategoryCounts(category.id);
      if (entryCount > 0) {
        setError(
          t(
            "worlds.categories.populated-delete",
            '"{{name}}" contains {{count}} entries. Categories with entries cannot be deleted.',
            { name: category.name, count: entryCount },
          ),
        );
        return;
      }
      const fieldLabels = Object.values(definitions)
        .filter((field) => field.categoryId === category.id)
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((field) => field.label);
      const { confirmed } = await confirm({
        title: t("worlds.categories.delete", "Delete category"),
        description: fieldLabels.length
          ? t(
              "worlds.categories.delete-confirmation",
              'Delete "{{name}}"? It has no entries, so no stored values are lost. These fields will also be permanently deleted: {{fields}}. This cannot be undone.',
              { name: category.name, fields: fieldLabels.join(", ") },
            )
          : t(
              "worlds.categories.delete-confirmation-no-fields",
              'Delete "{{name}}"? It has no entries or fields. This cannot be undone.',
              { name: category.name },
            ),
        confirmationText: t("common.delete", "Delete"),
      });
      if (confirmed) {
        await deleteCategory(category.id);
        if (selectedId === category.id)
          navigation.navigate({ type: "settings" });
      }
    });
  const create = async (draft: CategoryDraft) => {
    const id = await createCategory({
      ...draft,
      sortOrder: categories.length
        ? Math.max(...categories.map((category) => category.sortOrder)) + 1
        : 0,
    });
    if (configuring)
      navigation.navigate({ type: "category-settings", categoryId: id });
  };

  const addCategoryDisabled = !canEdit || !configurationReady || busy;
  const addCategoryButton = canEdit ? (
    <Button
      variant="contained"
      startIcon={<CreateNewFolderIcon />}
      disabled={addCategoryDisabled}
      onClick={() => setAdding(true)}
    >
      {t("worlds.categories.add", "Add category")}
    </Button>
  ) : undefined;

  let title: ReactNode | undefined = world.name;
  let titleIcon: ReactNode;
  let actions: WorldViewActions | undefined;
  if (view.type === "world") {
    actions = {
      start: (
        <Tooltip title={t("worlds.settings.title", "World settings")}>
          <IconButton
            LinkComponent={LinkComponent}
            {...navigation.getLinkProps({ type: "settings" })}
            aria-label={t("worlds.settings.title", "World settings")}
          >
            <SettingsIcon />
          </IconButton>
        </Tooltip>
      ),
      end: addCategoryButton,
    };
  } else if (view.type === "category") {
    title = selected?.name ?? title;
    titleIcon = selected?.icon?.key ? (
      <WorldCategoryIcon icon={selected.icon} size="large" />
    ) : undefined;
    actions = selected
      ? {
          start: (
            <WorldEntrySearch
              categoryName={selected.name}
              value={search}
              onChange={setSearch}
            />
          ),
          end: (
            <>
              <Tooltip
                title={t(
                  "worlds.categories.settings-named",
                  "{{name}} settings",
                  { name: selected.name },
                )}
              >
                <IconButton
                  LinkComponent={LinkComponent}
                  {...navigation.getLinkProps({
                    type: "category-settings",
                    categoryId: selected.id,
                  })}
                  aria-label={t(
                    "worlds.categories.settings-named",
                    "{{name}} settings",
                    { name: selected.name },
                  )}
                >
                  <SettingsIcon />
                </IconButton>
              </Tooltip>
              {canCreateEntries && (
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  disabled={busy}
                  onClick={() => selected && createEntryIn(selected)}
                >
                  {t("worlds.entries.new", "Create entry")}
                </Button>
              )}
            </>
          ),
        }
      : undefined;
  } else if (view.type === "entry") {
    // The entry renders its own editable header on both surfaces.
    title = undefined;
    const canShareEntry = !!entryPermissions?.canChangePermissions && guided;
    const canDeleteEntry = !!entryPermissions?.canDelete;
    const canEditEntry = !!entryPermissions?.canEdit;
    const canMoveEntry = canEditEntry && !!selected?.supportsHierarchy;
    // People who can do none of these get no strip at all.
    actions =
      entry && (canShareEntry || canEditEntry || canDeleteEntry)
        ? {
            start: (
              <WorldEntryActions
                key={entry.id}
                entry={entry}
                categoryName={selected?.name ?? ""}
                canShare={canShareEntry}
                canMove={canMoveEntry}
                canEdit={canEditEntry}
                canDelete={canDeleteEntry}
                onDeleted={() =>
                  navigation.navigate({
                    type: "category",
                    categoryId: entry.categoryId,
                  })
                }
                onError={(cause) => setError(getEditorErrorMessage(cause))}
              />
            ),
          }
        : undefined;
  } else {
    title = t("worlds.settings.title", "World settings");
  }

  let content: ReactNode = null;
  if (configuring) {
    if (!(loading && selectedId && !selected))
      content = (
        <WorldConfigurationView
          categories={categories}
          navigation={navigation}
          fields={fields}
          canEdit={canEdit}
          canDelete={canDelete}
          configurationReady={configurationReady && !loading}
          busy={busy}
          generalSettings={generalSettings}
          onAdd={() => setAdding(true)}
          onDelete={remove}
          onReorder={(ids) => run(() => reorderCategories(ids))}
        />
      );
  } else if (!loading) {
    content =
      view.type === "category" && selected ? (
        <WorldCategoryContents
          key={selected.id}
          category={selected}
          search={search}
          navigation={navigation}
        />
      ) : view.type === "entry" && selected ? (
        <WorldEntryView
          category={selected}
          entryId={view.entryId}
          navigation={navigation}
        />
      ) : (
        <WorldCategoryBrowser
          categories={categories}
          missingCategory={showsEntries && !selected}
          worldName={world.name}
          navigation={navigation}
        />
      );
  }

  return (
    <WorldViewLayout
      layout={layout}
      breadcrumbs={
        <WorldBreadcrumbs
          world={world}
          category={selected}
          categoryLoading={loading}
          entry={entry}
          entryLoading={entriesLoading}
          navigation={navigation}
          root={rootBreadcrumb}
        />
      }
      title={title}
      titleIcon={titleIcon}
      actions={actions}
    >
      <Box
        component="section"
        sx={{
          minWidth: 0,
          containerType: "inline-size",
          containerName: "world-configuration",
        }}
      >
        <Stack spacing={2}>
          {(loading || (configuring && !customized && oracles.loading)) && (
            <LinearProgress />
          )}
          {configuring && !customized && oracles.error && (
            <Alert
              severity="error"
              action={
                <Button color="inherit" onClick={oracles.retry}>
                  {t("common.retry", "Retry")}
                </Button>
              }
            >
              {oracles.error}
            </Alert>
          )}
          {loadError && <Alert severity="error">{loadError}</Alert>}
          {error && (
            <Alert severity="error" onClose={() => setError(undefined)}>
              {error}
            </Alert>
          )}
          {content}
        </Stack>
      </Box>
      {adding && (
        <WorldCategoryEditor onSave={create} onClose={() => setAdding(false)} />
      )}
    </WorldViewLayout>
  );
}
