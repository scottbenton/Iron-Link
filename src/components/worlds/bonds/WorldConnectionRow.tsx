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
import { useTranslation } from "react-i18next";

import type { NavigationLinkProps } from "components/LinkComponent";
import { ProgressTrack } from "components/datasworn/ProgressTrack";

import { CONNECTION_PROGRESS_TICKS } from "lib/worldBonds.lib";

import type { IWorldEntryBond } from "services/worldEntryBonds.service";

// One Starforged connection: its rank and track (whose + marks progress by
// the rank), Forge a bond (a progress roll, for people who let the app roll)
// and Bonded, which anyone who rolled their own dice ticks by hand. The entry lists one per character;
// the character sheet one per entry.
export function WorldConnectionRow({
  connection,
  label,
  labelLinkProps,
  canEdit,
  onTicksChange,
  onForgeBond,
  onBondedChange,
  onRemove,
}: {
  connection: IWorldEntryBond;
  // The track's name, read with its rank: the character or the entry.
  label: string;
  // Makes the label a link, such as to the entry from the character sheet.
  labelLinkProps?: NavigationLinkProps;
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
    // As wide as the track, so the rank, the +/- buttons and the actions
    // line up with it instead of spreading across the page.
    <Box sx={{ width: "fit-content", maxWidth: "100%" }}>
      <ProgressTrack
        label={label}
        labelLinkProps={labelLinkProps}
        difficulty={connection.rank ?? undefined}
        trackType={t("worlds.bonds.connection", "connection")}
        value={connection.ticks}
        step={step}
        onChange={canEdit ? onTicksChange : undefined}
      />
      {canEdit ? (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            flexWrap: "wrap",
            columnGap: 2,
            mt: 1,
          }}
        >
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
            sx={{ mx: 0 }}
          />
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
              sx={{ ml: "auto" }}
            >
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </Box>
      ) : (
        connection.bonded && (
          <Box sx={{ mt: 0.5, typography: "body2", color: "text.secondary" }}>
            {t("worlds.bonds.bonded-note", "Bonded")}
          </Box>
        )
      )}
    </Box>
  );
}
