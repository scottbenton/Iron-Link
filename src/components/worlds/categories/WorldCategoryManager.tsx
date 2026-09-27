import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogContent,
  Divider,
  LinearProgress,
  Stack,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { DialogTitleWithCloseButton } from "components/DialogTitleWithCloseButton";
import { useWorldOracleContext } from "components/worlds/worldOracleContext";

import {
  useListenToWorldCategories,
  useWorldCategoriesStore,
} from "stores/worldCategories.store";

import { WorldPermission, isGuideEquivalent } from "repositories/shared.types";

import {
  IWorldCategory,
  WorldCategoriesService,
} from "services/worldCategories.service";

import { WorldCategoryConfigurationRow } from "./WorldCategoryConfigurationRow";
import { WorldCategoryContents } from "./WorldCategoryContents";
import { CategoryDraft, WorldCategoryEditor } from "./WorldCategoryEditor";
import { WorldCategoryFields } from "./WorldCategoryFields";
import { WorldCategoryIcon } from "./WorldCategoryIcon";
import { WorldConfigurationDeleteDialog } from "./WorldConfigurationDeleteDialog";
import { WorldConfigurationSortList } from "./WorldConfigurationSortList";
import { editorError } from "./categoryEditor.utils";
import { useWorldConfigurationDeleteConfirmation } from "./useWorldConfigurationDeleteConfirmation";

export function WorldCategoryManager({
  worldId,
  permission,
}: {
  worldId: string;
  permission: WorldPermission | null;
}) {
  const { t } = useTranslation();
  const {
    confirm,
    request: deleteRequest,
    answer: answerDelete,
  } = useWorldConfigurationDeleteConfirmation();
  const oracleContext = useWorldOracleContext(worldId);
  useListenToWorldCategories(worldId);
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
  const updateCategory = useWorldCategoriesStore(
    (store) => store.updateCategory,
  );
  const deleteCategory = useWorldCategoriesStore(
    (store) => store.deleteCategory,
  );
  const [configuring, setConfiguring] = useState(false);
  const [selectedId, setSelectedId] = useState<string>();
  const [editor, setEditor] = useState<{ category?: IWorldCategory }>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const selected =
    categories.find((category) => category.id === selectedId) ?? categories[0];
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
      if (confirmed) await deleteCategory(category.id);
    });
  const save = async (draft: CategoryDraft) => {
    if (editor?.category) await updateCategory(editor.category.id, draft);
    else {
      const id = await createCategory(worldId, {
        ...draft,
        sortOrder: categories.length
          ? Math.max(...categories.map((category) => category.sortOrder)) + 1
          : 0,
      });
      setSelectedId(id);
    }
  };
  const categoryTabs = (
    <Tabs
      value={selected?.id ?? false}
      onChange={(_, id: string) => setSelectedId(id)}
      variant="scrollable"
      scrollButtons="auto"
      aria-label={t("worlds.categories.title", "Categories")}
    >
      {categories.map((category) => (
        <Tab
          key={category.id}
          value={category.id}
          label={category.name}
          icon={<WorldCategoryIcon icon={category.icon} />}
          iconPosition="start"
          id={`world-category-tab-${category.id}`}
          aria-controls={`world-category-panel-${category.id}`}
        />
      ))}
    </Tabs>
  );
  return (
    <Box
      component="section"
      sx={{ mt: 4 }}
      aria-label={t("worlds.categories.title", "Categories")}
    >
      <Stack spacing={2}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          flexWrap="wrap"
          gap={1}
        >
          <Typography variant="h5">
            {t("worlds.categories.title", "Categories")}
          </Typography>
          <Stack direction="row" gap={1}>
            <Button onClick={() => setConfiguring(true)} disabled={loading}>
              {t("worlds.categories.configure", "Configure")}
            </Button>
            {canEdit && (
              <Button
                variant="outlined"
                disabled={busy || loading || !configurationReady}
                onClick={() => setEditor({})}
              >
                {t("worlds.categories.add", "Add category")}
              </Button>
            )}
          </Stack>
        </Stack>
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
        {!loading && !selected && (
          <Typography color="text.secondary">
            {t(
              "worlds.categories.empty-state",
              "This world has no categories yet.",
            )}
          </Typography>
        )}
        {selected && (
          <>
            {categoryTabs}
            <WorldCategoryContents
              key={selected.id}
              category={selected}
              permission={permission}
            />
          </>
        )}
      </Stack>
      <Dialog
        open={configuring}
        onClose={() => setConfiguring(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitleWithCloseButton onClose={() => setConfiguring(false)}>
          {t("worlds.categories.configure-title", "Configure world")}
        </DialogTitleWithCloseButton>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Alert severity="info">
              {customized
                ? t(
                    "worlds.categories.customized",
                    "This world has a custom configuration. Changes to shared defaults will not affect it.",
                  )
                : t(
                    "worlds.categories.shared-defaults",
                    "This world uses shared defaults and receives updates automatically. Your first saved configuration change creates an independent copy of all categories and fields.",
                  )}
            </Alert>
            {error && (
              <Alert severity="error" onClose={() => setError(undefined)}>
                {error}
              </Alert>
            )}
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
            >
              <Typography variant="h6">
                {t("worlds.categories.title", "Categories")}
              </Typography>
              {canEdit && (
                <Button
                  disabled={busy || loading || !configurationReady}
                  onClick={() => setEditor({})}
                >
                  {t("worlds.categories.add", "Add category")}
                </Button>
              )}
            </Stack>
            <WorldConfigurationSortList
              items={categories.map((category) => ({
                id: category.id,
                label: category.name,
              }))}
              onReorder={(ids) => run(() => reorderCategories(ids))}
            >
              <Stack spacing={1}>
                {categories.map((category) => (
                  <WorldCategoryConfigurationRow
                    key={category.id}
                    category={category}
                    selected={category.id === selected?.id}
                    canEdit={canEdit}
                    canDelete={canDelete}
                    disabled={busy || !configurationReady}
                    onSelect={() => setSelectedId(category.id)}
                    onEdit={() => setEditor({ category })}
                    onDelete={() => remove(category)}
                  />
                ))}
              </Stack>
            </WorldConfigurationSortList>
            {selected && (
              <>
                <Divider />
                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                >
                  <Typography variant="h6">{selected.name}</Typography>
                  {!canEdit && (
                    <Button onClick={() => setEditor({ category: selected })}>
                      {t("worlds.categories.view", "Category configuration")}
                    </Button>
                  )}
                </Stack>
                <WorldCategoryFields
                  key={selected.id}
                  category={selected}
                  fields={fields}
                  canEdit={canEdit}
                  canDelete={canDelete}
                  configurationReady={configurationReady}
                />
              </>
            )}
          </Stack>
        </DialogContent>
      </Dialog>
      <WorldConfigurationDeleteDialog
        request={deleteRequest}
        onAnswer={answerDelete}
      />
      {editor && (
        <WorldCategoryEditor
          key={editor.category?.id ?? "new"}
          category={editor.category}
          fields={Object.values(definitions).filter(
            (field) => field.categoryId === editor.category?.id,
          )}
          readOnly={!canEdit}
          onSave={save}
          onClose={() => setEditor(undefined)}
        />
      )}
    </Box>
  );
}
