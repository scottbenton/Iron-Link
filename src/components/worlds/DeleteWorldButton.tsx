import DeleteIcon from "@mui/icons-material/Delete";
import { Alert, Button, Stack } from "@mui/material";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { useWorldStore } from "stores/world.store";

import { WorldsService } from "services/worlds.service";

import { WorldConfigurationDeleteDialog } from "./categories/WorldConfigurationDeleteDialog";
import { useWorldConfigurationDeleteConfirmation } from "./categories/useWorldConfigurationDeleteConfirmation";

export interface DeleteWorldButtonProps {
  worldId: string;
  worldName: string;
  onDeleted?: () => void;
}

export function DeleteWorldButton(props: DeleteWorldButtonProps) {
  const { worldId, worldName, onDeleted } = props;

  const { t } = useTranslation();
  const { confirm, request, answer } =
    useWorldConfigurationDeleteConfirmation();

  const deleteWorld = useWorldStore((store) => store.deleteWorld);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string>();
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const handleDelete = async () => {
    setDeleting(true);
    setError(undefined);
    try {
      // Deletion unlinks every connected game; obtain the count before asking.
      const linkedGameCount =
        await WorldsService.countGamesLinkedToWorld(worldId);
      if (!mounted.current) return;
      const description =
        linkedGameCount === 0
          ? t(
              "worlds.panel.delete-world-confirmation",
              'Are you sure you want to delete "{{worldName}}"? This cannot be undone.',
              { worldName },
            )
          : linkedGameCount === 1
            ? t(
                "worlds.panel.delete-world-confirmation-one-game",
                'Are you sure you want to delete "{{worldName}}"? 1 game is linked to this world and will be unlinked. This cannot be undone.',
                { worldName },
              )
            : t(
                "worlds.panel.delete-world-confirmation-many-games",
                'Are you sure you want to delete "{{worldName}}"? {{linkedGameCount}} games are linked to this world and will be unlinked. This cannot be undone.',
                { worldName, linkedGameCount },
              );

      const result = await confirm({
        title: t("worlds.panel.delete-world", "Delete World"),
        description,
        confirmationText: t("common.delete", "Delete"),
      });
      if (!result.confirmed || !mounted.current) return;
      await deleteWorld(worldId);
      onDeleted?.();
    } catch {
      if (mounted.current) {
        setError(
          t(
            "worlds.panel.delete-world-error",
            "Could not delete this world. Please try again.",
          ),
        );
      }
    } finally {
      if (mounted.current) setDeleting(false);
    }
  };

  return (
    <Stack spacing={1} alignItems="flex-start">
      {error && <Alert severity="error">{error}</Alert>}
      <Button
        color="error"
        variant="outlined"
        startIcon={<DeleteIcon />}
        disabled={deleting}
        onClick={handleDelete}
      >
        {t("worlds.panel.delete-world", "Delete World")}
      </Button>
      <WorldConfigurationDeleteDialog request={request} onAnswer={answer} />
    </Stack>
  );
}
