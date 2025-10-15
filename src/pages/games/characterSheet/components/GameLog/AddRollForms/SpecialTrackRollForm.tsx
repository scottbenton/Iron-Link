import { yupResolver } from "@hookform/resolvers/yup";
import {
  Autocomplete,
  Box,
  Button,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import { useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import * as yup from "yup";

import { createId } from "lib/id.lib";

import { RollResult, RollType } from "repositories/shared.types";

import { IGameLog, ISpecialTrackProgressRoll } from "services/gameLog.service";

export interface MoveOption {
  id: string;
  label: string;
  category: string;
}

export interface SpecialTrackRollFormData {
  moveId: string;
  moveLabel: string;
  challengeDie1: number;
  challengeDie2: number;
  trackProgress: number;
  specialTrackKey: SpecialTrackKey;
}

interface SpecialTrackRollFormProps {
  moveOptions: MoveOption[];
  onSubmit: (roll: IGameLog) => Promise<void>;
  submitting: boolean;
}

const specialTrackKeys = ["health", "spirit", "supply"] as const;
type SpecialTrackKey = (typeof specialTrackKeys)[number];

const schema = yup.object({
  moveId: yup.string().required("Move selection is required"),
  moveLabel: yup.string().required(),
  challengeDie1: yup
    .number()
    .required("Challenge die 1 is required")
    .integer("Must be a whole number")
    .min(1, "Must be between 1 and 10")
    .max(10, "Must be between 1 and 10"),
  challengeDie2: yup
    .number()
    .required("Challenge die 2 is required")
    .integer("Must be a whole number")
    .min(1, "Must be between 1 and 10")
    .max(10, "Must be between 1 and 10"),
  trackProgress: yup
    .number()
    .required("Track progress is required")
    .integer("Must be a whole number")
    .min(0, "Must be at least 0")
    .max(40, "Must be at most 40"),
  specialTrackKey: yup
    .string()
    .oneOf(specialTrackKeys, "Must select a valid special track")
    .required("Special track is required"),
});

export function SpecialTrackRollForm({
  moveOptions,
  onSubmit,
  submitting,
}: SpecialTrackRollFormProps) {
  const { t } = useTranslation();

  const {
    control,
    watch,
    formState: { errors, isValid },
    setValue,
    handleSubmit,
  } = useForm<SpecialTrackRollFormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      moveId: "",
      moveLabel: "",
      challengeDie1: 1,
      challengeDie2: 1,
      trackProgress: 0,
      specialTrackKey: "health",
    },
    mode: "onChange",
  });

  const formData = watch();

  // Calculate roll result
  const rollResult = useMemo(() => {
    if (
      !formData.challengeDie1 ||
      !formData.challengeDie2 ||
      formData.trackProgress === undefined
    )
      return undefined;

    if (
      formData.trackProgress > formData.challengeDie1 &&
      formData.trackProgress > formData.challengeDie2
    ) {
      return RollResult.StrongHit;
    } else if (
      formData.trackProgress <= formData.challengeDie1 &&
      formData.trackProgress <= formData.challengeDie2
    ) {
      return RollResult.Miss;
    } else {
      return RollResult.WeakHit;
    }
  }, [formData.challengeDie1, formData.challengeDie2, formData.trackProgress]);

  // Handle form submission
  const handleSubmitForm = async (data: SpecialTrackRollFormData) => {
    const selectedMove = moveOptions.find((move) => move.id === data.moveId);

    const roll: ISpecialTrackProgressRoll = {
      id: createId(),
      timestamp: new Date(),
      type: RollType.SpecialTrackProgress,
      challenge1: data.challengeDie1,
      challenge2: data.challengeDie2,
      trackProgress: data.trackProgress,
      result: rollResult!,
      specialTrackKey: data.specialTrackKey,
      moveId: data.moveId,
      rollLabel:
        selectedMove?.label ||
        t("roll.manual-special-track", "Manual Special Track"),
      gameId: "", // Will be added by parent
      characterId: null, // Will be added by parent
      uid: "", // Will be added by parent
      guidesOnly: false,
      isManual: true,
    };

    await onSubmit(roll);
  };

  const handleMoveChange = (move: MoveOption | null) => {
    if (move) {
      setValue("moveId", move.id);
      setValue("moveLabel", move.label);
    }
  };

  const specialTrackOptions = specialTrackKeys.map((key) => ({
    value: key,
    label: t(
      `special-track.${key}`,
      key.charAt(0).toUpperCase() + key.slice(1),
    ),
  }));

  return (
    <Box component="form" onSubmit={handleSubmit(handleSubmitForm)}>
      <Typography variant="h6" gutterBottom>
        {t("add-roll.special-track", "Special Track Roll Details")}
      </Typography>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: 2,
          mb: 2,
        }}
      >
        {/* Move Selection */}
        <Autocomplete
          options={moveOptions}
          getOptionLabel={(option) => option.label}
          groupBy={(option) => option.category}
          onChange={(_, value) => handleMoveChange(value)}
          renderInput={(params) => (
            <TextField
              {...params}
              label={t("add-roll.move", "Move")}
              required
              error={!!errors.moveId}
            />
          )}
        />

        {/* Special Track Selection */}
        <Controller
          name="specialTrackKey"
          control={control}
          render={({ field }) => (
            <FormControl error={!!errors.specialTrackKey} required>
              <InputLabel>
                {t("add-roll.special-track-key", "Special Track")}
              </InputLabel>
              <Select
                {...field}
                label={t("add-roll.special-track-key", "Special Track")}
              >
                {specialTrackOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
              {errors.specialTrackKey && (
                <FormHelperText>
                  {errors.specialTrackKey.message}
                </FormHelperText>
              )}
            </FormControl>
          )}
        />
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
          gap: 2,
          mb: 2,
        }}
      >
        {/* Track Progress */}
        <Controller
          name="trackProgress"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label={t("add-roll.track-progress", "Track Progress")}
              type="number"
              inputProps={{ min: 0, max: 40 }}
              error={!!errors.trackProgress}
              helperText={errors.trackProgress?.message}
              required
            />
          )}
        />

        {/* Challenge Die 1 */}
        <Controller
          name="challengeDie1"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label={t("add-roll.challenge-die-1", "Challenge Die 1 (d10)")}
              type="number"
              inputProps={{ min: 1, max: 10 }}
              error={!!errors.challengeDie1}
              helperText={errors.challengeDie1?.message}
              required
            />
          )}
        />

        {/* Challenge Die 2 */}
        <Controller
          name="challengeDie2"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label={t("add-roll.challenge-die-2", "Challenge Die 2 (d10)")}
              type="number"
              inputProps={{ min: 1, max: 10 }}
              error={!!errors.challengeDie2}
              helperText={errors.challengeDie2?.message}
              required
            />
          )}
        />
      </Box>

      {/* Calculated Result */}
      {isValid && rollResult && (
        <Box
          sx={{
            mt: 3,
            p: 2,
            bgcolor: "background.paperInlay",
            borderRadius: 1,
          }}
        >
          <Typography variant="subtitle1" gutterBottom>
            {t("add-roll.calculated-result", "Calculated Result")}
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: "bold" }}>
            {t(`roll-result.${rollResult}`, rollResult)}
          </Typography>
        </Box>
      )}

      {/* Submit Button */}
      <Box sx={{ mt: 3 }}>
        <Button
          type="submit"
          variant="contained"
          color="primary"
          disabled={!isValid || submitting || !rollResult}
          fullWidth
        >
          {submitting
            ? t("add-roll.submitting", "Adding Roll...")
            : t("add-roll.submit", "Add Roll")}
        </Button>
      </Box>
    </Box>
  );
}
