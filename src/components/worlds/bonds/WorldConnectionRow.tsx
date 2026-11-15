import DeleteIcon from "@mui/icons-material/DeleteOutline";
import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  IconButton,
  Tooltip,
} from "@mui/material";
import { useConfirm } from "material-ui-confirm";
import { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { ProgressTrack } from "components/datasworn/ProgressTrack";

import { MAX_TICKS } from "lib/progressTrack.lib";
import { CONNECTION_PROGRESS_TICKS } from "lib/worldBonds.lib";

import type { IWorldEntryBond } from "services/worldEntryBonds.service";

// One Starforged connection: its rank and track, Mark progress, Forge a bond
// (a progress roll, for people who let the app roll) and Bonded, which anyone
// who rolled their own dice ticks by hand. The entry lists one per character;
// the character sheet one per entry.
export function WorldConnectionRow({
  connection,
  label,
  title,
  canEdit,
  onTicksChange,
  onForgeBond,
  onBondedChange,
  onRemove,
}: {
  connection: IWorldEntryBond;
  // The track's name, read with its rank: the character or the entry.
  label: string;
  // Shown in place of the label, such as a link to the entry.
  title?: ReactNode;
  canEdit: boolean;
  onTicksChange: (ticks: number) => void;
  onForgeBond?: () => void;
  onBondedChange: (bonded: boolean) => void;
  onRemove: () => void;
}) {
  const { t } = useTranslation();
  const confirm = useConfirm();
  const step = connection.rank ? CONNECTION_PROGRESS_TICKS[connection.rank] : 1;

  const remove = () => {
    confirm({
      title: t("worlds.bonds.remove-title", "Remove connection?"),
      description:
        connection.ticks > 0 || connection.bonded
          ? t(
              "worlds.bonds.remove-progress",
              "This removes {{label}} and its progress. Your Bonds track keeps anything already marked.",
              { label },
            )
          : t("worlds.bonds.remove-description", "This removes {{label}}.", {
              label,
            }),
      confirmationText: t("worlds.bonds.remove", "Remove"),
    })
      .then(({ confirmed }) => {
        if (confirmed) onRemove();
      })
      .catch(() => {});
  };

  return (
    <Box>
      {title}
      <ProgressTrack
        label={label}
        difficulty={connection.rank ?? undefined}
        trackType={t("worlds.bonds.connection", "connection")}
        value={connection.ticks}
        step={step}
        onChange={canEdit ? onTicksChange : undefined}
      />
      {canEdit && (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 1,
            mt: 1,
          }}
        >
          <Button
            variant="outlined"
            color="inherit"
            size="small"
            disabled={connection.ticks >= MAX_TICKS}
            onClick={() =>
              onTicksChange(Math.min(MAX_TICKS, connection.ticks + step))
            }
          >
            {t("worlds.bonds.mark-progress", "Mark progress")}
          </Button>
          {onForgeBond && (
            <Button
              variant="outlined"
              color="inherit"
              size="small"
              onClick={onForgeBond}
            >
              {t("worlds.bonds.forge", "Forge a bond")}
            </Button>
          )}
          <FormControlLabel
            control={
              <Checkbox
                checked={connection.bonded}
                onChange={(_, checked) => onBondedChange(checked)}
              />
            }
            label={t("worlds.bonds.bonded", "Bonded")}
            sx={{ ml: 0 }}
          />
          <Box sx={{ flexGrow: 1 }} />
          <Tooltip
            title={t("worlds.bonds.remove-connection", "Remove connection")}
          >
            <IconButton
              aria-label={t(
                "worlds.bonds.remove-named",
                "Remove connection: {{label}}",
                { label },
              )}
              onClick={remove}
            >
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </Box>
      )}
      {!canEdit && connection.bonded && (
        <Box sx={{ mt: 0.5, typography: "body2", color: "text.secondary" }}>
          {t("worlds.bonds.bonded-note", "Bonded")}
        </Box>
      )}
    </Box>
  );
}
