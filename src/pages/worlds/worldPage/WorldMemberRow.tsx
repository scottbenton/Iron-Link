import DeleteIcon from "@mui/icons-material/DeleteOutline";
import {
  IconButton,
  ListItem,
  ListItemText,
  MenuItem,
  TextField,
  Tooltip,
} from "@mui/material";
import { useTranslation } from "react-i18next";

import { useUID } from "stores/auth.store";
import { useUserName } from "stores/users.store";
import { useWorldStore } from "stores/world.store";

import { IWorldPlayer, WorldPlayerRole } from "services/worldPlayers.service";

export interface WorldMemberRowProps {
  worldId: string;
  player: IWorldPlayer;
  isCurrentUserOwner: boolean;
}

export function WorldMemberRow(props: WorldMemberRowProps) {
  const { worldId, player, isCurrentUserOwner } = props;
  const { t } = useTranslation();

  const uid = useUID();
  const name = useUserName(player.userId);

  const updateWorldPlayerRole = useWorldStore(
    (store) => store.updateWorldPlayerRole,
  );
  const removeWorldPlayer = useWorldStore((store) => store.removeWorldPlayer);

  const isSelf = player.userId === uid;
  const isOwnerRow = player.role === WorldPlayerRole.Owner;

  const roleLabels: Record<WorldPlayerRole, string> = {
    [WorldPlayerRole.Owner]: t("worlds.roles.owner", "Owner"),
    [WorldPlayerRole.Editor]: t("worlds.roles.editor", "Editor"),
    [WorldPlayerRole.Viewer]: t("worlds.roles.viewer", "Viewer"),
  };

  // Owners can manage other members' roles; owner rows stay fixed so a world
  // always keeps its owner (ownership transfer is not supported).
  const canEditRole = isCurrentUserOwner && !isOwnerRow;
  const canRemove =
    (isCurrentUserOwner && !isOwnerRow) || (isSelf && !isOwnerRow);

  return (
    <ListItem
      secondaryAction={
        canRemove ? (
          <Tooltip
            title={
              isSelf
                ? t("worlds.members.leave", "Leave World")
                : t("worlds.members.remove", "Remove Member")
            }
          >
            <IconButton
              edge="end"
              onClick={() =>
                removeWorldPlayer(worldId, player.userId).catch(() => {})
              }
            >
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        ) : undefined
      }
    >
      <ListItemText primary={name} sx={{ mr: 2 }} />
      {canEditRole ? (
        <TextField
          select
          size="small"
          value={player.role}
          onChange={(evt) =>
            updateWorldPlayerRole(
              worldId,
              player.userId,
              evt.target.value as WorldPlayerRole,
            ).catch(() => {})
          }
          sx={{ minWidth: 120 }}
        >
          <MenuItem value={WorldPlayerRole.Editor}>
            {roleLabels[WorldPlayerRole.Editor]}
          </MenuItem>
          <MenuItem value={WorldPlayerRole.Viewer}>
            {roleLabels[WorldPlayerRole.Viewer]}
          </MenuItem>
        </TextField>
      ) : (
        <ListItemText
          secondary={roleLabels[player.role]}
          sx={{ flexGrow: 0 }}
        />
      )}
    </ListItem>
  );
}
