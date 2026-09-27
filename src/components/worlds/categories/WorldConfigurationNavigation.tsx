import { Box, Button, Stack, TextField, Typography } from "@mui/material";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import type { IWorldCategory } from "services/worldCategories.service";

import { WorldCategoryConfigurationRow } from "./WorldCategoryConfigurationRow";
import { WorldConfigurationSortList } from "./WorldConfigurationSortList";

export function WorldConfigurationNavigation({
  categories,
  selectedId,
  canEdit,
  disabled,
  onSelect,
  onAdd,
  onReorder,
}: {
  categories: IWorldCategory[];
  selectedId?: string;
  canEdit: boolean;
  disabled: boolean;
  onSelect: (id: string | undefined) => void;
  onAdd: () => void;
  onReorder: (ids: string[]) => void;
}) {
  const { t } = useTranslation();
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
      <TextField
        fullWidth
        select
        label={t("worlds.settings.section", "Settings section")}
        value={selectedId ?? ""}
        onChange={(event) => onSelect(event.target.value || undefined)}
        slotProps={{ select: { native: true }, inputLabel: { shrink: true } }}
        sx={{ width: "100%", [wide]: { display: "none" } }}
      >
        <option value="">{t("worlds.settings.general", "General")}</option>
        {categories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.name}
          </option>
        ))}
      </TextField>
      <Button
        variant={selectedId === undefined ? "contained" : "outlined"}
        aria-pressed={selectedId === undefined}
        onClick={() => onSelect(undefined)}
        sx={{
          justifyContent: "flex-start",
          display: "none",
          [wide]: { display: "flex" },
        }}
      >
        {t("worlds.settings.general", "General")}
      </Button>
      <Typography
        variant="overline"
        sx={{ display: "none", [wide]: { display: "block" } }}
      >
        {t("worlds.categories.title", "Categories")}
      </Typography>
      {canEdit && (
        <Button
          aria-expanded={reordering}
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
                onSelect={() => onSelect(category.id)}
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
