import AddIcon from "@mui/icons-material/Add";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Divider,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useTranslation } from "react-i18next";

import { useWorldEntriesStore } from "stores/worldEntries.store";

import {
  type WorldFieldRule,
  canWorldFieldBeConditionSource,
  doesWorldFieldConditionOperatorTakeValue,
  getWorldFieldConditionOperators,
  isWorldFieldLinkedEntry,
} from "lib/worldFieldRules";

import { IWorldFieldDefinition } from "services/worldFieldDefinitions.service";

import { WorldOracleBindingPicker } from "../WorldOracleBindingPicker";
import { WorldFieldConditionEditor } from "./WorldFieldConditionEditor";
import { WorldFieldOverrideToggle } from "./WorldFieldOverrideToggle";
import {
  fieldChoiceLabel,
  getConditionOperatorLabel,
} from "./categoryEditor.utils";

export function WorldFieldRuleEditor({
  worldId,
  rule,
  fields,
  index,
  disabled,
  allowOracleBinding,
  onChange,
}: {
  worldId: string;
  rule: WorldFieldRule;
  fields: IWorldFieldDefinition[];
  index: number;
  disabled: boolean;
  allowOracleBinding: boolean;
  onChange: (rule: WorldFieldRule) => void;
}) {
  const { t } = useTranslation();
  const source = fields.find(canWorldFieldBeConditionSource);
  // Linked entries compare entry IDs; the summary shows their names.
  const linkedIds = rule.conditions.flatMap((condition) => {
    const linked = (fieldId: string | undefined, value: string | undefined) =>
      value &&
      fields.some(
        (field) => field.id === fieldId && isWorldFieldLinkedEntry(field),
      )
        ? [value]
        : [];
    return [
      ...linked(condition.fieldId, condition.value),
      ...linked(condition.ancestor?.fieldId, condition.ancestor?.value),
    ];
  });
  const entryNames = useWorldEntriesStore((store) =>
    Object.fromEntries(
      linkedIds.map((id) => [id, store.entryState.entries[id]?.name]),
    ),
  );
  const displayValue = (value: string) =>
    value in entryNames
      ? (entryNames[value] ??
        t("worlds.fields.missing-entry", "Unavailable entry"))
      : value;
  const summary = rule.conditions
    .map((condition) => {
      const field = fields.find(
        (candidate) => candidate.id === condition.fieldId,
      );
      const label = field
        ? fieldChoiceLabel(field, fields, t)
        : t("worlds.fields.missing-field", "Missing field");
      const comparison = getConditionOperatorLabel(t, condition.operator);
      const ancestor =
        condition.source === "ancestor"
          ? t("worlds.fields.ancestor-summary", "Ancestor {{value}}: ", {
              value: displayValue(condition.ancestor?.value ?? ""),
            })
          : "";
      return `${ancestor}${label} ${comparison}${doesWorldFieldConditionOperatorTakeValue(condition.operator) ? ` “${displayValue(condition.value ?? "")}”` : ""}`;
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
                "Text and option list fields compare values, and fields that allow more than one check whether they contain a value. Guide-only sources require this field to be Guide only too.",
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
                      operator: source
                        ? getWorldFieldConditionOperators(source)[0]
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
          <WorldFieldOverrideToggle
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
          </WorldFieldOverrideToggle>
          <WorldFieldOverrideToggle
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
          </WorldFieldOverrideToggle>
          {allowOracleBinding && (
            <WorldFieldOverrideToggle
              label={t(
                "worlds.fields.override-oracle",
                "Use a different oracle",
              )}
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
            </WorldFieldOverrideToggle>
          )}
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
}
