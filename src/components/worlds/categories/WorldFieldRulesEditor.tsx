import { Button, Stack } from "@mui/material";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import type { WorldFieldRule } from "lib/worldFieldRules";

import type { IWorldFieldDefinition } from "services/worldFieldDefinitions.service";

import { WorldConfigurationSortList } from "./WorldConfigurationSortList";
import { WorldFieldRuleEditor } from "./WorldFieldRuleEditor";
import { WorldSortableFieldRule } from "./WorldSortableFieldRule";

export function WorldFieldRulesEditor({
  worldId,
  rules,
  fields,
  disabled,
  readOnly,
  onChange,
}: {
  worldId: string;
  rules: WorldFieldRule[];
  fields: IWorldFieldDefinition[];
  disabled: boolean;
  readOnly: boolean;
  onChange: (rules: WorldFieldRule[]) => void;
}) {
  const { t } = useTranslation();
  // UI identities survive edits/reorders but never become part of persisted rules.
  const nextId = useRef(rules.length);
  const [ids, setIds] = useState(() =>
    rules.map((_, index) => `rule-${index}`),
  );
  return (
    <Stack spacing={2}>
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
        <Stack spacing={2}>
          {rules.map((rule, index) => (
            <WorldSortableFieldRule
              key={ids[index]}
              id={ids[index]}
              index={index}
              readOnly={readOnly}
              disabled={disabled}
            >
              <WorldFieldRuleEditor
                worldId={worldId}
                rule={rule}
                fields={fields}
                index={index}
                disabled={disabled}
                onChange={(next) =>
                  onChange(rules.map((item, i) => (i === index ? next : item)))
                }
                onRemove={() => {
                  onChange(rules.filter((_, i) => i !== index));
                  setIds(ids.filter((_, i) => i !== index));
                }}
              />
            </WorldSortableFieldRule>
          ))}
        </Stack>
      </WorldConfigurationSortList>
      {!readOnly && (
        <Button
          disabled={disabled || rules.length >= 64}
          onClick={() => {
            onChange([...rules, { conditions: [] }]);
            setIds([...ids, `rule-${nextId.current++}`]);
          }}
        >
          {t("worlds.fields.add-rule", "Add rule")}
        </Button>
      )}
    </Stack>
  );
}
