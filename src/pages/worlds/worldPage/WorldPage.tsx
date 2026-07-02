import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  LinearProgress,
  List,
  TextField,
  Typography,
} from "@mui/material";
import { useConfirm } from "material-ui-confirm";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router";

import { PageContent, PageHeader } from "components/Layout";
import { EmptyState } from "components/Layout/EmptyState";

import { pathConfig } from "pages/pathConfig";

import {
  PageCategory,
  useSendPageViewEvent,
} from "hooks/useSendPageViewEvents";

import { useListenToWorld, useWorldStore } from "stores/world.store";

import { WorldPermission } from "repositories/shared.types";

import { WorldPlayerRole } from "services/worldPlayers.service";

import { getWorldSettingLabel } from "../hooks/useWorldSettings";
import { WorldMemberRow } from "./WorldMemberRow";

export default function WorldPage() {
  const { t } = useTranslation();
  useSendPageViewEvent(PageCategory.World);

  const { worldId } = useParams<{ worldId: string }>();
  useListenToWorld(worldId);

  const navigate = useNavigate();
  const confirm = useConfirm();

  const world = useWorldStore((store) => store.world);
  const worldPlayers = useWorldStore((store) => store.worldPlayers);
  const worldPermission = useWorldStore((store) => store.worldPermission);
  const loading = useWorldStore((store) => store.loading);
  const error = useWorldStore((store) => store.error);
  const worldDeleted = useWorldStore((store) => store.worldDeleted);

  const updateWorldName = useWorldStore((store) => store.updateWorldName);
  const updateWorldDescription = useWorldStore(
    (store) => store.updateWorldDescription,
  );
  const deleteWorld = useWorldStore((store) => store.deleteWorld);

  useEffect(() => {
    if (worldDeleted) {
      navigate(pathConfig.worldSelect);
    }
  }, [worldDeleted, navigate]);

  const canEditWorld =
    worldPermission === WorldPermission.Owner ||
    worldPermission === WorldPermission.Editor;
  const isOwner = worldPermission === WorldPermission.Owner;

  const [editedName, setEditedName] = useState<string | undefined>();
  const [editedDescription, setEditedDescription] = useState<
    string | undefined
  >();

  if (loading) {
    return <LinearProgress />;
  }

  if (error || !world || !worldId) {
    return (
      <PageContent>
        <EmptyState
          title={t("worlds.world.error-title", "World not found")}
          message={t(
            "worlds.world.error-description",
            "This world may have been deleted, or you may not have access to it.",
          )}
        />
      </PageContent>
    );
  }

  const settingLabel = getWorldSettingLabel(world.settingKey);

  const handleDelete = () => {
    confirm({
      title: t("worlds.world.delete-dialog-title", "Delete World"),
      description: t(
        "worlds.world.delete-dialog-description",
        "Are you sure you want to delete this world? All of its entries will be deleted as well. This cannot be undone.",
      ),
      confirmationText: t("common.delete", "Delete"),
    })
      .then(({ confirmed }) => {
        if (!confirmed) return;
        deleteWorld(worldId).catch(() => {});
      })
      .catch(() => {});
  };

  return (
    <>
      <PageHeader
        label={world.name}
        actions={
          isOwner ? (
            <Button color="error" variant="outlined" onClick={handleDelete}>
              {t("worlds.world.delete", "Delete World")}
            </Button>
          ) : undefined
        }
      />
      <PageContent>
        <Box display="flex" flexDirection="column" gap={3} maxWidth={800}>
          {settingLabel && (
            <Box>
              <Chip label={settingLabel} />
            </Box>
          )}

          {canEditWorld ? (
            <Card variant="outlined" sx={{ p: 2 }}>
              <Typography variant="h6" component="p" mb={2}>
                {t("worlds.world.details-header", "World Details")}
              </Typography>
              <Box display="flex" flexDirection="column" gap={2}>
                <TextField
                  label={t("worlds.world.name", "Name")}
                  value={editedName ?? world.name}
                  onChange={(evt) => setEditedName(evt.target.value)}
                  onBlur={() => {
                    const newName = editedName?.trim();
                    if (newName && newName !== world.name) {
                      updateWorldName(worldId, newName).catch(() => {});
                    }
                    setEditedName(undefined);
                  }}
                />
                <TextField
                  label={t("worlds.world.description", "Description")}
                  value={editedDescription ?? world.description ?? ""}
                  onChange={(evt) => setEditedDescription(evt.target.value)}
                  onBlur={() => {
                    if (
                      editedDescription !== undefined &&
                      editedDescription.trim() !== (world.description ?? "")
                    ) {
                      updateWorldDescription(
                        worldId,
                        editedDescription.trim() || null,
                      ).catch(() => {});
                    }
                    setEditedDescription(undefined);
                  }}
                  multiline
                  minRows={2}
                />
              </Box>
            </Card>
          ) : (
            world.description && (
              <Typography color="text.secondary">
                {world.description}
              </Typography>
            )
          )}

          <Card variant="outlined" sx={{ p: 2 }}>
            <Typography variant="h6" component="p">
              {t("worlds.world.members-header", "Members")}
            </Typography>
            <List>
              {Object.values(worldPlayers ?? {})
                .sort((a, b) => {
                  if (a.role === b.role)
                    return a.userId.localeCompare(b.userId);
                  return a.role === WorldPlayerRole.Owner ? -1 : 1;
                })
                .map((player) => (
                  <WorldMemberRow
                    key={player.userId}
                    worldId={worldId}
                    player={player}
                    isCurrentUserOwner={isOwner}
                  />
                ))}
            </List>
            {worldPermission &&
              worldPermission !== WorldPermission.None &&
              !Object.values(worldPlayers ?? {}).some(
                (p) => p.role !== WorldPlayerRole.Owner,
              ) && (
                <Alert severity="info">
                  {t(
                    "worlds.world.members-empty",
                    "Players in games linked to this world get access automatically — no invites needed.",
                  )}
                </Alert>
              )}
          </Card>
        </Box>
      </PageContent>
    </>
  );
}
