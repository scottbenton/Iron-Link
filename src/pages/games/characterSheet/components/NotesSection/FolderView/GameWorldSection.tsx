import PublicIcon from "@mui/icons-material/Public";
import SettingsIcon from "@mui/icons-material/Settings";
import {
  Box,
  IconButton,
  LinearProgress,
  Link,
  Tooltip,
  Typography,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router";

import { GridLayout } from "components/Layout";
import { LinkComponent } from "components/LinkComponent";
import { WorldCategoryFolder } from "components/worlds/categories/WorldCategoryFolder";
import type { WorldView } from "components/worlds/worldNavigation";

import { getNotesItemLinkProps } from "pages/games/gamePageLayout/hooks/notesDestination";

import { useNotesStore } from "stores/notes.store";
import { useWorldPermission, useWorldStore } from "stores/world.store";
import { useWorldCategoriesStore } from "stores/worldCategories.store";
import { useWorldEntriesStore } from "stores/worldEntries.store";

import { isGuideEquivalent } from "repositories/shared.types";

import { useGameWorldId } from "../hooks/useGameWorld";

// The linked world at the top of the viewer's root Notes folder: its name
// (which opens the world home), a cog for people who manage it, and its
// categories as folder cards, so players reach them in one click.
//
// The Truths card joins the categories once the truths screen exists (#263).
export function GameWorldSection() {
  const { t } = useTranslation();
  const location = useLocation();
  const worldId = useGameWorldId();
  const openItemTab = useNotesStore((store) => store.openItemTab);

  const world = useWorldStore((store) =>
    store.world && store.world.id === worldId ? store.world : undefined,
  );
  const worldUnavailable = useWorldStore(
    (store) =>
      store.worldId === worldId && (store.worldDeleted || !!store.error),
  );
  const permission = useWorldPermission();
  const canManage = permission !== null && isGuideEquivalent(permission);

  const categoriesLoading = useWorldCategoriesStore((store) => store.loading);
  const categories = useWorldCategoriesStore((store) =>
    Object.values(store.categories)
      .filter((category) => category.worldId === worldId)
      .sort((a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id)),
  );
  const entriesLoading = useWorldEntriesStore(
    (store) => store.entryState.loading,
  );
  const entryCounts = useWorldEntriesStore((store) => {
    const counts: Record<string, number> = {};
    Object.values(store.entryState.entries).forEach((entry) => {
      counts[entry.categoryId] = (counts[entry.categoryId] ?? 0) + 1;
    });
    return counts;
  });

  if (!worldId || worldUnavailable) return null;

  const linkProps = (view: WorldView, newTab = false) =>
    getNotesItemLinkProps(
      location.pathname,
      new URLSearchParams(location.search),
      { type: "world", itemId: worldId, worldView: view },
      (item, background) =>
        openItemTab({
          type: item.type,
          id: item.itemId,
          worldView: item.worldView,
          replaceCurrent: !background && !newTab,
          openInBackground: background,
          disallowDuplicates: background,
        }),
    );

  const settingsLabel = t("worlds.settings.title", "World settings");

  return (
    <Box
      component="section"
      aria-label={world?.name ?? t("worlds.tab.world", "World")}
      sx={{ mb: 2 }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, px: 1 }}>
        <PublicIcon fontSize="small" color="action" />
        {world ? (
          <Link
            component={LinkComponent}
            {...linkProps({ type: "world" })}
            variant="overline"
            color="inherit"
            underline="hover"
            sx={{ fontSize: "0.875rem", lineHeight: 2.5 }}
          >
            {world.name}
          </Link>
        ) : (
          <Typography variant="overline" sx={{ fontSize: "0.875rem" }}>
            {t("worlds.tab.world", "World")}
          </Typography>
        )}
        {world && canManage && (
          <Tooltip title={settingsLabel}>
            <IconButton
              size="small"
              LinkComponent={LinkComponent}
              // World settings open beside the root, so the folder stays put.
              {...linkProps({ type: "settings" }, true)}
              aria-label={settingsLabel}
            >
              <SettingsIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Box>
      {!world || categoriesLoading ? (
        <LinearProgress
          aria-label={t("worlds.game.loading-world", "Loading world")}
          sx={{ mx: 1, my: 2 }}
        />
      ) : (
        <GridLayout
          items={categories}
          minWidth={200}
          gap={1}
          renderItem={(category) => (
            <WorldCategoryFolder
              key={category.id}
              category={category}
              linkProps={linkProps({
                type: "category",
                categoryId: category.id,
              })}
              subtitle={
                entriesLoading
                  ? undefined
                  : t("worlds.categories.entry-count", "{{count}} entries", {
                      count: entryCounts[category.id] ?? 0,
                      defaultValue_one: "{{count}} entry",
                    })
              }
            />
          )}
          emptyStateMessage={t(
            "worlds.categories.empty-state",
            "This world has no categories yet.",
          )}
        />
      )}
    </Box>
  );
}
