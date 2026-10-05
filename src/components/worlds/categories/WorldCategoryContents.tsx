import { Alert, Box, LinearProgress } from "@mui/material";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { EmptyState } from "components/Layout/EmptyState";

import { useUID } from "stores/auth.store";

import { WorldPermission } from "repositories/shared.types";

import { IWorldCategory } from "services/worldCategories.service";
import {
  IWorldEntry,
  WorldEntriesService,
} from "services/worldEntries.service";

import { WorldCategoryEntryItem } from "./WorldCategoryEntryItem";

export function WorldCategoryContents({
  category,
  permission,
  search,
}: {
  category: IWorldCategory;
  permission: WorldPermission | null;
  search: string;
}) {
  const { t } = useTranslation();
  const uid = useUID();
  const scope = `${category.worldId}:${permission}:${uid}`;
  const [snapshot, setSnapshot] = useState<{
    scope: string;
    entries: Record<string, IWorldEntry>;
    error: boolean;
  }>();
  const loading = snapshot?.scope !== scope;
  const error = !loading && snapshot.error;
  const entries = !loading ? snapshot.entries : {};
  useEffect(() => {
    if (!permission) return;
    let current = true;
    const unsubscribe = WorldEntriesService.listenToWorldEntries(
      uid,
      category.worldId,
      permission,
      (changed, removed, replace) => {
        if (!current) return;
        setSnapshot((previous) => {
          const next = {
            ...(replace || previous?.scope !== scope ? {} : previous.entries),
            ...changed,
          };
          removed.forEach((id) => delete next[id]);
          return { scope, entries: next, error: false };
        });
      },
      () => {
        if (current) setSnapshot({ scope, entries: {}, error: true });
      },
    );
    return () => {
      current = false;
      unsubscribe();
    };
  }, [category.worldId, permission, uid, scope]);
  const visible = Object.values(entries)
    .filter((entry) => entry.categoryId === category.id)
    .sort((a, b) => a.name.localeCompare(b.name));
  const filtered = visible.filter((entry) =>
    entry.name.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()),
  );
  return (
    <Box
      component="section"
      aria-label={t("worlds.categories.entries", "{{category}} entries", {
        category: category.name,
      })}
    >
      {error ? (
        <Alert severity="error">
          {t(
            "worlds.categories.entries-error",
            "Could not load this category. Please reopen it to try again.",
          )}
        </Alert>
      ) : loading ? (
        <LinearProgress
          aria-label={t("worlds.categories.loading-entries", "Loading entries")}
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          title={
            visible.length === 0
              ? t("worlds.categories.no-entries-title", "No entries yet")
              : undefined
          }
          message={
            visible.length === 0
              ? t(
                  "worlds.categories.no-entries",
                  "No entries in this category yet.",
                )
              : t(
                  "worlds.categories.no-search-results",
                  "No entries match your search.",
                )
          }
          sx={{ py: 4 }}
        />
      ) : (
        <Box component="ul" sx={{ listStyle: "none", p: 0, m: 0 }}>
          {filtered.map((entry) => (
            <WorldCategoryEntryItem key={entry.id} entry={entry} />
          ))}
        </Box>
      )}
    </Box>
  );
}
