import AddIcon from "@mui/icons-material/Add";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Divider,
  FormControlLabel,
  MenuItem,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import type { WorldFieldRule } from "lib/worldFieldRules";

import {
  IWorldFieldDefinition,
  WorldFieldType,
} from "services/worldFieldDefinitions.service";

import { WorldOracleBindingPicker } from "../WorldOracleBindingPicker";
import { WorldFieldConditionEditor } from "./WorldFieldConditionEditor";
import { fieldChoiceLabel, isConditionField } from "./categoryEditor.utils";

function OverrideToggle({
  label,
  checked,
  disabled,
  onToggle,
  children,
}: {
  label: string;
  checked: boolean;
  disabled: boolean;
  onToggle: (checked: boolean) => void;
  children: ReactNode;
}) {
  return (
    <Box>
      <FormControlLabel
        control={
          <Switch
            size="small"
            checked={checked}
            disabled={disabled}
            onChange={(_, next) => onToggle(next)}
          />
        }
        label={label}
      />
      {checked && <Box sx={{ pl: 5, pt: 1 }}>{children}</Box>}
    </Box>
  );
}

export function WorldFieldRuleEditor({
  worldId,
  rule,
  fields,
  index,
  disabled,
  onChange,
}: {
  worldId: string;
  rule: WorldFieldRule;
  fields: IWorldFieldDefinition[];
  index: number;
  disabled: boolean;
  onChange: (rule: WorldFieldRule) => void;
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
      sx={{ "&::before": { display: "none" } }}
    >
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography sx={{ overflowWrap: "anywhere" }}>
          <Box component="span" sx={{ fontWeight: 600 }}>
            {t("worlds.fields.rule-number", "Rule {{number}}", {
              number: index + 1,
            })}
            :
          </Box>{" "}
          <Box component="span" sx={{ color: "text.secondary" }}>
            {summary || t("worlds.fields.new-rule", "Choose conditions")}
          </Box>
        </Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Stack spacing={2}>
          <Box>
            <Typography variant="subtitle2">
              {t("worlds.fields.conditions", "When all of these match")}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t(
                "worlds.fields.condition-field-help",
                "Text fields can compare values; number and tag fields check whether they are empty. GM-only sources require this field to be GM only too.",
              )}
            </Typography>
          </Box>
          <Stack spacing={1} divider={<Divider flexItem />}>
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
          </Stack>
          {!disabled && (
            <Button
              size="small"
              startIcon={<AddIcon />}
              sx={{ alignSelf: "flex-start" }}
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
          <Divider />
          <Typography variant="subtitle2">
            {t("worlds.fields.matching-overrides", "Then")}
          </Typography>
          <TextField
            select
            size="small"
            label={t("worlds.fields.rule-visibility", "Visibility")}
            value={
              rule.visible === undefined ? "inherit" : String(rule.visible)
            }
            disabled={disabled}
            sx={{ maxWidth: 280 }}
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
              {t("worlds.fields.use-fallback", "Use default")}
            </MenuItem>
            <MenuItem value="true">
              {t("worlds.fields.visible", "Visible")}
            </MenuItem>
            <MenuItem value="false">
              {t("worlds.fields.hidden", "Hidden")}
            </MenuItem>
          </TextField>
          <OverrideToggle
            label={t("worlds.fields.override-label", "Use a different label")}
            checked={rule.label !== undefined}
            disabled={disabled}
            onToggle={(checked) =>
              onChange({ ...rule, label: checked ? "" : undefined })
            }
          >
            <TextField
              size="small"
              fullWidth
              required
              label={t("worlds.fields.rule-label", "Rule label")}
              value={rule.label ?? ""}
              disabled={disabled}
              onChange={(event) =>
                onChange({ ...rule, label: event.target.value })
              }
            />
          </OverrideToggle>
          <OverrideToggle
            label={t("worlds.fields.override-help", "Use different help text")}
            checked={rule.helpText !== undefined}
            disabled={disabled}
            onToggle={(checked) =>
              onChange({ ...rule, helpText: checked ? "" : undefined })
            }
          >
            <TextField
              size="small"
              fullWidth
              multiline
              label={t("worlds.fields.rule-help", "Rule help text")}
              helperText={t(
                "worlds.fields.help-override-help",
                "Leave empty to show no help text.",
              )}
              value={rule.helpText ?? ""}
              disabled={disabled}
              onChange={(event) =>
                onChange({ ...rule, helpText: event.target.value })
              }
            />
          </OverrideToggle>
          <OverrideToggle
            label={t("worlds.fields.override-oracle", "Use a different oracle")}
            checked={rule.binding !== undefined}
            disabled={disabled}
            onToggle={(checked) =>
              onChange({ ...rule, binding: checked ? null : undefined })
            }
          >
            <WorldOracleBindingPicker
              worldId={worldId}
              label={t("worlds.fields.rule-oracle", "Rule oracle")}
              value={rule.binding ?? null}
              disabled={disabled}
              onChange={(binding) => onChange({ ...rule, binding })}
            />
          </OverrideToggle>
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
}
