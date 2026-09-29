import AddIcon from "@mui/icons-material/Add";
import { Alert, Button, Stack, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

import { GridLayout } from "components/Layout";
import { LinkComponent } from "components/LinkComponent";

import { WorldPermission, isGuideEquivalent } from "repositories/shared.types";

import { IWorldCategory } from "services/worldCategories.service";

import type { WorldNavigation } from "../worldNavigation";
import { WorldCategoryContents } from "./WorldCategoryContents";
import { WorldCategoryFolder } from "./WorldCategoryFolder";

export function WorldCategoryBrowser({
  worldId,
  worldName,
  permission,
  categories,
  canAddCategory,
  onAddCategory,
  navigation,
}: {
  worldId: string;
  worldName: string;
  permission: WorldPermission | null;
  categories: IWorldCategory[];
  canAddCategory: boolean;
  onAddCategory: () => void;
  navigation: WorldNavigation;
}) {
  const { t } = useTranslation();
  const currentCategories = categories.filter(
    (category) => category.worldId === worldId,
  );
  const selectedId =
    navigation.view.type === "category"
      ? navigation.view.categoryId
      : undefined;
  const selected = currentCategories.find(
    (category) => category.id === selectedId,
  );
  const canEdit = permission !== null && isGuideEquivalent(permission);
  if (selectedId)
    return selected ? (
      <WorldCategoryContents
        key={selected.id}
        category={selected}
        permission={permission}
        settingsLinkProps={navigation.getLinkProps({
          type: "category-settings",
          categoryId: selected.id,
        })}
      />
    ) : (
      <Stack spacing={2}>
        <Alert severity="info">
          {t("worlds.category.missing", "Category unavailable")}
        </Alert>
        <Button
          LinkComponent={LinkComponent}
          {...navigation.getLinkProps({ type: "world" })}
        >
          {t("worlds.categories.back", "Back to world")}
        </Button>
      </Stack>
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
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        flexWrap="wrap"
        gap={1}
      >
        <Typography
          component="h2"
          variant="h6"
          fontFamily={(theme) => theme.typography.fontFamilyTitle}
        >
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
      <GridLayout
        items={currentCategories}
        minWidth={220}
        gap={1}
        renderItem={(category) => (
          <WorldCategoryFolder
            category={category}
            linkProps={navigation.getLinkProps({
              type: "category",
              categoryId: category.id,
            })}
          />
        )}
        emptyStateMessage={t(
          "worlds.categories.empty-state",
          "This world has no categories yet.",
        )}
      />
    </Stack>
  );
}
