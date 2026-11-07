import { Datasworn } from "@datasworn-community/core";
import {
  Box,
  Button,
  Paper,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { useId, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { create } from "zustand";

import { useRollStatAndAddToLog } from "pages/games/hooks/useRollStatAndAddToLog";

import {
  useConditionMeterRules,
  useSpecialTrackRules,
  useStatRules,
} from "stores/dataswornTree.store";

import { MAX_PROGRESS_SCORE } from "lib/progressTrack.lib";

import {
  clampInteger,
  getReferenceRollOptions,
} from "../data/referenceRollOptions";
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

  const [selectedKey, setSelectedKey] = useState<string>();
  const [adds, setAdds] = useState(0);

  const rollStat = useRollStatAndAddToLog();
  const rollProgress = useRollReferenceProgress();

  if (rollOptions.kind === "none") return null;

  let content: React.ReactNode = null;

  if (rollOptions.kind === "action") {
    const selected =
      rollOptions.options.find((option) => option.key === selectedKey) ??
      rollOptions.options[0];
    const value =
      selected.fixedValue ?? values[selected.key] ?? selected.defaultValue;

    content = (
      <>
        <ToggleButtonGroup
          exclusive
          size="small"
          value={selected.key}
          onChange={(_, key: string | null) => key && setSelectedKey(key)}
          aria-label={t("reference.roll.roll-using", "Roll using")}
          sx={{ flexWrap: "wrap" }}
        >
          {rollOptions.options.map((option) => (
            <ToggleButton
              key={option.key}
              value={option.key}
              sx={{ textTransform: "capitalize" }}
            >
              {option.label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
        <Box display="flex" gap={1} flexWrap="wrap" alignItems="center">
          <TextField
            type="number"
            size="small"
            label={t("reference.roll.value", "Value")}
            value={value}
            disabled={selected.fixedValue !== undefined}
            onChange={(event) => {
              const next = clampInteger(event.target.value, -9, 10);
              if (next !== undefined) setValue(selected.key, next);
            }}
            slotProps={{ htmlInput: { min: -9, max: 10 } }}
            sx={{ width: 96 }}
          />
          <TextField
            type="number"
            size="small"
            label={t("reference.roll.adds", "Adds")}
            value={adds}
            onChange={(event) => {
              const next = clampInteger(event.target.value, -9, 10);
              if (next !== undefined) setAdds(next);
            }}
            slotProps={{ htmlInput: { min: -9, max: 10 } }}
            sx={{ width: 96 }}
          />
          <Button
            variant="contained"
            onClick={() => {
              rollStat({
                statId: selected.statId,
                statLabel: selected.label,
                statModifier: value,
                adds,
                moveId: move._id,
                momentum: 0,
              });
              setAdds(0);
            }}
            sx={{ textTransform: "none" }}
          >
            {t("reference.roll.roll-plus", "Roll +{{label}}", {
              label: selected.label,
            })}
          </Button>
        </Box>
      </>
    );
  } else {
    const score = values[PROGRESS_KEY] ?? 0;
    const specialTracks =
      rollOptions.kind === "special_track" ? rollOptions.tracks : undefined;
    const selectedTrack =
      specialTracks?.find((track) => track.key === selectedKey) ??
      specialTracks?.[0];

    content = (
      <>
        {specialTracks && specialTracks.length > 1 && (
          <ToggleButtonGroup
            exclusive
            size="small"
            value={selectedTrack?.key}
            onChange={(_, key: string | null) => key && setSelectedKey(key)}
            aria-label={t("reference.roll.track", "Track")}
            sx={{ flexWrap: "wrap" }}
          >
            {specialTracks.map((track) => (
              <ToggleButton
                key={track.key}
                value={track.key}
                sx={{ textTransform: "capitalize" }}
              >
                {track.label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        )}
        <Box display="flex" gap={1} flexWrap="wrap" alignItems="center">
          <TextField
            type="number"
            size="small"
            label={t("reference.roll.progress-score", "Progress score")}
            value={score}
            onChange={(event) => {
              const next = clampInteger(
                event.target.value,
                0,
                MAX_PROGRESS_SCORE,
              );
              if (next !== undefined) setValue(PROGRESS_KEY, next);
            }}
            slotProps={{ htmlInput: { min: 0, max: MAX_PROGRESS_SCORE } }}
            sx={{ width: 140 }}
          />
          <Button
            variant="contained"
            onClick={() =>
              rollProgress({
                moveId: move._id,
                moveName: move.name,
                progressScore: score,
                trackType:
                  rollOptions.kind === "progress"
                    ? rollOptions.trackType
                    : undefined,
                specialTrack: selectedTrack,
              })
            }
            sx={{ textTransform: "none" }}
          >
            {t("reference.roll.roll-progress", "Roll progress")}
          </Button>
        </Box>
      </>
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
                "Set the value your character has, then roll. Nothing is saved.",
              )
            : t(
                "reference.roll.progress-help",
                "Set your progress score, then roll against the challenge dice. Nothing is saved.",
              )}
        </Typography>
      </Box>
      {content}
    </Paper>
  );
}
