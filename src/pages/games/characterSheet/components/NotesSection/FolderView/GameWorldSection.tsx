import { useTranslation } from "react-i18next";
import { useLocation } from "react-router";

import { WorldCategoryIcon } from "components/worlds/categories/WorldCategoryIcon";
import { useWorldTruthsCard } from "components/worlds/truths/useWorldTruthsCard";
import type { WorldView } from "components/worlds/worldNavigation";

import { IconButton } from "ui/components/IconButton";
import { Link } from "ui/components/Link";
import { Progress } from "ui/components/Progress";
import { Text } from "ui/components/Text";
import { NoteCard } from "ui/game/NoteCard";
import { BookOpenTextIcon, FolderIcon, GearIcon, GlobeIcon } from "ui/icons";
import { EmptyState } from "ui/layout/EmptyState";
import { Box, Grid, HStack } from "ui/primitives";

import { getNotesItemLinkProps } from "pages/games/gamePageLayout/hooks/notesDestination";

import { useNotesStore } from "stores/notes.store";
import { useWorldPermission, useWorldStore } from "stores/world.store";
import { useWorldCategoriesStore } from "stores/worldCategories.store";
import { useWorldEntriesStore } from "stores/worldEntries.store";

import { isGuideEquivalent } from "repositories/shared.types";

import { useGameWorldId } from "../hooks/useGameWorld";

// The linked world at the top of the viewer's root Notes folder: its name
// (which opens the world home), a cog for people who manage it, and its
// Truths card and its categories as folder cards, so players reach them in
// one click.
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
  const truthsCard = useWorldTruthsCard(world?.id, world?.settingKey ?? null);
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

  const worldLabel = world?.name ?? t("worlds.tab.world", "World");
  const cards = truthsCard ? [truthsCard, ...categories] : categories;

  return (
    <Box as="section" aria-label={worldLabel}>
      <HStack gap="2" paddingInline="1" minHeight="10">
        <Box as="span" display="flex" color="fg.muted" aria-hidden>
          <GlobeIcon />
        </Box>
        <Text variant="label" as="h3">
          {world ? (
            <Link {...linkProps({ type: "world" })} color="inherit">
              {world.name}
            </Link>
          ) : (
            worldLabel
          )}
        </Text>
        {world && canManage && (
          <IconButton
            label={settingsLabel}
            size="sm"
            // World settings open beside the root, so the folder stays put.
            render={<a {...linkProps({ type: "settings" }, true)} />}
            nativeButton={false}
          >
            <GearIcon />
          </IconButton>
        )}
      </HStack>
      {!world || categoriesLoading ? (
        <Progress
          label={t("worlds.game.loading-world", "Loading world")}
          css={{ marginBlock: "4", marginInline: "1" }}
        />
      ) : cards.length === 0 ? (
        <EmptyState
          size="sm"
          message={t(
            "worlds.categories.empty-state",
            "This world has no categories yet.",
          )}
        />
      ) : (
        <Grid
          gap="2"
          gridTemplateColumns="repeat(auto-fill, minmax(min(100%, 200px), 1fr))"
        >
          {cards.map((card) =>
            "truths" in card ? (
              <NoteCard
                key="truths"
                icon={<BookOpenTextIcon />}
                title={t("worlds.truths.title", "Truths")}
                subtitle={card.subtitle}
                link={linkProps({ type: "truths" })}
              />
            ) : (
              <NoteCard
                key={card.id}
                icon={
                  card.icon?.key ? (
                    <WorldCategoryIcon icon={card.icon} size="small" />
                  ) : (
                    <FolderIcon />
                  )
                }
                title={card.name}
                subtitle={
                  entriesLoading
                    ? undefined
                    : t("worlds.categories.entry-count", "{{count}} entries", {
                        count: entryCounts[card.id] ?? 0,
                        defaultValue_one: "{{count}} entry",
                      })
                }
                link={linkProps({ type: "category", categoryId: card.id })}
              />
            ),
          )}
        </Grid>
      )}
    </Box>
  );
}
