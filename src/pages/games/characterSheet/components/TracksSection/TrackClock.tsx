import { useState } from "react";
import { useTranslation } from "react-i18next";
import DieIcon from "@mui/icons-material/Casino";
import CheckIcon from "@mui/icons-material/Check";
import {
  Box,
  Button,
  Card,
  Chip,
  Link,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import { useConfirm } from "material-ui-confirm";

import { removeProgressTrack } from "api-calls/tracks/removeProgressTrack";
import { updateProgressTrack } from "api-calls/tracks/updateProgressTrack";
import { useSetAnnouncement } from "atoms/announcement.atom";
import { ClockCircle } from "components/datasworn/Clocks/ClockCircle";
import { askTheOracleEnumMap } from "data/askTheOracle";
import { EditOrCreateClockDialog } from "pages/games/characterSheet/components/TracksSection/EditOrCreateClockDialog";
import { useRollOracleAndAddToLog } from "pages/games/hooks/useRollOracleAndAddToLog";
import { AskTheOracle, Clock, TrackStatus } from "types/Track.type";

export interface TrackClockProps {
  clockId: string;
  clock: Clock;
  canEdit: boolean;
  gameId: string;
}

export function TrackClock(props: TrackClockProps) {
  const { clockId, clock, canEdit, gameId } = props;
  const { t } = useTranslation();

  const [editClockDialogOpen, setEditClockDialogOpen] = useState(false);

  const handleSelectedOracleChange = (oracleKey: AskTheOracle) => {
    updateProgressTrack({
      gameId,
      trackId: clockId,
      track: {
        ...clock,
        oracleKey,
      },
    }).catch(() => {});
  };

  const announce = useSetAnnouncement();

  const rollOracle = useRollOracleAndAddToLog();
  const handleProgressionRoll = () => {
    const oracleId =
      askTheOracleEnumMap[clock.oracleKey ?? AskTheOracle.AlmostCertain]._id;
    const { result } = rollOracle(oracleId);

    if (result?.result === "Yes") {
      const add = result.match ? 2 : 1;

      updateProgressTrack({
        gameId,
        trackId: clockId,
        track: {
          ...clock,
          value: clock.value + add,
        },
      }).catch(() => {});
      announce(
        t(
          "character.character-sidebar.tracks-clock-roll-progress-announcement-yes",
          "Clock {{clockLabel}} progressed by {{add}} segment(s) for a total of {{value}} of {{total}} segments",
          {
            clockLabel: clock.label,
            add,
            value: Math.min(clock.value + add, clock.segments),
            total: clock.segments,
          },
        ),
      );
    } else {
      announce(
        t(
          "character.character-sidebar.tracks-clock-roll-progress-announcement-no",
          "Clock {{clockLabel}} did not progress",
          { clockLabel: clock.label },
        ),
      );
    }
  };
  const onValueChange = (newSegments: number) => {
    announce(
      t(
        "character.character-sidebar.tracks-clock-roll-progress-announcement-manual",
        "Manually incremented clock {{clockLabel}} to {{value}} of {{total}} segments",
        { clockLabel: clock.label, value: newSegments, total: clock.segments },
      ),
    );
    updateProgressTrack({
      gameId,
      trackId: clockId,
      track: {
        ...clock,
        value: newSegments,
      },
    }).catch(() => {});
  };
  const handleStatusChange = (status: TrackStatus) => {
    updateProgressTrack({
      gameId,
      trackId: clockId,
      track: {
        ...clock,
        status,
      },
    }).catch(() => {});
  };

  const confirm = useConfirm();
  const handleDeleteClick = () => {
    confirm({
      description: t(
        "character.character-sidebar.tracks-delete-confirmation",
        "Are you sure you want to delete this clock? This action cannot be undone.",
      ),
      confirmationText: t("common.delete", "Delete"),
    })
      .then(() => {
        removeProgressTrack({ gameId, id: clockId }).catch(() => {});
      })
      .catch(() => {});
  };

  return (
    <>
      <Box display={"flex"} flexDirection={"column"} alignItems={"initial"}>
        <Typography
          lineHeight={"1em"}
          variant={"overline"}
          fontFamily="fontFamilyTitle"
        >
          {t("character.character-sidebar.tracks-clock", "Clock")}
        </Typography>
        <Box
          display={"flex"}
          alignItems={"center"}
          justifyContent="space-between"
        >
          <Typography fontFamily={"fontFamilyTitle"} variant={"h6"}>
            {clock.label}
            {clock.status === TrackStatus.Completed && (
              <Chip
                label={"Completed"}
                color={"success"}
                size={"small"}
                sx={{ ml: 1 }}
              />
            )}
          </Typography>
          {canEdit && (
            <Typography fontFamily="fontFamilyTitle">
              <Link
                color={"inherit"}
                component={"button"}
                sx={{ ml: 2 }}
                onClick={() => setEditClockDialogOpen(true)}
              >
                {t("common.edit", "Edit")}
              </Link>
            </Typography>
          )}
        </Box>
        {clock.description && (
          <Typography
            variant={"subtitle1"}
            color={"text.secondary"}
            whiteSpace={"pre-wrap"}
          >
            {clock.description}
          </Typography>
        )}
        <Card
          sx={(theme) => ({
            bgcolor:
              theme.palette.grey[theme.palette.mode === "light" ? 300 : 800],
            p: 1,
            display: "flex",
            alignItems: "center",
            flexWrap: "wrap",
            mt: 1,
          })}
          variant={"outlined"}
        >
          <Box
            display={"flex"}
            flexDirection={"column"}
            alignItems={"flex-start"}
            mr={2}
            minWidth={160}
          >
            <TextField
              label={t(
                "character.character-sidebar.tracks-clock-oracle-table",
                "Oracle Table",
              )}
              select
              disabled={!canEdit || clock.status === TrackStatus.Completed}
              value={clock.oracleKey ?? AskTheOracle.Likely}
              onChange={(evt) =>
                handleSelectedOracleChange(evt.target.value as AskTheOracle)
              }
              fullWidth
            >
              <MenuItem value={AskTheOracle.AlmostCertain}>
                {askTheOracleEnumMap[AskTheOracle.AlmostCertain].name}
              </MenuItem>
              <MenuItem value={AskTheOracle.Likely}>
                {askTheOracleEnumMap[AskTheOracle.Likely].name}
              </MenuItem>
              <MenuItem value={AskTheOracle.FiftyFifty}>
                {askTheOracleEnumMap[AskTheOracle.FiftyFifty].name}
              </MenuItem>
              <MenuItem value={AskTheOracle.Unlikely}>
                {askTheOracleEnumMap[AskTheOracle.Unlikely].name}
              </MenuItem>
              <MenuItem value={AskTheOracle.SmallChance}>
                {askTheOracleEnumMap[AskTheOracle.SmallChance].name}
              </MenuItem>
            </TextField>
            {canEdit && (
              <Button
                sx={{ mt: 1 }}
                color={"inherit"}
                endIcon={<DieIcon />}
                onClick={() => handleProgressionRoll()}
                disabled={
                  clock.status === TrackStatus.Completed ||
                  clock.value >= clock.segments
                }
              >
                {t(
                  "character.character-sidebar.tracks-clock-roll-progress",
                  "Roll Progress",
                )}
              </Button>
            )}
          </Box>
          <ClockCircle
            value={clock.value}
            segments={clock.segments}
            onClick={
              canEdit && clock.status !== TrackStatus.Completed
                ? () => {
                    onValueChange(
                      clock.value >= clock.segments ? 0 : clock.value + 1,
                    );
                  }
                : undefined
            }
          />
        </Card>
        <Box>
          {canEdit && clock.status === TrackStatus.Active && (
            <Button
              variant={"outlined"}
              color={"inherit"}
              onClick={() => handleStatusChange(TrackStatus.Completed)}
              sx={{ mt: 1 }}
              endIcon={<CheckIcon />}
            >
              {t(
                "character.character-sidebar.tracks-clock-complete-button",
                "Complete Clock",
              )}
            </Button>
          )}
          {canEdit && clock.status === TrackStatus.Completed && (
            <Button
              variant={"outlined"}
              color={"inherit"}
              onClick={() => handleStatusChange(TrackStatus.Active)}
              sx={{ mt: 1 }}
            >
              {t(
                "character.character-sidebar.tracks-clock-reopen-button",
                "Reopen Clock",
              )}
            </Button>
          )}
          {canEdit && clock.status === TrackStatus.Completed && (
            <Button color={"error"} sx={{ mt: 1 }} onClick={handleDeleteClick}>
              {t(
                "character.character-sidebar.tracks-clock-delete-button",
                "Delete Permanently",
              )}
            </Button>
          )}
        </Box>
      </Box>
      <EditOrCreateClockDialog
        open={editClockDialogOpen}
        handleClose={() => setEditClockDialogOpen(false)}
        initialClock={{
          clockId,
          clock,
        }}
      />
    </>
  );
}
