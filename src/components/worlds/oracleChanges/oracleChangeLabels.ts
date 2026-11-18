import type { TFunction } from "i18next";

import type { IWorldCategory } from "services/worldCategories.service";
import type { IWorldFieldDefinition } from "services/worldFieldDefinitions.service";

// An oracle's label from a catalog, or its Datasworn path when this world's
// packages no longer include it (an expansion a game took away).
export function getOracleChangeLabel(
  oracleId: string,
  labels: Record<string, string>,
): string {
  return labels[oracleId] ?? oracleId.replace(/^[a-z_]+:/, "");
}

// "Places: Name", or "Places: Name, rule 2" for a rule's own oracle.
export function getOracleChangeFieldLabel(
  t: TFunction,
  fieldId: string,
  ruleIndex: number | null,
  fields: Record<string, IWorldFieldDefinition>,
  categories: Record<string, IWorldCategory>,
): string {
  const field = fields[fieldId];
  const fieldLabel =
    field?.label ?? t("worlds.oracle-changes.unknown-field", "A deleted field");
  const category = field ? categories[field.categoryId]?.name : undefined;
  const label = category
    ? t("worlds.oracle-changes.category-field", "{{category}}: {{field}}", {
        category,
        field: fieldLabel,
      })
    : fieldLabel;
  return ruleIndex === null
    ? label
    : t("worlds.oracle-changes.field-rule", "{{field}}, rule {{number}}", {
        field: label,
        number: ruleIndex + 1,
      });
}
