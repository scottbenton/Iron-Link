import AddIcon from "@mui/icons-material/Add";
import SettingsIcon from "@mui/icons-material/Settings";
import SwapVertIcon from "@mui/icons-material/SwapVert";
import {
  Box,
  Card,
  Divider,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  MenuItem,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { LinkComponent } from "components/LinkComponent";
import type { WorldNavigation } from "components/worlds/worldNavigation";

import { useWorldCategoriesStore } from "stores/worldCategories.store";

import type { IWorldCategory } from "services/worldCategories.service";

import { WorldCategoryReorderDialog } from "./WorldCategoryReorderDialog";
import { WorldConfigurationSortList } from "./WorldConfigurationSortList";
import { WorldSettingsCategoryItem } from "./WorldSettingsCategoryItem";

// Settings default to a sidebar; narrow containers (such as the Notes
// column) switch to a section picker.
export const NARROW_SETTINGS =
  "@container world-configuration (max-width: 719.98px)";

const GENERAL = "general";

// Wide containers get a sidebar list (with drag reordering); narrow ones get
// a section picker plus a reorder dialog.
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
  const customized = useWorldCategoriesStore(
    (store) => store.configurationCustomized,
  );
  const selectedId =
    navigation.view.type === "category-settings"
      ? navigation.view.categoryId
      : undefined;
  const [reordering, setReordering] = useState(false);
  const addLabel = t("worlds.categories.add", "Add category");
  const reorderLabel = t("worlds.categories.reorder", "Reorder categories");
  return (
    <Box
      component="nav"
      aria-label={t("worlds.settings.navigation", "World settings navigation")}
      sx={{
        width: 260,
        flexShrink: 0,
        position: "sticky",
        top: 0,
        [NARROW_SETTINGS]: { width: "100%", position: "static" },
      }}
    >
      <Box
        sx={{
          display: "none",
          alignItems: "center",
          gap: 0.5,
          pt: 1,
          [NARROW_SETTINGS]: { display: "flex" },
        }}
      >
        <TextField
          select
          fullWidth
          size="small"
          label={t("worlds.settings.section", "Settings section")}
          value={selectedId ?? GENERAL}
          onChange={(event) =>
            navigation.navigate(
              event.target.value === GENERAL
                ? { type: "settings" }
                : {
                    type: "category-settings",
                    categoryId: event.target.value,
                  },
            )
          }
        >
          <MenuItem value={GENERAL}>
            {t("worlds.settings.general", "General")}
          </MenuItem>
          <ListSubheader>
            {t("worlds.categories.title", "Categories")}
          </ListSubheader>
          {categories.map((category) => (
            <MenuItem key={category.id} value={category.id}>
              {category.name}
            </MenuItem>
          ))}
        </TextField>
        {canEdit && (
          <>
            <Tooltip title={reorderLabel}>
              <span>
                <IconButton
                  aria-label={reorderLabel}
                  disabled={disabled || categories.length < 2}
                  onClick={() => setReordering(true)}
                >
                  <SwapVertIcon />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title={addLabel}>
              <span>
                <IconButton
                  aria-label={addLabel}
                  disabled={disabled}
                  onClick={onAdd}
                >
                  <AddIcon />
                </IconButton>
              </span>
            </Tooltip>
          </>
        )}
      </Box>
      <Card
        variant="outlined"
        sx={{
          bgcolor: "background.default",
          [NARROW_SETTINGS]: { display: "none" },
        }}
      >
        <List disablePadding>
          <ListItemButton
            LinkComponent={LinkComponent}
            {...navigation.getLinkProps({ type: "settings" })}
            selected={selectedId === undefined}
            aria-current={selectedId === undefined ? "page" : undefined}
          >
            <ListItemIcon sx={{ minWidth: 36 }}>
              <SettingsIcon />
            </ListItemIcon>
            <ListItemText primary={t("worlds.settings.general", "General")} />
          </ListItemButton>
        </List>
        <Divider />
        <List
          disablePadding
          subheader={
            <ListSubheader
              sx={(theme) => ({
                bgcolor: "transparent",
                fontFamily: theme.typography.fontFamilyTitle,
                fontSize: theme.typography.body1.fontSize,
              })}
            >
              {t("worlds.categories.title", "Categories")}
            </ListSubheader>
          }
        >
          <WorldConfigurationSortList
            items={categories.map((category) => ({
              id: category.id,
              label: category.name,
            }))}
            onReorder={onReorder}
          >
            {categories.map((category) => (
              <WorldSettingsCategoryItem
                key={category.id}
                category={category}
                selected={category.id === selectedId}
                sortable={canEdit}
                disabled={disabled}
                linkProps={navigation.getLinkProps({
                  type: "category-settings",
                  categoryId: category.id,
                })}
              />
            ))}
          </WorldConfigurationSortList>
          {canEdit && (
            <ListItemButton
              component="button"
              disabled={disabled}
              onClick={onAdd}
              sx={{ width: "100%", textAlign: "left" }}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>
                <AddIcon />
              </ListItemIcon>
              <ListItemText primary={addLabel} />
            </ListItemButton>
          )}
        </List>
      </Card>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ display: "block", px: 1, pt: 1 }}
      >
        {customized
          ? t(
              "worlds.categories.customized-summary",
              "This world has a custom configuration. Shared default updates do not affect it.",
            )
          : t(
              "worlds.categories.shared-defaults-summary",
              "Shared defaults receive updates. Your first configuration change creates an independent copy.",
            )}
      </Typography>
      {reordering && (
        <WorldCategoryReorderDialog
          categories={categories}
          disabled={disabled}
          onReorder={onReorder}
          onClose={() => setReordering(false)}
        />
      )}
    </Box>
  );
}
