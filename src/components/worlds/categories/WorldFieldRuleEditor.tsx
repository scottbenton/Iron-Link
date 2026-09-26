import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Button,
  Checkbox,
  FormControlLabel,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useTranslation } from "react-i18next";

import type { WorldFieldRule } from "lib/worldFieldRules";

import {
  IWorldFieldDefinition,
  WorldFieldType,
} from "services/worldFieldDefinitions.service";

import { WorldOracleBindingPicker } from "../WorldOracleBindingPicker";
import { WorldFieldConditionEditor } from "./WorldFieldConditionEditor";
import { fieldChoiceLabel, isConditionField } from "./categoryEditor.utils";

export function WorldFieldRuleEditor({
  worldId,
  rule,
  fields,
  index,
  disabled,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
}: {
  worldId: string;
  rule: WorldFieldRule;
  fields: IWorldFieldDefinition[];
  index: number;
  disabled: boolean;
  onChange: (rule: WorldFieldRule) => void;
  onRemove: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}) {
  const { t } = useTranslation();
  const source = fields.find(isConditionField);
  const summary = rule.conditions
    .map((condition) => {
      const field = fields.find(
        (candidate) => candidate.id === condition.fieldId,
      );
      const label = field
        ? fieldChoiceLabel(field, fields)
        : t("worlds.fields.missing-field", "Missing field");
      const comparison = {
        equals: t("worlds.fields.equals", "Equals"),
        notEquals: t("worlds.fields.not-equals", "Does not equal"),
        isEmpty: t("worlds.fields.empty", "Is empty"),
        isNotEmpty: t("worlds.fields.not-empty", "Is not empty"),
      }[condition.operator];
      const ancestor =
        condition.source === "ancestor"
          ? t("worlds.fields.ancestor-summary", "Ancestor {{value}}: ", {
              value: condition.ancestor?.value ?? "",
            })
          : "";
      return `${ancestor}${label} ${comparison}${condition.operator === "equals" || condition.operator === "notEquals" ? ` “${condition.value ?? ""}”` : ""}`;
    })
    .join(t("worlds.fields.condition-and", " and "));
  return (
    <Accordion
      variant="outlined"
      disableGutters
      defaultExpanded={rule.conditions.length === 0}
      slotProps={{ transition: { unmountOnExit: true } }}
    >
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography>
          {t("worlds.fields.rule-number", "Rule {{number}}", {
            number: index + 1,
          })}
          : {summary || t("worlds.fields.new-rule", "Choose conditions")}
        </Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Stack spacing={2}>
          <Typography color="text.secondary">
            {t("worlds.fields.all-conditions", "All conditions must match.")}
          </Typography>
          {rule.conditions.map((condition, conditionIndex) => (
            <WorldFieldConditionEditor
              key={conditionIndex}
              condition={condition}
              fields={fields}
              disabled={disabled}
              onChange={(next) =>
                onChange({
                  ...rule,
                  conditions: rule.conditions.map((item, i) =>
                    i === conditionIndex ? next : item,
                  ),
                })
              }
              onRemove={() =>
                onChange({
                  ...rule,
                  conditions: rule.conditions.filter(
                    (_, i) => i !== conditionIndex,
                  ),
                })
              }
            />
          ))}
          {!disabled && (
            <Button
              disabled={!source || rule.conditions.length >= 16}
              onClick={() =>
                onChange({
                  ...rule,
                  conditions: [
                    ...rule.conditions,
                    {
                      source: "entry",
                      fieldId: source?.id ?? "",
                      operator:
                        source?.type === WorldFieldType.Text
                          ? "equals"
                          : "isNotEmpty",
                      value: "",
                    },
                  ],
                })
              }
            >
              {t("worlds.fields.add-condition", "Add condition")}
            </Button>
          )}
          <TextField
            select
            label={t("worlds.fields.rule-visibility", "Visibility override")}
            value={
              rule.visible === undefined ? "inherit" : String(rule.visible)
            }
            disabled={disabled}
            onChange={(event) =>
              onChange({
                ...rule,
                visible:
                  event.target.value === "inherit"
                    ? undefined
                    : event.target.value === "true",
              })
            }
          >
            <MenuItem value="inherit">
              {t("worlds.fields.use-fallback", "Use fallback")}
            </MenuItem>
            <MenuItem value="true">
              {t("worlds.fields.visible", "Visible")}
            </MenuItem>
            <MenuItem value="false">
              {t("worlds.fields.hidden", "Hidden")}
            </MenuItem>
          </TextField>
          <FormControlLabel
            control={
              <Checkbox
                checked={rule.label !== undefined}
                disabled={disabled}
                onChange={(_, checked) =>
                  onChange({ ...rule, label: checked ? "" : undefined })
                }
              />
            }
            label={t("worlds.fields.override-label", "Override label")}
          />
          {rule.label !== undefined && (
            <TextField
              label={t("worlds.fields.rule-label", "Rule label")}
              value={rule.label}
              disabled={disabled}
              onChange={(event) =>
                onChange({ ...rule, label: event.target.value })
              }
            />
          )}
          <FormControlLabel
            control={
              <Checkbox
                checked={rule.helpText !== undefined}
                disabled={disabled}
                onChange={(_, checked) =>
                  onChange({ ...rule, helpText: checked ? "" : undefined })
                }
              />
            }
            label={t("worlds.fields.override-help", "Override help text")}
          />
          {rule.helpText !== undefined && (
            <TextField
              label={t("worlds.fields.rule-help", "Rule help text")}
              value={rule.helpText}
              multiline
              disabled={disabled}
              onChange={(event) =>
                onChange({ ...rule, helpText: event.target.value })
              }
            />
          )}
          <FormControlLabel
            control={
              <Checkbox
                checked={rule.binding !== undefined}
                disabled={disabled}
                onChange={(_, checked) =>
                  onChange({ ...rule, binding: checked ? null : undefined })
                }
              />
            }
            label={t(
              "worlds.fields.override-oracle",
              "Override oracle (leave empty for no roll button)",
            )}
          />
          {rule.binding !== undefined && (
            <WorldOracleBindingPicker
              worldId={worldId}
              value={rule.binding}
              disabled={disabled}
              onChange={(binding) => onChange({ ...rule, binding })}
            />
          )}
          {!disabled && (
            <Stack direction="row" spacing={1}>
              <Button disabled={!onMoveUp} onClick={onMoveUp}>
                {t("common.move-up", "Move up")}
              </Button>
              <Button disabled={!onMoveDown} onClick={onMoveDown}>
                {t("common.move-down", "Move down")}
              </Button>
              <Button color="error" onClick={onRemove}>
                {t("worlds.fields.remove-rule", "Remove rule")}
              </Button>
            </Stack>
          )}
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
}
