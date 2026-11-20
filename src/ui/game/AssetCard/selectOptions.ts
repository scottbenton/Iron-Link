import type { Datasworn } from "@datasworn-community/core";

import { SelectOptions } from "ui/components/Select";

import { capitalize } from "../shared";

export function selectOptions(
  field: Datasworn.SelectValueField | Datasworn.SelectEnhancementField,
): SelectOptions<string> {
  const entries: SelectOptions<string> = [];
  Object.entries(field.choices).forEach(([key, choice]) => {
    if ("choice_type" in choice && choice.choice_type === "choice_group") {
      entries.push({
        label: capitalize(choice.name),
        options: Object.entries(
          choice.choices as Record<string, { label: string }>,
        ).map(([subKey, sub]) => ({
          value: subKey,
          label: capitalize(sub.label),
        })),
      });
    } else {
      entries.push({ value: key, label: capitalize(choice.label) });
    }
  });
  return entries;
}
