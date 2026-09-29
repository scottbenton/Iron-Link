import AddIcon from "@mui/icons-material/Add";
import { Alert, Button, Stack, Typography } from "@mui/material";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import type { WorldFieldRule } from "lib/worldFieldRules";

import type { IWorldFieldDefinition } from "services/worldFieldDefinitions.service";

import { WorldConfigurationSortList } from "./WorldConfigurationSortList";
import { WorldEditorSection } from "./WorldEditorSection";
import { WorldFieldRuleEditor } from "./WorldFieldRuleEditor";
import { WorldSortableFieldRule } from "./WorldSortableFieldRule";

export function WorldFieldRulesEditor({
  worldId,
  rules,
  fields,
  disabled,
  readOnly,
  invalidCondition,
  invalidRuleLabel,
  onChange,
}: {
  worldId: string;
  rules: WorldFieldRule[];
  fields: IWorldFieldDefinition[];
  disabled: boolean;
  readOnly: boolean;
  invalidCondition: boolean;
  invalidRuleLabel: boolean;
  onChange: (rules: WorldFieldRule[]) => void;
}) {
  const { t } = useTranslation();
  // UI identities survive edits/reorders but never become part of persisted rules.
  const nextId = useRef(rules.length);
  const [ids, setIds] = useState(() =>
    rules.map((_, index) => `rule-${index}`),
  );
  return (
    <WorldEditorSection
      title={t("worlds.fields.rules", "Conditional rules")}
      description={t(
        "worlds.fields.rule-order",
        "Rules are checked from top to bottom. The first matching rule wins.",
      )}
      action={
        !readOnly && (
          <Button
            size="small"
            startIcon={<AddIcon />}
            disabled={disabled || rules.length >= 64}
            onClick={() => {
              onChange([...rules, { conditions: [] }]);
              setIds([...ids, `rule-${nextId.current++}`]);
            }}
          >
            {t("worlds.fields.add-rule", "Add rule")}
          </Button>
        )
      }
    >
      {invalidRuleLabel && (
        <Alert severity="warning">
          {t(
            "worlds.fields.invalid-rule-label",
            "Enter a label for every enabled label override, or turn off the override.",
          )}
        </Alert>
      )}
      {invalidCondition && (
        <Alert severity="warning">
          {t(
            "worlds.fields.invalid-conditions",
            "Every rule needs at least one valid condition. Choose the missing source or ancestor selector before saving.",
          )}
        </Alert>
      )}
      {rules.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          {t(
            "worlds.fields.no-rules",
            "No rules. This field always uses its default behavior.",
          )}
        </Typography>
      ) : (
        <WorldConfigurationSortList
          items={ids.map((id, index) => ({
            id,
            label: t("worlds.fields.rule-number", "Rule {{number}}", {
              number: index + 1,
            }),
          }))}
          onReorder={(next) => {
            if (disabled) return;
            onChange(next.map((id) => rules[ids.indexOf(id)]));
            setIds(next);
          }}
        >
          <Stack spacing={1}>
            {rules.map((rule, index) => (
              <WorldSortableFieldRule
                key={ids[index]}
                id={ids[index]}
                index={index}
                readOnly={readOnly}
                disabled={disabled}
                onRemove={() => {
                  onChange(rules.filter((_, i) => i !== index));
                  setIds(ids.filter((_, i) => i !== index));
                }}
              >
                <WorldFieldRuleEditor
                  worldId={worldId}
                  rule={rule}
                  fields={fields}
                  index={index}
                  disabled={disabled}
                  onChange={(next) =>
                    onChange(
                      rules.map((item, i) => (i === index ? next : item)),
                    )
                  }
                />
              </WorldSortableFieldRule>
            ))}
          </Stack>
        </WorldConfigurationSortList>
      )}
    </WorldEditorSection>
  );
}
