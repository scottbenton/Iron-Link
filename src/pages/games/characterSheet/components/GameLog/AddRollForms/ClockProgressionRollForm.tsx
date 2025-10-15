import {
  Autocomplete,
  Box,
  Button,
  TextField,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { useOracles } from "stores/dataswornTree.store";

import { createId } from "lib/id.lib";

import { RollType } from "repositories/shared.types";

import { IClockProgressionRoll, IGameLog } from "services/gameLog.service";

export interface OracleOption {
  id: string;
  label: string;
  category: string;
}

export interface ClockProgressionRollFormData {
  oracleId: string;
  oracleTitle: string;
  rollValue: number;
  result: string;
}

interface ClockProgressionRollFormProps {
  oracleOptions: OracleOption[];
  onSubmit: (roll: IGameLog) => Promise<void>;
  submitting: boolean;
}

export function ClockProgressionRollForm({
  oracleOptions,
  onSubmit,
  submitting,
}: ClockProgressionRollFormProps) {
  const { t } = useTranslation();
  const { oracleRollableMap } = useOracles();

  const {
    control,
    watch,
    formState: { errors, isValid },
    setValue,
    clearErrors,
    trigger,
    handleSubmit,
  } = useForm<ClockProgressionRollFormData>({
    defaultValues: {
      oracleId: "",
      oracleTitle: "",
      rollValue: 1,
      result: "",
    },
    mode: "onChange",
  });

  const formData = watch();
  const selectedOracleId = watch("oracleId");

  const selectedOracleData = useMemo(() => {
    if (!selectedOracleId) return null;
    return oracleRollableMap[selectedOracleId];
  }, [selectedOracleId, oracleRollableMap]);

  // Get max roll value based on oracle dice
  const maxRollValue = useMemo(() => {
    if (!selectedOracleData?.dice) return 100;

    if (selectedOracleData.dice === "1d6") return 6;
    if (selectedOracleData.dice === "1d10") return 10;
    if (selectedOracleData.dice === "1d12") return 12;
    if (selectedOracleData.dice === "1d20") return 20;
    return 100; // Default to d100
  }, [selectedOracleData]);

  // Calculate oracle result based on roll value
  const calculateOracleResult = useCallback(
    (rollVal: number, oracle: unknown) => {
      if (!oracle || typeof oracle !== "object" || oracle === null) return "";

      const oracleTyped = oracle as {
        rows?: Record<
          string,
          { floor?: number; ceiling?: number; text?: string; result?: string }
        >;
      };
      if (!oracleTyped.rows) return "";

      // Find the matching row based on roll value
      for (const row of Object.values(oracleTyped.rows)) {
        if (row.floor !== undefined && row.ceiling !== undefined) {
          if (rollVal >= row.floor && rollVal <= row.ceiling) {
            return row.text || row.result || "";
          }
        }
      }
      return "";
    },
    [],
  );

  // Auto-calculate result when roll value or oracle changes
  useEffect(() => {
    if (
      formData.rollValue &&
      selectedOracleData &&
      formData.rollValue <= maxRollValue
    ) {
      const result = calculateOracleResult(
        formData.rollValue,
        selectedOracleData,
      );
      setValue("result", result);
      setValue("oracleTitle", selectedOracleData.name || "");
    }
  }, [
    formData.rollValue,
    selectedOracleData,
    calculateOracleResult,
    setValue,
    maxRollValue,
  ]);

  // Re-validate when schema changes
  useEffect(() => {
    if (selectedOracleData) {
      trigger();
    }
  }, [selectedOracleData, trigger]);

  // Handle form submission
  const handleSubmitForm = async (data: ClockProgressionRollFormData) => {
    const roll: IClockProgressionRoll = {
      id: createId(),
      timestamp: new Date(),
      type: RollType.ClockProgression,
      roll: data.rollValue,
      oracleTitle: data.oracleTitle || "",
      result: data.result,
      oracleId: data.oracleId,
      match: false, // Manual rolls don't track matches
      rollLabel: t("roll.manual-clock-progression", "Manual Clock Progression"),
      gameId: "", // Will be added by parent
      characterId: null, // Will be added by parent
      uid: "", // Will be added by parent
      guidesOnly: false,
      isManual: true,
    };

    await onSubmit(roll);
  };

  const handleOracleChange = (oracle: OracleOption | null) => {
    if (oracle) {
      setValue("oracleId", oracle.id);
      setValue("oracleTitle", oracle.label);
      setValue("rollValue", 1);
      setValue("result", "");
      clearErrors();
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit(handleSubmitForm)}>
      <Typography variant="h6" gutterBottom>
        {t("add-roll.clock-progression", "Clock Progression Details")}
      </Typography>

      <Box sx={{ display: "grid", gridTemplateColumns: "1fr", gap: 2, mb: 2 }}>
        {/* Oracle Selection */}
        <Autocomplete
          options={oracleOptions}
          getOptionLabel={(option) => option.label}
          groupBy={(option) => option.category}
          onChange={(_, value) => handleOracleChange(value)}
          renderInput={(params) => (
            <TextField
              {...params}
              label={t("add-roll.oracle", "Oracle Table")}
              helperText={t(
                "add-roll.clock-oracle-help",
                "Select an oracle for clock progression",
              )}
              required
              error={!!errors.oracleId}
            />
          )}
        />

        {/* Roll Value Input */}
        {selectedOracleData && (
          <Controller
            name="rollValue"
            control={control}
            rules={{
              validate: (value) => {
                if (value < 1 || value > maxRollValue) {
                  return `Must be between 1 and ${maxRollValue}`;
                }
                return true;
              },
            }}
            render={({ field }) => (
              <TextField
                {...field}
                label={t("add-roll.roll-value", "Roll Value")}
                type="number"
                inputProps={{ min: 1, max: maxRollValue }}
                error={!!errors.rollValue}
                helperText={
                  errors.rollValue?.message ||
                  t(
                    "add-roll.roll-value-help",
                    "Enter the dice roll result ({{dice}})",
                    {
                      dice: selectedOracleData.dice || "1d100",
                    },
                  )
                }
                required
              />
            )}
          />
        )}
      </Box>

      {/* Calculated Oracle Result */}
      {formData.result && (
        <Box
          sx={{
            mt: 3,
            p: 2,
            bgcolor: "background.paperInlay",
            borderRadius: 1,
          }}
        >
          <Typography variant="subtitle1" gutterBottom>
            {t("add-roll.oracle-result", "Oracle Result")}
          </Typography>
          <Typography variant="body1">{formData.result}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {t("add-roll.rolled", "Rolled: {{value}}", {
              value: formData.rollValue,
            })}
          </Typography>
        </Box>
      )}

      {/* Submit Button */}
      <Box sx={{ mt: 3 }}>
        <Button
          type="submit"
          variant="contained"
          color="primary"
          disabled={!isValid || submitting || !formData.result}
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
