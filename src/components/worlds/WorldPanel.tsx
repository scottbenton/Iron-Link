import { LinearProgress } from "@mui/material";
import { ReactNode, useCallback, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

import type { BreadcrumbItem } from "components/Layout/BreadcrumbTrail";
import { EmptyState } from "components/Layout/EmptyState";

import { useListenToWorld, useWorldStore } from "stores/world.store";
import { useListenToWorldCategories } from "stores/worldCategories.store";

import { WorldWorkspace } from "./WorldWorkspace";
import type { WorldNavigation } from "./worldNavigation";

export interface WorldPanelProps {
  worldId: string;
  navigation: WorldNavigation;
  rootBreadcrumb?: BreadcrumbItem;
  // Called after the world has been deleted, so the surrounding surface can
  // navigate away (the standalone page goes back to the world list).
  onWorldDeleted?: () => void;
  // `useListenToWorld` does not de-duplicate, and its cleanup resets the whole
  // world store, so only one mounted component may own the subscription. Set
  // this to false when a surrounding surface already listens to this world.
  manageSubscription?: boolean;
  additionalSettings?: ReactNode;
}

// Owns the world subscription (unless `manageSubscription` is false) and renders the world's content without any
// page chrome, so the same panel can back the standalone world page and the
// in-game world tab.
export function WorldPanel(props: WorldPanelProps) {
  const {
    worldId,
    onWorldDeleted,
    manageSubscription = true,
    additionalSettings,
    navigation,
    rootBreadcrumb,
  } = props;

  const { t } = useTranslation();
  // The workspace can disappear on the realtime delete event before its
  // request finishes. Keep completion here, scoped to the panel's current world.
  const activeWorld = useRef({ worldId, onWorldDeleted, mounted: true });
  activeWorld.current = { ...activeWorld.current, worldId, onWorldDeleted };
  useEffect(() => {
    activeWorld.current.mounted = true;
    return () => {
      activeWorld.current.mounted = false;
    };
  }, []);
  const handleWorldDeleted = useCallback(() => {
    const current = activeWorld.current;
    if (current.mounted && current.worldId === worldId)
      current.onWorldDeleted?.();
  }, [worldId]);

  useListenToWorld(manageSubscription ? worldId : undefined);
  useListenToWorldCategories(manageSubscription ? worldId : undefined);

  const storedWorldId = useWorldStore((store) => store.worldId);
  const world = useWorldStore((store) => store.world);
  const loading = useWorldStore((store) => store.loading);
  const error = useWorldStore((store) => store.error);
  const worldDeleted = useWorldStore((store) => store.worldDeleted);
  const worldPermission = useWorldStore((store) => store.worldPermission);

  if (storedWorldId !== worldId) return <LinearProgress />;

  if (worldDeleted) {
    return (
      <EmptyState
        title={t("worlds.panel.world-deleted-title", "World Deleted")}
        message={t(
          "worlds.panel.world-deleted",
          "This world has been deleted.",
        )}
        sx={{ mt: 4 }}
      />
    );
  }

  if (loading || (world && world.id !== worldId)) {
    return <LinearProgress />;
  }

  if (error || !world) {
    return (
      <EmptyState
        message={
          error ??
          t("worlds.panel.error-loading-world", "Failed to load this world.")
        }
        sx={{ mt: 4 }}
      />
    );
  }

  return (
    <WorldWorkspace
      key={worldId}
      world={world}
      permission={worldPermission}
      onWorldDeleted={handleWorldDeleted}
      additionalSettings={additionalSettings}
      navigation={navigation}
      rootBreadcrumb={rootBreadcrumb}
    />
  );
}
