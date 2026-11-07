import { Datasworn } from "@datasworn-community/core";
import RollIcon from "@mui/icons-material/Casino";
import { Box, Paper, Typography } from "@mui/material";
import { useId, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { create } from "zustand";

import { ConditionMeter } from "components/datasworn/ConditonMeter";
import { Stat } from "components/datasworn/Stat";

import { useRollStatAndAddToLog } from "pages/games/hooks/useRollStatAndAddToLog";

import {
  useConditionMeterRules,
  useSpecialTrackRules,
  useStatRules,
} from "stores/dataswornTree.store";

import { MAX_PROGRESS_SCORE } from "lib/progressTrack.lib";

import { getReferenceRollOptions } from "../data/referenceRollOptions";
import { useRollReferenceProgress } from "../hooks/useRollReferenceProgress";

// The values set for each stat, meter and progress score, kept for the
// session so rolling one move and then another doesn't mean setting Wits
// twice. Not persisted.
const useReferenceRollValues = create<{
  values: Record<string, number>;
  setValue: (key: string, value: number) => void;
}>()((set) => ({
  values: {},
  setValue: (key, value) =>
    set((state) => ({ values: { ...state.values, [key]: value } })),
}));

const PROGRESS_KEY = "progress";
const SPECIAL_TRACK_KEY_PREFIX = "special_track:";
const MAX_STAT_VALUE = 10;

export interface ReferenceMoveRollsProps {
  move: Datasworn.AnyMove;
}

export function ReferenceMoveRolls(props: ReferenceMoveRollsProps) {
  const { move } = props;
  const { t } = useTranslation();
  const headingId = useId();

  const statRules = useStatRules();
  const conditionMeterRules = useConditionMeterRules();
  const specialTrackRules = useSpecialTrackRules();

  const rollOptions = useMemo(
    () =>
      getReferenceRollOptions(
        move,
        statRules,
        conditionMeterRules,
        specialTrackRules,
      ),
    [move, statRules, conditionMeterRules, specialTrackRules],
  );

  const values = useReferenceRollValues((state) => state.values);
  const setValue = useReferenceRollValues((state) => state.setValue);

  const [adds, setAdds] = useState(0);

  const rollStat = useRollStatAndAddToLog();
  const rollProgress = useRollReferenceProgress();

  if (rollOptions.kind === "none") return null;

  const rollAction = {
    ActionIcon: RollIcon,
    actionLabel: t("datasworn.roll", "Roll"),
  };

  let content: React.ReactNode = null;

  if (rollOptions.kind === "action") {
    // The same boxes as a character's sheet: set a value with - and +, then
    // press it to roll.
    content = (
      <Box display="flex" flexWrap="wrap" gap={1}>
        {rollOptions.options.map((option) => {
          const value =
            option.fixedValue ?? values[option.key] ?? option.defaultValue;
          const roll = () => {
            rollStat({
              statId: option.statId,
              statLabel: option.label,
              statModifier: value,
              adds,
              moveId: move._id,
              momentum: 0,
            });
            setAdds(0);
          };
          return option.fixedValue !== undefined ? (
            <Stat
              key={option.key}
              label={option.label}
              value={value}
              action={rollAction}
              onActionClick={roll}
            />
          ) : (
            <ConditionMeter
              key={option.key}
              label={option.label}
              defaultValue={option.defaultValue}
              value={value}
              min={0}
              max={MAX_STAT_VALUE}
              onChange={(next) => setValue(option.key, next)}
              action={rollAction}
              onActionClick={roll}
            />
          );
        })}
        <ConditionMeter
          label={t("character.character-sidebar.adds", "Adds")}
          defaultValue={0}
          value={adds}
          min={-9}
          max={9}
          onChange={setAdds}
        />
      </Box>
    );
  } else {
    const tracks =
      rollOptions.kind === "special_track"
        ? rollOptions.tracks.map((track) => ({
            key: `${SPECIAL_TRACK_KEY_PREFIX}${track.key}`,
            label: track.label,
            specialTrack: track,
          }))
        : [
            {
              key: PROGRESS_KEY,
              label: t("reference.roll.progress", "Progress"),
              specialTrack: undefined,
            },
          ];

    content = (
      <Box display="flex" flexWrap="wrap" gap={1}>
        {tracks.map((track) => {
          const score = values[track.key] ?? 0;
          return (
            <ConditionMeter
              key={track.key}
              label={track.label}
              defaultValue={0}
              value={score}
              min={0}
              max={MAX_PROGRESS_SCORE}
              onChange={(next) => setValue(track.key, next)}
              action={rollAction}
              onActionClick={() =>
                rollProgress({
                  moveId: move._id,
                  moveName: move.name,
                  progressScore: score,
                  trackType:
                    rollOptions.kind === "progress"
                      ? rollOptions.trackType
                      : undefined,
                  specialTrack: track.specialTrack,
                })
              }
            />
          );
        })}
      </Box>
    );
  }

  return (
    <Paper
      variant="outlined"
      component="section"
      aria-labelledby={headingId}
      sx={{ p: 2, mb: 2, display: "flex", flexDirection: "column", gap: 1.5 }}
    >
      <Box>
        <Typography
          id={headingId}
          variant="h6"
          component="h3"
          fontFamily={(theme) => theme.typography.fontFamilyTitle}
        >
          {t("reference.roll.heading", "Roll this move")}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {rollOptions.kind === "action"
            ? t(
                "reference.roll.action-help",
                "Set your character's values with − and +, then press one to roll. Nothing is saved.",
              )
            : t(
                "reference.roll.progress-help",
                "Set your progress score with − and +, then press it to roll against the challenge dice. Nothing is saved.",
              )}
        </Typography>
      </Box>
      {content}
    </Paper>
  );
}
