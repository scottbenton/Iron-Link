import AddIcon from "@mui/icons-material/Add";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { Breadcrumbs, Button, Paper, Stack, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

import { GridLayout } from "components/Layout";

import { useWorldCategoryNavigationStore } from "stores/worldCategoryNavigation.store";

import { WorldPermission, isGuideEquivalent } from "repositories/shared.types";

import { IWorldCategory } from "services/worldCategories.service";

import { WorldCategoryContents } from "./WorldCategoryContents";
import { WorldCategoryFolder } from "./WorldCategoryFolder";

export function WorldCategoryBrowser({
  worldId,
  worldName,
  permission,
  categories,
  canAddCategory,
  onAddCategory,
}: {
  worldId: string;
  worldName: string;
  permission: WorldPermission | null;
  categories: IWorldCategory[];
  canAddCategory: boolean;
  onAddCategory: () => void;
}) {
  const { t } = useTranslation();
  const selectedCategoryId = useWorldCategoryNavigationStore(
    (store) => store.selectedCategoryIds[worldId],
  );
  const selectCategory = useWorldCategoryNavigationStore(
    (store) => store.selectCategory,
  );
  const canEdit = permission !== null && isGuideEquivalent(permission);
  const currentCategories = categories.filter(
    (category) => category.worldId === worldId,
  );
  const selected = currentCategories.find(
    (category) => category.id === selectedCategoryId,
  );
  return (
    <Stack
      spacing={2}
      component="section"
      aria-label={t("worlds.categories.browser", "{{name}} categories", {
        name: worldName,
      })}
      sx={{ minWidth: 0 }}
    >
      {selected ? (
        <>
          <Breadcrumbs
            aria-label={t(
              "worlds.categories.breadcrumb",
              "Category navigation",
            )}
          >
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={() => selectCategory(worldId)}
            >
              {t("worlds.categories.title", "Categories")}
            </Button>
            <Typography
              component="h2"
              variant="h6"
              color="text.primary"
              sx={{ overflowWrap: "anywhere" }}
            >
              {selected.name}
            </Typography>
          </Breadcrumbs>
          <WorldCategoryContents
            key={selected.id}
            category={selected}
            permission={permission}
          />
        </>
      ) : (
        <>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            flexWrap="wrap"
            gap={1}
          >
            <Typography component="h2" variant="h6">
              {t("worlds.categories.title", "Categories")}
            </Typography>
            {canEdit && (
              <Button
                startIcon={<AddIcon />}
                variant="outlined"
                disabled={!canAddCategory}
                onClick={onAddCategory}
              >
                {t("worlds.categories.add", "Add category")}
              </Button>
            )}
          </Stack>
          {currentCategories.length ? (
            <GridLayout
              items={currentCategories}
              minWidth={220}
              gap={1}
              renderItem={(category) => (
                <WorldCategoryFolder
                  category={category}
                  onOpen={() => selectCategory(worldId, category.id)}
                />
              )}
            />
          ) : (
            <Paper variant="outlined" sx={{ p: 3 }}>
              <Typography color="text.secondary">
                {t(
                  "worlds.categories.empty-state",
                  "This world has no categories yet.",
                )}
              </Typography>
            </Paper>
          )}
        </>
      )}
    </Stack>
  );
}
