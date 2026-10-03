import type {
  IWorldFieldDefinition,
  WorldFieldCondition,
  WorldFieldConfiguration,
  WorldFieldRule,
} from "types/worldField.type";

import { normalizeWorldFieldConfiguration } from "./worldFieldConfiguration";

export type {
  WorldFieldCondition,
  WorldFieldConfiguration,
  WorldFieldRule,
} from "types/worldField.type";
export {
  DEFAULT_WORLD_FIELD_CONFIGURATION,
  createWorldFieldConfiguration,
  normalizeWorldFieldConfiguration,
} from "./worldFieldConfiguration";

export type WorldFieldSnapshotValue =
  | string
  | number
  | string[]
  | null
  | undefined;
export interface WorldFieldEntrySnapshot {
  id: string;
  parentId?: string | null;
  values: Readonly<Record<string, WorldFieldSnapshotValue>>;
}
export interface WorldFieldSnapshot {
  entry: WorldFieldEntrySnapshot;
  entries: Readonly<Record<string, WorldFieldEntrySnapshot>>;
}

function conditionEntry(
  condition: WorldFieldCondition,
  snapshot: WorldFieldSnapshot,
) {
  if (condition.source === "entry") return snapshot.entry;
  if (!condition.ancestor) return undefined;
  const visited = new Set([snapshot.entry.id]);
  let parentId = snapshot.entry.parentId;
  while (parentId && !visited.has(parentId)) {
    visited.add(parentId);
    const ancestor = snapshot.entries[parentId];
    if (!ancestor) return undefined;
    if (
      ancestor.values[condition.ancestor.fieldId] === condition.ancestor.value
    )
      return ancestor;
    parentId = ancestor.parentId;
  }
  return undefined;
}

function matchesCondition(
  condition: WorldFieldCondition,
  snapshot: WorldFieldSnapshot,
): boolean {
  const entry = conditionEntry(condition, snapshot);
  // Missing ancestors are missing context, not empty values or a negative match.
  if (!entry) return false;
  const value = entry.values[condition.fieldId];
  const empty =
    value == null ||
    value === "" ||
    (Array.isArray(value) && value.length === 0);
  switch (condition.operator) {
    case "equals":
      return typeof value === "string" && value === condition.value;
    case "notEquals":
      return typeof value === "string" && value !== condition.value;
    case "isEmpty":
      return empty;
    case "isNotEmpty":
      return !empty;
  }
}

export type ResolvedWorldFieldDefinition = IWorldFieldDefinition & {
  visible: boolean;
  helpText: string;
};

/** First matching rule wins. Omitted properties always inherit the base definition. */
export function resolveFieldDefinition(
  definition: IWorldFieldDefinition,
  snapshot: WorldFieldSnapshot,
): ResolvedWorldFieldDefinition {
  const configuration = normalizeWorldFieldConfiguration(
    definition.configuration,
  );
  const rule = configuration.rules.find((candidate) =>
    candidate.conditions.every((condition) =>
      matchesCondition(condition, snapshot),
    ),
  );
  return {
    ...definition,
    visible: rule?.visible ?? configuration.visible,
    label: rule?.label ?? definition.label,
    helpText: rule?.helpText ?? configuration.helpText,
    binding: rule?.binding === undefined ? definition.binding : rule.binding,
  };
}

export function generateWorldFieldKey(id: string): string {
  return `field_${id.replace(/-/g, "")}`;
}

export function areWorldFieldTypesCompatible(
  from: string,
  to: string,
): boolean {
  return (
    from === to ||
    (["richText", "oracleText"].includes(from) &&
      ["richText", "oracleText"].includes(to))
  );
}

export function isWorldCategoryReferenceType(type: string): boolean {
  return type === "categorySelect" || type === "categoryMultiSelect";
}

export function withoutWorldFieldOracleBindings(
  rules: WorldFieldRule[],
): WorldFieldRule[] {
  return rules.map((rule) => {
    const withoutBinding = { ...rule };
    delete withoutBinding.binding;
    return withoutBinding;
  });
}

/** A reference target is part of the value's meaning, even when its JSON shape is unchanged. */
export function areWorldFieldDefinitionsCompatible(
  from: Pick<IWorldFieldDefinition, "type" | "configuration">,
  to: Pick<IWorldFieldDefinition, "type" | "configuration">,
): boolean {
  return (
    areWorldFieldTypesCompatible(from.type, to.type) &&
    (!isWorldCategoryReferenceType(from.type) ||
      from.configuration.targetCategoryId === to.configuration.targetCategoryId)
  );
}

export function canChangeWorldFieldType(
  from: string,
  to: string,
  valueCount: number,
): boolean {
  return valueCount === 0 || areWorldFieldTypesCompatible(from, to);
}

export function isWorldFieldConditionCompatible(
  type: string,
  operator: WorldFieldCondition["operator"],
): boolean {
  return operator === "equals" || operator === "notEquals"
    ? type === "text"
    : ["text", "tags", "number"].includes(type);
}

export function getWorldFieldConditionReferences(
  configuration: WorldFieldConfiguration,
): string[] {
  return [
    ...new Set(
      configuration.rules.flatMap((rule) =>
        rule.conditions.flatMap((condition) =>
          condition.ancestor
            ? [condition.fieldId, condition.ancestor.fieldId]
            : [condition.fieldId],
        ),
      ),
    ),
  ];
}
