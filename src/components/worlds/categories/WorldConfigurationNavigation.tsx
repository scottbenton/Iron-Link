import { Box, Button, Stack, Typography } from "@mui/material";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { LinkComponent } from "components/LinkComponent";
import type { WorldNavigation } from "components/worlds/worldNavigation";

import type { IWorldCategory } from "services/worldCategories.service";

import { WorldCategoryConfigurationRow } from "./WorldCategoryConfigurationRow";
import { WorldConfigurationSortList } from "./WorldConfigurationSortList";

export function WorldConfigurationNavigation({
  categories,
  navigation,
  canEdit,
  disabled,
  onAdd,
  onReorder,
}: {
  categories: IWorldCategory[];
  navigation: WorldNavigation;
  canEdit: boolean;
  disabled: boolean;
  onAdd: () => void;
  onReorder: (ids: string[]) => void;
}) {
  const { t } = useTranslation();
  const selectedId =
    navigation.view.type === "category-settings"
      ? navigation.view.categoryId
      : undefined;
  const [reordering, setReordering] = useState(false);
  const wide = "@container world-configuration (min-width: 720px)";
  return (
    <Stack
      component="nav"
      aria-label={t("worlds.settings.navigation", "World settings navigation")}
      spacing={1.5}
      sx={{
        width: "100%",
        flexShrink: 0,
        "@container world-configuration (min-width: 720px)": { width: 240 },
      }}
    >
      <Button
        component={LinkComponent}
        {...navigation.getLinkProps({ type: "settings" })}
        variant={selectedId === undefined ? "contained" : "outlined"}
        aria-current={selectedId === undefined ? "page" : undefined}
        sx={{
          justifyContent: "flex-start",
        }}
      >
        {t("worlds.settings.general", "General")}
      </Button>
      <Stack
        direction="row"
        useFlexGap
        sx={{ flexWrap: "wrap", gap: 1, [wide]: { display: "none" } }}
        aria-label={t(
          "worlds.settings.category-links",
          "Category settings links",
        )}
      >
        {categories.map((category) => (
          <Button
            key={category.id}
            component={LinkComponent}
            {...navigation.getLinkProps({
              type: "category-settings",
              categoryId: category.id,
            })}
            variant={category.id === selectedId ? "contained" : "outlined"}
            aria-current={category.id === selectedId ? "page" : undefined}
            sx={{ minWidth: 0, overflowWrap: "anywhere", textAlign: "left" }}
          >
            {category.name}
          </Button>
        ))}
      </Stack>
      <Typography
        variant="overline"
        sx={{ display: "none", [wide]: { display: "block" } }}
      >
        {t("worlds.categories.title", "Categories")}
      </Typography>
      {canEdit && (
        <Button
          aria-expanded={reordering}
          disabled={disabled}
          onClick={() => setReordering(!reordering)}
          sx={{ display: "flex", [wide]: { display: "none" } }}
        >
          {t("worlds.categories.reorder", "Reorder categories")}
        </Button>
      )}
      <Box
        sx={{
          display: reordering ? "block" : "none",
          [wide]: { display: "block" },
        }}
      >
        <WorldConfigurationSortList
          items={categories.map((category) => ({
            id: category.id,
            label: category.name,
          }))}
          onReorder={onReorder}
        >
          <Stack spacing={1}>
            {categories.map((category) => (
              <WorldCategoryConfigurationRow
                key={category.id}
                category={category}
                selected={category.id === selectedId}
                canEdit={canEdit}
                disabled={disabled}
                linkProps={navigation.getLinkProps({
                  type: "category-settings",
                  categoryId: category.id,
                })}
              />
            ))}
          </Stack>
        </WorldConfigurationSortList>
      </Box>
      {canEdit && (
        <Button variant="outlined" disabled={disabled} onClick={onAdd}>
          {t("worlds.categories.add", "Add category")}
        </Button>
      )}
    </Stack>
  );
}
