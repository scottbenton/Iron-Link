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

import { createId } from "lib/id.lib";

import { RollResult, RollType } from "repositories/shared.types";

import { IGameLog, IStatRoll } from "services/gameLog.service";

export interface MoveOption {
  id: string;
  label: string;
}

export interface StatKeyOption {
  value: string;
  label: string;
}

export interface StatRollFormData {
  moveId?: string;
  moveLabel?: string;
  actionDie: number;
  modifier: number;
  adds: number;
  challengeDie1: number;
  challengeDie2: number;
  statKey: string;
}

interface StatRollFormProps {
  moveOptions: MoveOption[];
  statKeyOptions: StatKeyOption[];
  onSubmit: (roll: IGameLog) => Promise<void>;
  submitting: boolean;
}

export function StatRollForm({
  moveOptions,
  statKeyOptions,
  onSubmit,
  submitting,
}: StatRollFormProps) {
  const { t } = useTranslation();

  const {
    control,
    watch,
    formState: { errors, isValid },
    setValue,
    handleSubmit,
  } = useForm<StatRollFormData>({
    defaultValues: {
      actionDie: 1,
      modifier: 0,
      adds: 0,
      challengeDie1: 1,
      challengeDie2: 1,
      statKey: "",
    },
    mode: "onChange",
  });

  const formData = watch();

  // Calculate derived values
  const actionTotal = useMemo(() => {
    return Math.min(10, formData.actionDie + formData.modifier + formData.adds);
  }, [formData.actionDie, formData.modifier, formData.adds]);

  const rollResult = useMemo(() => {
    if (!formData.challengeDie1 || !formData.challengeDie2) return undefined;

    if (
      actionTotal > formData.challengeDie1 &&
      actionTotal > formData.challengeDie2
    ) {
      return RollResult.StrongHit;
    } else if (
      actionTotal <= formData.challengeDie1 &&
      actionTotal <= formData.challengeDie2
    ) {
      return RollResult.Miss;
    } else {
      return RollResult.WeakHit;
    }
  }, [actionTotal, formData.challengeDie1, formData.challengeDie2]);

  // Handle form submission
  const handleSubmitForm = async (data: StatRollFormData) => {
    const selectedMove = moveOptions.find((move) => move.id === data.moveId);

    const roll: IStatRoll = {
      id: createId(),
      timestamp: new Date(),
      type: RollType.Stat,
      moveId: data.moveId || undefined,
      action: data.actionDie,
      actionTotal,
      challenge1: data.challengeDie1,
      challenge2: data.challengeDie2,
      modifier: data.modifier,
      matchedNegativeMomentum: false,
      adds: data.adds,
      result: rollResult!,
      momentumBurned: null,
      rollLabel:
        selectedMove?.label || t("roll.manual-stat-roll", "Manual Stat Roll"),
      statKey: data.statKey,
      gameId: "", // Will be added by parent
      characterId: null, // Will be added by parent
      uid: "", // Will be added by parent
      guidesOnly: false,
      isManual: true,
    };

    await onSubmit(roll);
  };

  const handleMoveChange = (move: MoveOption | null) => {
    setValue("moveId", move?.id);
    setValue("moveLabel", move?.label);
  };

  return (
    <Box component="form" onSubmit={handleSubmit(handleSubmitForm)}>
      <Typography variant="h6" gutterBottom>
        {t("add-roll.stat-roll", "Stat Roll Details")}
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
          onChange={(_, value) => handleMoveChange(value)}
          renderInput={(params) => (
            <TextField
              {...params}
              label={t("add-roll.move", "Move (Optional)")}
              helperText={t(
                "add-roll.move-help",
                "Select a move this roll is associated with",
              )}
            />
          )}
        />

        {/* Stat Key Selection */}
        <Controller
          name="statKey"
          control={control}
          render={({ field }) => (
            <FormControl error={!!errors.statKey} required>
              <InputLabel>{t("add-roll.stat", "Stat")}</InputLabel>
              <Select {...field} label={t("add-roll.stat", "Stat")}>
                {statKeyOptions.map((stat) => (
                  <MenuItem key={stat.value} value={stat.value}>
                    {stat.label}
                  </MenuItem>
                ))}
              </Select>
              {errors.statKey && (
                <FormHelperText>{errors.statKey.message}</FormHelperText>
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
        {/* Action Die */}
        <Controller
          name="actionDie"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label={t("add-roll.action-die", "Action Die (d6)")}
              type="number"
              inputProps={{ min: 1, max: 6 }}
              error={!!errors.actionDie}
              helperText={errors.actionDie?.message}
              required
            />
          )}
        />

        {/* Modifier */}
        <Controller
          name="modifier"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label={t("add-roll.modifier", "Modifier")}
              type="number"
              error={!!errors.modifier}
              helperText={
                errors.modifier?.message ||
                t("add-roll.modifier-help", "Stat value or other modifiers")
              }
            />
          )}
        />

        {/* Adds */}
        <Controller
          name="adds"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label={t("add-roll.adds", "Adds")}
              type="number"
              error={!!errors.adds}
              helperText={
                errors.adds?.message ||
                t("add-roll.adds-help", "Additional bonuses")
              }
            />
          )}
        />
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 2,
          mb: 2,
        }}
      >
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

      {/* Calculated Results */}
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
          <Typography variant="body2">
            {t("add-roll.action-total", "Action Total: {{total}}", {
              total: actionTotal,
            })}
          </Typography>
          <Typography variant="body2">
            {t("add-roll.vs-challenges", "vs Challenge: {{c1}}, {{c2}}", {
              c1: formData.challengeDie1,
              c2: formData.challengeDie2,
            })}
          </Typography>
          <Typography variant="body1" sx={{ mt: 1, fontWeight: "bold" }}>
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
