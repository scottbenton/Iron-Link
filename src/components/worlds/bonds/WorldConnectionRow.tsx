import CheckIcon from "@mui/icons-material/Check";
import MoreIcon from "@mui/icons-material/MoreVert";
import {
  Box,
  Checkbox,
  Divider,
  FormControlLabel,
  IconButton,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  Menu,
  MenuItem,
  Tooltip,
} from "@mui/material";
import { useId, useState } from "react";
import { useTranslation } from "react-i18next";

import type { NavigationLinkProps } from "components/LinkComponent";
import { ProgressTrack } from "components/datasworn/ProgressTrack";

import { CONNECTION_PROGRESS_TICKS, WorldBondMove } from "lib/worldBonds.lib";

import { Difficulty } from "repositories/tracks.repository";

import type { IWorldEntryConnection } from "services/worldEntryBonds.service";

import { ConnectionRollButton } from "./ConnectionRollButton";
import { CONNECTION_RANKS, getRankLabel } from "./worldBondLabels";

export interface WorldConnectionMenuAction {
  key: string;
  label: string;
  onClick: () => void;
}

// One connection: its rank and track (whose + marks progress by the rank),
// the rules' connection roll (Starforged's Forge a Bond, for people who let
// the app roll) and Bonded, which anyone who rolled their own dice ticks by
// hand. Its menu changes the rank and adds or removes the characters who
// share it. Everything sits within the track's width.
export function WorldConnectionRow({
  connection,
  label,
  labelLinkProps,
  description,
  canEdit,
  connectionMoves,
  onRollMove,
  onTicksChange,
  onBondedChange,
  onRankChange,
  memberActions,
}: {
  connection: IWorldEntryConnection;
  // The track's name, read with its rank: who shares it, or the entry.
  label: string;
  // Makes the label a link, such as to the entry from the character sheet.
  labelLinkProps?: NavigationLinkProps;
  description?: string;
  canEdit: boolean;
  // Progress moves to roll against the connection, by name.
  connectionMoves: WorldBondMove[];
  onRollMove: (moveId: string) => void;
  onTicksChange: (ticks: number) => void;
  onBondedChange: (bonded: boolean) => void;
  onRankChange: (rank: Difficulty) => void;
  // Adding and removing characters, shown first in the menu.
  memberActions: WorldConnectionMenuAction[];
}) {
  const { t } = useTranslation();
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const menuId = useId();
  const step = CONNECTION_PROGRESS_TICKS[connection.rank];
  const closeMenu = () => setMenuAnchor(null);
  // Someone who edits none of its members may still add a character of theirs.
  const hasMenu = canEdit || memberActions.length > 0;

  return (
    <Box sx={{ width: "fit-content", maxWidth: "100%" }}>
      <ProgressTrack
        label={label}
        labelLinkProps={labelLinkProps}
        description={description}
        difficulty={connection.rank}
        trackType={t("worlds.bonds.connection", "connection")}
        value={connection.ticks}
        step={step}
        onChange={canEdit ? onTicksChange : undefined}
      />
      {hasMenu ? (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            flexWrap: "wrap",
            columnGap: 2,
            mt: 1,
          }}
        >
          {canEdit ? (
            <ConnectionRollButton moves={connectionMoves} onRoll={onRollMove} />
          ) : (
            connection.bonded && <BondedNote />
          )}
          {canEdit && (
            <FormControlLabel
              control={
                <Checkbox
                  checked={connection.bonded}
                  onChange={(_, checked) => onBondedChange(checked)}
                />
              }
              label={t("worlds.bonds.bonded", "Bonded")}
              sx={{ mx: 0 }}
            />
          )}
          <Tooltip
            title={t("worlds.bonds.connection-options", "Connection options")}
          >
            <IconButton
              aria-label={t(
                "worlds.bonds.connection-options-named",
                "Connection options: {{label}}",
                { label },
              )}
              aria-haspopup="menu"
              aria-controls={menuAnchor ? menuId : undefined}
              aria-expanded={menuAnchor ? true : undefined}
              onClick={(event) => setMenuAnchor(event.currentTarget)}
              sx={{ ml: "auto" }}
            >
              <MoreIcon />
            </IconButton>
          </Tooltip>
          <Menu
            id={menuId}
            anchorEl={menuAnchor}
            open={!!menuAnchor}
            onClose={closeMenu}
          >
            {memberActions.map((action) => (
              <MenuItem
                key={action.key}
                onClick={() => {
                  closeMenu();
                  action.onClick();
                }}
              >
                {action.label}
              </MenuItem>
            ))}
            {canEdit && memberActions.length > 0 && <Divider />}
            {canEdit && (
              <ListSubheader>{t("worlds.bonds.rank", "Rank")}</ListSubheader>
            )}
            {canEdit &&
              CONNECTION_RANKS.map((rank) => (
                <MenuItem
                  key={rank}
                  role="menuitemradio"
                  aria-checked={rank === connection.rank}
                  onClick={() => {
                    closeMenu();
                    if (rank !== connection.rank) onRankChange(rank);
                  }}
                >
                  <ListItemIcon>
                    {rank === connection.rank && <CheckIcon fontSize="small" />}
                  </ListItemIcon>
                  <ListItemText>{getRankLabel(rank, t)}</ListItemText>
                </MenuItem>
              ))}
          </Menu>
        </Box>
      ) : (
        connection.bonded && (
          <Box sx={{ mt: 0.5 }}>
            <BondedNote />
          </Box>
        )
      )}
    </Box>
  );
}

function BondedNote() {
  const { t } = useTranslation();
  return (
    <Box component="span" sx={{ typography: "body2", color: "text.secondary" }}>
      {t("worlds.bonds.bonded-note", "Bonded")}
    </Box>
  );
}
