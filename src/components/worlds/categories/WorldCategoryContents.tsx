import {
  Alert,
  Box,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { useUID } from "stores/auth.store";

import { WorldPermission } from "repositories/shared.types";

import { IWorldCategory } from "services/worldCategories.service";
import {
  IWorldEntry,
  WorldEntriesService,
} from "services/worldEntries.service";

export function WorldCategoryContents({
  category,
  permission,
}: {
  category: IWorldCategory;
  permission: WorldPermission | null;
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
  return (
    <Box
      role="tabpanel"
      id={`world-category-panel-${category.id}`}
      aria-labelledby={`world-category-tab-${category.id}`}
      sx={{ py: 4 }}
    >
      {error ? (
        <Alert severity="error">
          {t(
            "worlds.categories.entries-error",
            "Could not load this category. Please reopen it to try again.",
          )}
        </Alert>
      ) : loading ? (
        <CircularProgress size={24} />
      ) : visible.length === 0 ? (
        <Typography color="text.secondary" textAlign="center">
          {t(
            "worlds.categories.no-entries",
            "No entries in this category yet.",
          )}
        </Typography>
      ) : (
        <List>
          {visible.map((entry) => (
            <ListItem key={entry.id}>
              <ListItemText primary={entry.name} />
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );
}
