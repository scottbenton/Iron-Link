import {
  Alert,
  Box,
  Button,
  LinearProgress,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useConfirm } from "material-ui-confirm";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { useWorldTemplateBackfill } from "hooks/worlds/useWorldTemplateBackfill";

import {
  useListenToWorldCategories,
  useWorldCategoriesStore,
} from "stores/worldCategories.store";

import { WorldPermission, isGuideEquivalent } from "repositories/shared.types";

import {
  IWorldCategory,
  WorldCategoriesService,
} from "services/worldCategories.service";

import { CategoryDraft, WorldCategoryEditor } from "./WorldCategoryEditor";
import { WorldCategoryFields } from "./WorldCategoryFields";
import { WorldCategoryIcon } from "./WorldCategoryIcon";
import { editorError } from "./categoryEditor.utils";

export function WorldCategoryManager({
  worldId,
  permission,
}: {
  worldId: string;
  permission: WorldPermission | null;
}) {
  const { t } = useTranslation();
  const confirm = useConfirm();
  useListenToWorldCategories(worldId);
  const backfill = useWorldTemplateBackfill(worldId);
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
  const selected =
    categories.find((category) => category.id === selectedId) ?? categories[0];
  const fields = Object.values(definitions)
    .filter(
      (field) => field.worldId === worldId && field.categoryId === selected?.id,
    )
    .sort((a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id));
  const canEdit = permission !== null && isGuideEquivalent(permission);
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
  const move = (offset: number) =>
    run(async () => {
      const index = categories.findIndex(
        (category) => category.id === selected?.id,
      );
      const next = [...categories];
      [next[index], next[index + offset]] = [next[index + offset], next[index]];
      await WorldCategoriesService.reorderCategories(
        worldId,
        next.map((category) => category.id),
      );
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
  return (
    <Box
      component="section"
      sx={{ mt: 4 }}
      aria-label={t("worlds.categories.title", "Categories")}
    >
      <Stack spacing={2}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
        >
          <Typography variant="h5">
            {t("worlds.categories.title", "Categories")}
          </Typography>
          {canEdit && (
            <Button
              variant="outlined"
              disabled={busy || loading || backfill.loading}
              onClick={() => setEditor({})}
            >
              {t("worlds.categories.add", "Add category")}
            </Button>
          )}
        </Stack>
        {(loading || backfill.loading) && <LinearProgress />}
        {loadError && <Alert severity="error">{loadError}</Alert>}
        {backfill.error && (
          <Alert
            severity="error"
            action={
              canEdit && (
                <Button color="inherit" onClick={backfill.retry}>
                  {t("common.retry", "Retry")}
                </Button>
              )
            }
          >
            {backfill.error}
          </Alert>
        )}
        {error && (
          <Alert severity="error" onClose={() => setError(undefined)}>
            {error}
          </Alert>
        )}
        {!loading && !backfill.loading && !selected && (
          <Typography color="text.secondary">
            {t(
              "worlds.categories.empty-state",
              "This world has no categories yet.",
            )}
          </Typography>
        )}
        {selected && (
          <>
            <TextField
              select
              label={t("worlds.categories.selected", "Category")}
              value={selected.id}
              onChange={(event) => setSelectedId(event.target.value)}
            >
              {categories.map((category) => (
                <MenuItem value={category.id} key={category.id}>
                  <WorldCategoryIcon icon={category.icon} />
                  {category.name}
                </MenuItem>
              ))}
            </TextField>
            <Stack direction="row" flexWrap="wrap" gap={1}>
              {canEdit && (
                <>
                  <Button
                    disabled={busy || selected.id === categories[0]?.id}
                    onClick={() => move(-1)}
                  >
                    {t("worlds.categories.move-up", "Move category up")}
                  </Button>
                  <Button
                    disabled={busy || selected.id === categories.at(-1)?.id}
                    onClick={() => move(1)}
                  >
                    {t("worlds.categories.move-down", "Move category down")}
                  </Button>
                </>
              )}
              <Button
                disabled={busy}
                onClick={() => setEditor({ category: selected })}
              >
                {canEdit
                  ? t("worlds.categories.edit", "Edit category")
                  : t("worlds.categories.view", "Category configuration")}
              </Button>
              {canDelete && (
                <Button
                  color="error"
                  disabled={busy}
                  onClick={() => remove(selected)}
                >
                  {t("worlds.categories.delete", "Delete category")}
                </Button>
              )}
            </Stack>
            <WorldCategoryFields
              key={selected.id}
              category={selected}
              fields={fields}
              canEdit={canEdit}
              canDelete={canDelete}
            />
          </>
        )}
      </Stack>
      {editor && (
        <WorldCategoryEditor
          key={editor.category?.id ?? "new"}
          category={editor.category}
          fields={fields}
          readOnly={!canEdit}
          onSave={save}
          onClose={() => setEditor(undefined)}
        />
      )}
    </Box>
  );
}
