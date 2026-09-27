import { Alert, Button, LinearProgress, Paper, Stack } from "@mui/material";
import { type ReactNode, useState } from "react";
import { useTranslation } from "react-i18next";

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

import { WorldCategoryBrowser } from "./WorldCategoryBrowser";
import { CategoryDraft, WorldCategoryEditor } from "./WorldCategoryEditor";
import { WorldConfigurationDeleteDialog } from "./WorldConfigurationDeleteDialog";
import { WorldConfigurationView } from "./WorldConfigurationView";
import { editorError } from "./categoryEditor.utils";
import { useWorldConfigurationDeleteConfirmation } from "./useWorldConfigurationDeleteConfirmation";

export function WorldCategoryManager({
  worldId,
  worldName,
  permission,
  configuring,
  onDone,
  generalSettings,
}: {
  worldId: string;
  worldName: string;
  permission: WorldPermission | null;
  configuring: boolean;
  onDone: () => void;
  generalSettings: ReactNode;
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
  const [selectedId, setSelectedId] = useState<string>();
  const [editor, setEditor] = useState<{ category?: IWorldCategory }>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
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
        setSelectedId((current) =>
          current === category.id ? undefined : current,
        );
      }
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
      if (configuring) setSelectedId(id);
    }
  };
  return (
    <Paper
      component="section"
      variant="outlined"
      sx={{
        p: 2,
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
        {configuring ? (
          <WorldConfigurationView
            configurationNotice={
              customized
                ? t(
                    "worlds.categories.customized-summary",
                    "This world has a custom configuration. Shared default updates do not affect it.",
                  )
                : t(
                    "worlds.categories.shared-defaults-summary",
                    "Shared defaults receive updates. Your first configuration change creates an independent copy.",
                  )
            }
            categories={categories}
            selectedId={selected?.id}
            fields={fields}
            canEdit={canEdit}
            canDelete={canDelete}
            configurationReady={configurationReady && !loading}
            busy={busy}
            generalSettings={generalSettings}
            onSelect={setSelectedId}
            onAdd={() => setEditor({})}
            onEdit={(category) => setEditor({ category })}
            onDelete={remove}
            onReorder={(ids) => run(() => reorderCategories(ids))}
            onDone={() => {
              setSelectedId(undefined);
              onDone();
            }}
          />
        ) : !loading ? (
          <WorldCategoryBrowser
            worldId={worldId}
            worldName={worldName}
            permission={permission}
            categories={categories}
            canAddCategory={canEdit && configurationReady && !busy}
            onAddCategory={() => setEditor({})}
          />
        ) : null}
      </Stack>
      <WorldConfigurationDeleteDialog
        request={deleteRequest}
        onAnswer={answerDelete}
      />
      {editor && (
        <WorldCategoryEditor
          key={editor.category?.id ?? "new"}
          category={editor.category}
          fields={Object.values(definitions).filter(
            (field) =>
              field.worldId === worldId &&
              field.categoryId === editor.category?.id,
          )}
          readOnly={!canEdit}
          onSave={save}
          onClose={() => setEditor(undefined)}
        />
      )}
    </Paper>
  );
}
