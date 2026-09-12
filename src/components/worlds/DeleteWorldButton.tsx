import DeleteIcon from "@mui/icons-material/Delete";
import { Button } from "@mui/material";
import { useConfirm } from "material-ui-confirm";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";

import { useWorldStore } from "stores/world.store";

import { WorldsService } from "services/worlds.service";

export interface DeleteWorldButtonProps {
  worldId: string;
  worldName: string;
  onDeleted?: () => void;
}

export function DeleteWorldButton(props: DeleteWorldButtonProps) {
  const { worldId, worldName, onDeleted } = props;

  const { t } = useTranslation();
  const confirm = useConfirm();

  const deleteWorld = useWorldStore((store) => store.deleteWorld);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = useCallback(() => {
    setDeleting(true);
    // games.world_id is ON DELETE SET NULL, so linked games lose their world
    // silently. This confirmation is the only warning anyone gets.
    WorldsService.countGamesLinkedToWorld(worldId)
      .then((linkedGameCount) => {
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

        return confirm({
          title: t("worlds.panel.delete-world", "Delete World"),
          description,
          confirmationText: t("common.delete", "Delete"),
        });
      })
      .then((result) => {
        if (!result?.confirmed) {
          setDeleting(false);
          return;
        }
        deleteWorld(worldId)
          .then(() => {
            onDeleted?.();
          })
          .catch(() => {
            setDeleting(false);
          });
      })
      .catch(() => {
        setDeleting(false);
      });
  }, [confirm, t, worldId, worldName, deleteWorld, onDeleted]);

  return (
    <Button
      color="error"
      variant="outlined"
      startIcon={<DeleteIcon />}
      disabled={deleting}
      onClick={handleDelete}
    >
      {t("worlds.panel.delete-world", "Delete World")}
    </Button>
  );
}
