import { Box, LinearProgress, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

import { EmptyState } from "components/Layout/EmptyState";

import { useListenToWorld, useWorldStore } from "stores/world.store";

import { getWorldSettingLabel } from "lib/worldSettings";

import { WorldPermission } from "repositories/shared.types";

import { DeleteWorldButton } from "./DeleteWorldButton";
import { WorldNameField } from "./WorldNameField";

export interface WorldPanelProps {
  worldId: string;
  // Called after the world has been deleted, so the surrounding surface can
  // navigate away (the standalone page goes back to the world list).
  onWorldDeleted?: () => void;
  // `useListenToWorld` does not de-duplicate, and its cleanup resets the whole
  // world store, so only one mounted component may own the subscription. Set
  // this to false when a surrounding surface already listens to this world.
  manageSubscription?: boolean;
}

// Owns the world subscription (unless `manageSubscription` is false) and renders the world's content without any
// page chrome, so the same panel can back the standalone world page and the
// in-game world tab.
export function WorldPanel(props: WorldPanelProps) {
  const { worldId, onWorldDeleted, manageSubscription = true } = props;

  const { t } = useTranslation();

  useListenToWorld(manageSubscription ? worldId : undefined);

  const world = useWorldStore((store) => store.world);
  const loading = useWorldStore((store) => store.loading);
  const error = useWorldStore((store) => store.error);
  const worldDeleted = useWorldStore((store) => store.worldDeleted);
  const worldPermission = useWorldStore((store) => store.worldPermission);

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

  if (loading) {
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

  const canEdit =
    worldPermission === WorldPermission.Owner ||
    worldPermission === WorldPermission.Editor;
  const isOwner = worldPermission === WorldPermission.Owner;

  const settingLabel = world.settingKey
    ? getWorldSettingLabel(world.settingKey)
    : t("worlds.panel.no-setting", "No setting");

  return (
    <Box>
      {canEdit ? (
        <WorldNameField worldId={worldId} name={world.name} />
      ) : (
        <Typography
          variant="h4"
          component="h1"
          fontFamily={(theme) => theme.typography.fontFamilyTitle}
          textTransform="uppercase"
        >
          {world.name}
        </Typography>
      )}
      <Typography color="text.secondary" sx={{ mt: 1 }}>
        {t("worlds.panel.setting", "Setting: {{settingLabel}}", {
          settingLabel,
        })}
      </Typography>
      {isOwner && (
        <Box sx={{ mt: 4 }}>
          <DeleteWorldButton
            worldId={worldId}
            worldName={world.name}
            onDeleted={onWorldDeleted}
          />
        </Box>
      )}
    </Box>
  );
}
