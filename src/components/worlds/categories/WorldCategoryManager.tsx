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
import { type ReactNode, useState } from "react";
import { useTranslation } from "react-i18next";

import type { BreadcrumbItem } from "components/Layout/BreadcrumbTrail";
import { LinkComponent } from "components/LinkComponent";
import { useWorldOracleContext } from "components/worlds/worldOracleContext";

import { useWorldCategoriesStore } from "stores/worldCategories.store";

import { WorldPermission, isGuideEquivalent } from "repositories/shared.types";

import {
  IWorldCategory,
  WorldCategoriesService,
} from "services/worldCategories.service";
import { IWorld } from "services/worlds.service";

import { WorldBreadcrumbs } from "../WorldBreadcrumbs";
import {
  WorldLayout,
  WorldViewActions,
  WorldViewLayout,
} from "../WorldViewLayout";
import type { WorldNavigation } from "../worldNavigation";
import { WorldCategoryBrowser } from "./WorldCategoryBrowser";
import { WorldCategoryContents } from "./WorldCategoryContents";
import { CategoryDraft, WorldCategoryEditor } from "./WorldCategoryEditor";
import { WorldCategoryIcon } from "./WorldCategoryIcon";
import { WorldConfigurationDeleteDialog } from "./WorldConfigurationDeleteDialog";
import { WorldConfigurationView } from "./WorldConfigurationView";
import { WorldEntrySearch } from "./WorldEntrySearch";
import { editorError } from "./categoryEditor.utils";
import { useWorldConfigurationDeleteConfirmation } from "./useWorldConfigurationDeleteConfirmation";

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
  const {
    confirm,
    request: deleteRequest,
    answer: answerDelete,
  } = useWorldConfigurationDeleteConfirmation();
  const oracleContext = useWorldOracleContext(worldId);
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
  const [adding, setAdding] = useState(false);
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const view = navigation.view;
  const configuring =
    view.type === "settings" || view.type === "category-settings";
  const selectedId = "categoryId" in view ? view.categoryId : undefined;
  const selected = categories.find((category) => category.id === selectedId);
  const fields = Object.values(definitions)
    .filter(
      (field) => field.worldId === worldId && field.categoryId === selected?.id,
    )
    .sort((a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id));
  const canEdit = permission !== null && isGuideEquivalent(permission);
  const configurationReady =
    customized ||
    (defaultBindingsReady && !oracleContext.loading && !oracleContext.error);
  const canDelete =
    permission === WorldPermission.Owner ||
    permission === WorldPermission.Editor;
  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    setError(undefined);
    try {
      await action();
    } catch (cause) {
      setError(
        editorError(
          cause,
          t(
            "worlds.categories.action-error",
            "Could not update these categories. Please try again.",
          ),
        ),
      );
    } finally {
      setBusy(false);
    }
  };
  const remove = (category: IWorldCategory) =>
    run(async () => {
      const { entryCount } = await WorldCategoriesService.getCategoryCounts(
        worldId,
        category.id,
      );
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
      const { confirmed } = await confirm({
        title: t("worlds.categories.delete", "Delete category"),
        description: t(
          "worlds.categories.delete-confirmation",
          'Delete "{{name}}"? It contains 0 entries. All its field definitions will be permanently deleted. This cannot be undone.',
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
    const id = await createCategory(worldId, {
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

  let title: ReactNode = world.name;
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
            <Tooltip
              title={t(
                "worlds.categories.settings-named",
                "{{name}} settings",
                {
                  name: selected.name,
                },
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
          ),
          end: <WorldEntrySearch value={search} onChange={setSearch} />,
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
          permission={permission}
          search={search}
        />
      ) : (
        <WorldCategoryBrowser
          categories={categories}
          missingCategory={view.type === "category" && !selected}
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
          {(loading || (!customized && oracleContext.loading)) && (
            <LinearProgress />
          )}
          {!customized && oracleContext.error && (
            <Alert
              severity="error"
              action={
                <Button color="inherit" onClick={oracleContext.retry}>
                  {t("common.retry", "Retry")}
                </Button>
              }
            >
              {oracleContext.error}
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
      <WorldConfigurationDeleteDialog
        request={deleteRequest}
        onAnswer={answerDelete}
      />
      {adding && (
        <WorldCategoryEditor onSave={create} onClose={() => setAdding(false)} />
      )}
    </WorldViewLayout>
  );
}
