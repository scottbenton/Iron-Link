import { Datasworn } from "@datasworn/core";
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

import { getOracleCategoryNameFromId } from "hooks/useRollOracle";

import { useOracles } from "stores/dataswornTree.store";

import { parseDiceExpression } from "lib/diceExpressionParser";
import { createId } from "lib/id.lib";

import { RollType } from "repositories/shared.types";

import { IGameLog, IOracleTableRoll } from "services/gameLog.service";

export interface OracleOption {
  id: string;
  label: string;
}

export interface OracleRollFormData {
  oracleId: string;
  oracleLabel: string;
  rollValue: number;
  result: string;
  categoryName?: string;
}

interface OracleRollFormProps {
  oracleOptions: OracleOption[];
  onSubmit: (roll: IGameLog) => Promise<void>;
  submitting: boolean;
}

export function OracleRollForm({
  oracleOptions,
  onSubmit,
  submitting,
}: OracleRollFormProps) {
  const { t } = useTranslation();
  const { oracleRollableMap } = useOracles();

  const {
    control,
    watch,
    formState: { errors, isValid },
    setValue,
    clearErrors,
    handleSubmit,
  } = useForm<OracleRollFormData>({
    defaultValues: {
      oracleId: "",
      oracleLabel: "",
      rollValue: 1,
      result: "",
      categoryName: "",
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
  const dice = selectedOracleData?.dice;
  const { minRollValue, maxRollValue } = useMemo(() => {
    const defaultD100 = { minRollValue: 1, maxRollValue: 100 };

    if (!dice) return defaultD100;
    const parsedDice = parseDiceExpression(dice);

    if (!parsedDice) return defaultD100;

    const minRollValue = parsedDice.diceCount + parsedDice.modifier;
    const maxRollValue =
      parsedDice.diceCount * parsedDice.typeOfDice + parsedDice.modifier;

    return { minRollValue, maxRollValue };
  }, [dice]);

  // Auto-calculate result when roll value or oracle changes
  useEffect(() => {
    if (
      formData.rollValue &&
      selectedOracleData &&
      formData.rollValue >= minRollValue &&
      formData.rollValue <= maxRollValue
    ) {
      const result = getOracleResult(selectedOracleData, formData.rollValue);
      setValue("result", result ?? "");
    } else {
      setValue("result", "");
    }
  }, [
    formData.rollValue,
    selectedOracleData,
    setValue,
    minRollValue,
    maxRollValue,
  ]);

  // Handle form submission
  const handleSubmitForm = async (data: OracleRollFormData) => {
    const selectedOracle = oracleOptions.find(
      (oracle) => oracle.id === data.oracleId,
    );

    const roll: IOracleTableRoll = {
      id: createId(),
      timestamp: new Date(),
      type: RollType.OracleTable,
      roll: data.rollValue,
      result: data.result,
      oracleCategoryName: data.categoryName,
      oracleId: data.oracleId,
      match: false, // Manual rolls don't track matches
      rollLabel:
        selectedOracle?.label ||
        t("roll.manual-oracle-roll", "Manual Oracle Roll"),
      cursedDieRoll: null,
      cursedDieAdditiveResult: null,
      wasCursed: null,
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
      setValue("oracleLabel", oracle.label);
      setValue("rollValue", 1);
      setValue("categoryName", getOracleCategoryNameFromId(oracle.id));
      setValue("result", "");
      clearErrors();
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit(handleSubmitForm)}>
      <Typography variant="h6" gutterBottom>
        {t("add-roll.oracle-roll", "Oracle Roll Details")}
      </Typography>

      <Box sx={{ display: "grid", gridTemplateColumns: "1fr", gap: 2, mb: 2 }}>
        {/* Oracle Selection */}
        <Autocomplete
          options={oracleOptions}
          getOptionLabel={(option) => option.label}
          getOptionKey={(option) => option.id}
          onChange={(_, value) => handleOracleChange(value)}
          renderInput={(params) => (
            <TextField
              {...params}
              label={t("add-roll.oracle", "Oracle Table")}
              helperText={t(
                "add-roll.oracle-help",
                "Select an oracle table to roll on",
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
                if (value < minRollValue || value > maxRollValue) {
                  return `Must be between ${minRollValue} and ${maxRollValue}`;
                }
                return true;
              },
            }}
            render={({ field }) => (
              <TextField
                {...field}
                label={t("add-roll.roll-value", "Roll Value")}
                type="number"
                inputProps={{ min: minRollValue, max: maxRollValue }}
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

function getOracleResult(
  oracle: Datasworn.EmbeddedOracleRollable | Datasworn.OracleRollable,
  roll: number,
): string | undefined {
  const result = oracle.rows.find(
    (row) => row.roll && row.roll.min <= roll && row.roll.max >= roll,
  );

  return result?.text;
}
