import { Alert, Stack } from "@mui/material";
import type { TFunction } from "i18next";
import { useTranslation } from "react-i18next";

import { useWorldCategoriesStore } from "stores/worldCategories.store";

import type {
  ResolvedWorldFieldDefinition,
  WorldFieldParentRequirement,
} from "lib/worldFieldRules";

export interface WorldEntryParentHint {
  field: ResolvedWorldFieldDefinition;
  requirements: WorldFieldParentRequirement[];
}

function joinList(t: TFunction, items: string[], conjunction: "and" | "or") {
  if (items.length < 2) return items[0] ?? "";
  const last = items[items.length - 1];
  const rest = items.slice(0, -1).join(", ");
  return conjunction === "and"
    ? t("common.list-and", "{{rest}} and {{last}}", { rest, last })
    : t("common.list-or", "{{rest}} or {{last}}", { rest, last });
}

// A note for fields that roll from a parent's value when this entry has no
// such parent: "To roll Population, move this entry under a Sector whose
// Region is Terminus, Outlands or Expanse." Fields needing the same parent
// share one line. The wording comes from the rules, so any template's nested
// rules get it.
export function WorldEntryParentHints({
  hints,
}: {
  hints: WorldEntryParentHint[];
}) {
  const { t } = useTranslation();
  const definitions = useWorldCategoriesStore(
    (store) => store.fieldDefinitions,
  );
  const groups = new Map<
    string,
    { requirement: WorldFieldParentRequirement; fields: string[] }
  >();
  for (const { field, requirements } of hints) {
    for (const requirement of requirements) {
      const key = [
        requirement.selectorFieldId,
        requirement.selectorValue,
        requirement.fieldId,
        ...requirement.values,
      ].join("\u0000");
      const group = groups.get(key) ?? { requirement, fields: [] };
      if (!group.fields.includes(field.label)) group.fields.push(field.label);
      groups.set(key, group);
    }
  }
  if (groups.size === 0) return null;
  return (
    <Stack spacing={1}>
      {[...groups.entries()].map(([key, { requirement, fields }]) => {
        const parentField =
          definitions[requirement.fieldId]?.label ??
          t("worlds.entries.parent-field-fallback", "value");
        const options = {
          fields: joinList(t, fields, "and"),
          parent: requirement.selectorValue,
          parentField,
          values: joinList(t, requirement.values, "or"),
        };
        return (
          <Alert key={key} severity="info">
            {requirement.values.length
              ? t(
                  "worlds.entries.parent-requirement",
                  "To roll {{fields}}, move this entry under a {{parent}} whose {{parentField}} is {{values}}.",
                  options,
                )
              : t(
                  "worlds.entries.parent-requirement-any",
                  "To roll {{fields}}, move this entry under a {{parent}} with a {{parentField}} set.",
                  options,
                )}
          </Alert>
        );
      })}
    </Stack>
  );
}
