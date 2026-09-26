import { Alert, Button, MenuItem, Stack, TextField } from "@mui/material";
import { useTranslation } from "react-i18next";

import type { WorldFieldRule } from "lib/worldFieldRules";

import {
  IWorldFieldDefinition,
  WorldFieldType,
} from "services/worldFieldDefinitions.service";

import { fieldChoiceLabel, isConditionField } from "./categoryEditor.utils";

type Condition = WorldFieldRule["conditions"][number];

export function WorldFieldConditionEditor({
  condition,
  fields,
  disabled,
  onChange,
  onRemove,
}: {
  condition: Condition;
  fields: IWorldFieldDefinition[];
  disabled: boolean;
  onChange: (condition: Condition) => void;
  onRemove: () => void;
}) {
  const { t } = useTranslation();
  const source = fields.find((field) => field.id === condition.fieldId);
  const selectable = fields.filter(isConditionField);
  const textFields = fields.filter(
    (field) => field.type === WorldFieldType.Text,
  );
  const missingSource =
    !source ||
    (condition.source === "ancestor" &&
      !fields.some((field) => field.id === condition.ancestor?.fieldId));
  return (
    <Stack spacing={2} sx={{ borderLeft: 2, borderColor: "divider", pl: 2 }}>
      {missingSource && (
        <Alert severity="warning">
          {t(
            "worlds.fields.missing-reference",
            "Choose a source field. A referenced field is missing.",
          )}
        </Alert>
      )}
      <TextField
        select
        label={t("worlds.fields.source", "Read value from")}
        value={condition.source}
        disabled={disabled}
        onChange={(event) =>
          onChange({
            ...condition,
            source: event.target.value as Condition["source"],
            ancestor:
              event.target.value === "ancestor"
                ? { fieldId: textFields[0]?.id ?? "", value: "" }
                : undefined,
          })
        }
      >
        <MenuItem value="entry">
          {t("worlds.fields.current-entry", "Current entry")}
        </MenuItem>
        <MenuItem value="ancestor">
          {t("worlds.fields.ancestor", "Nearest matching ancestor")}
        </MenuItem>
      </TextField>
      {condition.source === "ancestor" && (
        <>
          <TextField
            select
            label={t(
              "worlds.fields.ancestor-selector",
              "Ancestor selector field",
            )}
            value={condition.ancestor?.fieldId ?? ""}
            disabled={disabled}
            onChange={(event) =>
              onChange({
                ...condition,
                ancestor: {
                  fieldId: event.target.value,
                  value: condition.ancestor?.value ?? "",
                },
              })
            }
          >
            {condition.ancestor?.fieldId &&
              !textFields.some(
                (field) => field.id === condition.ancestor?.fieldId,
              ) && (
                <MenuItem value={condition.ancestor.fieldId}>
                  {t("worlds.fields.missing-field", "Missing field")}
                </MenuItem>
              )}
            {textFields.map((field) => (
              <MenuItem key={field.id} value={field.id}>
                {fieldChoiceLabel(field, fields)}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label={t(
              "worlds.fields.ancestor-value",
              "Ancestor selector equals",
            )}
            value={condition.ancestor?.value ?? ""}
            disabled={disabled}
            onChange={(event) =>
              onChange({
                ...condition,
                ancestor: {
                  fieldId: condition.ancestor?.fieldId ?? "",
                  value: event.target.value,
                },
              })
            }
          />
        </>
      )}
      <TextField
        select
        label={t("worlds.fields.source-field", "Source field")}
        value={condition.fieldId}
        disabled={disabled}
        onChange={(event) => {
          const field = fields.find(
            (candidate) => candidate.id === event.target.value,
          );
          onChange({
            ...condition,
            fieldId: event.target.value,
            operator:
              field?.type === WorldFieldType.Text
                ? condition.operator
                : "isNotEmpty",
          });
        }}
      >
        {!source && condition.fieldId && (
          <MenuItem value={condition.fieldId}>
            {t("worlds.fields.missing-field", "Missing field")}
          </MenuItem>
        )}
        {selectable.map((field) => (
          <MenuItem key={field.id} value={field.id}>
            {fieldChoiceLabel(field, fields)}
          </MenuItem>
        ))}
      </TextField>
      <TextField
        select
        label={t("worlds.fields.comparison", "Comparison")}
        value={condition.operator}
        disabled={disabled}
        onChange={(event) =>
          onChange({
            ...condition,
            operator: event.target.value as Condition["operator"],
          })
        }
      >
        <MenuItem
          value="equals"
          disabled={source?.type !== WorldFieldType.Text}
        >
          {t("worlds.fields.equals", "Equals")}
        </MenuItem>
        <MenuItem
          value="notEquals"
          disabled={source?.type !== WorldFieldType.Text}
        >
          {t("worlds.fields.not-equals", "Does not equal")}
        </MenuItem>
        <MenuItem value="isEmpty">
          {t("worlds.fields.empty", "Is empty")}
        </MenuItem>
        <MenuItem value="isNotEmpty">
          {t("worlds.fields.not-empty", "Is not empty")}
        </MenuItem>
      </TextField>
      {(condition.operator === "equals" ||
        condition.operator === "notEquals") && (
        <TextField
          label={t("worlds.fields.comparison-value", "Comparison value")}
          value={condition.value ?? ""}
          disabled={disabled}
          onChange={(event) =>
            onChange({ ...condition, value: event.target.value })
          }
        />
      )}
      {!disabled && (
        <Button onClick={onRemove}>
          {t("worlds.fields.remove-condition", "Remove condition")}
        </Button>
      )}
    </Stack>
  );
}
