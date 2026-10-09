import CloseIcon from "@mui/icons-material/Close";
import {
  Alert,
  Box,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Tooltip,
} from "@mui/material";
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
  const small = { size: "small" as const, fullWidth: true, disabled };
  const removeLabel = t("worlds.fields.remove-condition", "Remove condition");
  return (
    <Stack spacing={1}>
      {missingSource && (
        <Alert severity="warning">
          {t(
            "worlds.fields.missing-reference",
            "Choose a source field. A referenced field is missing.",
          )}
        </Alert>
      )}
      <Box
        sx={{
          display: "grid",
          gap: 1,
          alignItems: "start",
          gridTemplateColumns: {
            xs: "1fr auto",
            sm: "minmax(0, 0.9fr) minmax(0, 1.2fr) minmax(0, 0.9fr) minmax(0, 1fr) auto",
          },
          "& > .condition-control": { gridColumn: { xs: "1", sm: "auto" } },
        }}
      >
        <TextField
          {...small}
          select
          className="condition-control"
          label={t("worlds.fields.source", "Read value from")}
          value={condition.source}
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
            {t("worlds.fields.current-entry", "This entry")}
          </MenuItem>
          <MenuItem value="ancestor">
            {t("worlds.fields.ancestor", "Nearest matching ancestor")}
          </MenuItem>
        </TextField>
        <TextField
          {...small}
          select
          className="condition-control"
          label={t("worlds.fields.source-field", "Source field")}
          value={condition.fieldId}
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
              {fieldChoiceLabel(field, fields, t)}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          {...small}
          select
          className="condition-control"
          label={t("worlds.fields.comparison", "Comparison")}
          value={condition.operator}
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
        {condition.operator === "equals" ||
        condition.operator === "notEquals" ? (
          <TextField
            {...small}
            className="condition-control"
            label={t("worlds.fields.comparison-value", "Comparison value")}
            value={condition.value ?? ""}
            onChange={(event) =>
              onChange({ ...condition, value: event.target.value })
            }
          />
        ) : (
          <Box
            className="condition-control"
            sx={{ display: { xs: "none", sm: "block" } }}
          />
        )}
        {!disabled && (
          <Tooltip title={removeLabel}>
            <IconButton
              aria-label={removeLabel}
              size="small"
              onClick={onRemove}
              sx={{
                mt: 0.5,
                gridColumn: { xs: 2, sm: "auto" },
                gridRow: { xs: 1, sm: "auto" },
              }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Box>
      {condition.source === "ancestor" && (
        <Box
          sx={{
            display: "grid",
            gap: 1,
            pl: { sm: 2 },
            borderLeft: { sm: 2 },
            borderColor: { sm: "divider" },
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
          }}
        >
          <TextField
            {...small}
            select
            label={t(
              "worlds.fields.ancestor-selector",
              "Ancestor selector field",
            )}
            value={condition.ancestor?.fieldId ?? ""}
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
                {fieldChoiceLabel(field, fields, t)}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            {...small}
            label={t(
              "worlds.fields.ancestor-value",
              "Ancestor selector equals",
            )}
            value={condition.ancestor?.value ?? ""}
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
        </Box>
      )}
    </Stack>
  );
}
