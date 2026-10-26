import {
  type IWorldFieldDefinition,
  type WorldFieldCondition,
  type WorldFieldConditionOperator,
  type WorldFieldConfiguration,
  WorldFieldType,
} from "types/worldField.type";

import {
  WORLD_FIELD_VALUE_MAX_LENGTH,
  getWorldFieldKind,
  isWorldFieldLinkedEntry,
  isWorldUuid,
  normalizeWorldFieldConfiguration,
} from "./worldFieldConfiguration";

export type {
  WorldFieldCondition,
  WorldFieldConditionOperator,
  WorldFieldConfiguration,
  WorldFieldKind,
  WorldFieldRule,
} from "types/worldField.type";
export {
  DEFAULT_WORLD_FIELD_CONFIGURATION,
  WORLD_FIELD_KINDS,
  WORLD_FIELD_VALUE_MAX_LENGTH,
  canWorldFieldHaveOracleBinding,
  changeWorldFieldKind,
  createWorldFieldConfiguration,
  getWorldFieldKind,
  isWorldFieldLinkedEntry,
  isWorldUuid,
  normalizeWorldFieldConfiguration,
  normalizeWorldFieldDefinition,
  normalizeWorldFieldOptions,
  withoutWorldFieldOracleBindings,
} from "./worldFieldConfiguration";

export type WorldFieldSnapshotValue = string | string[] | null | undefined;
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
    case "contains":
      return Array.isArray(value) && value.includes(condition.value as string);
    case "notContains":
      return Array.isArray(value) && !value.includes(condition.value as string);
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
    definition.type,
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

// A parent a field needs before it can roll: the nearest ancestor whose
// selector field holds selectorValue, with fieldId holding one of values.
export interface WorldFieldParentRequirement {
  selectorFieldId: string;
  selectorValue: string;
  fieldId: string;
  values: string[];
}

/**
 * What a field is missing from its parents to roll. Empty unless the rule
 * that applies has no oracle while a rule with one would apply but for its
 * ancestor conditions: a Population that would roll from its Sector's Region,
 * on a settlement with no Sector above it, or one with no usable Region.
 */
export function getWorldFieldParentRequirements(
  definition: IWorldFieldDefinition,
  snapshot: WorldFieldSnapshot,
): WorldFieldParentRequirement[] {
  if (resolveFieldDefinition(definition, snapshot).binding) return [];
  const { rules } = normalizeWorldFieldConfiguration(
    definition.configuration,
    definition.type,
  );
  const requirements = new Map<string, WorldFieldParentRequirement>();
  for (const rule of rules) {
    if (!rule.binding) continue;
    const ancestorConditions = rule.conditions.filter(
      (condition) => condition.source === "ancestor" && condition.ancestor,
    );
    if (
      ancestorConditions.length === 0 ||
      !rule.conditions.every(
        (condition) =>
          condition.source === "ancestor" ||
          matchesCondition(condition, snapshot),
      )
    )
      continue;
    for (const condition of ancestorConditions) {
      if (matchesCondition(condition, snapshot) || !condition.ancestor)
        continue;
      const key = `${condition.ancestor.fieldId}\u0000${condition.ancestor.value}\u0000${condition.fieldId}`;
      const requirement = requirements.get(key) ?? {
        selectorFieldId: condition.ancestor.fieldId,
        selectorValue: condition.ancestor.value,
        fieldId: condition.fieldId,
        values: [],
      };
      if (
        condition.operator === "equals" &&
        condition.value &&
        !requirement.values.includes(condition.value)
      )
        requirement.values.push(condition.value);
      requirements.set(key, requirement);
    }
  }
  return [...requirements.values()];
}

export function generateWorldFieldKey(id: string): string {
  return `field_${id.replace(/-/g, "")}`;
}

type FieldShape = Pick<IWorldFieldDefinition, "type" | "configuration">;

export type WorldFieldChangeBlocker =
  // The new type cannot hold the stored values.
  | "incompatibleType"
  // Turning off "Allow more than one" while entries store several values.
  | "multipleValues"
  // Stored entry IDs belong to the current target category.
  | "targetCategory";

export interface WorldFieldValueCounts {
  valueCount: number;
  multiValueCount: number;
}

/**
 * Why a definition change would lose stored values, or null when it is safe.
 * Mirrors the database's type-change guard: only changes that keep every
 * stored value meaningful are allowed while values exist.
 */
export function getWorldFieldChangeBlocker(
  from: FieldShape,
  to: FieldShape,
  { valueCount, multiValueCount }: WorldFieldValueCounts,
): WorldFieldChangeBlocker | null {
  if (valueCount === 0) return null;
  const fromKind = getWorldFieldKind(from);
  const toKind = getWorldFieldKind(to);
  const fromMultiple = !!from.configuration.multiple;
  const toMultiple = !!to.configuration.multiple;
  if (fromKind === toKind) {
    if (
      fromKind === "linkedEntry" &&
      from.configuration.targetCategoryId !== to.configuration.targetCategoryId
    )
      return "targetCategory";
    if (fromMultiple && !toMultiple && multiValueCount > 0)
      return "multipleValues";
    return null;
  }
  // A single option is already a plain string.
  if (fromKind === "optionList" && toKind === "text" && !fromMultiple)
    return null;
  // A plain string is already a single option. Strict lists only check
  // values as they are written, so stored ones stay as they are.
  if (fromKind === "text" && toKind === "optionList" && !toMultiple)
    return null;
  return "incompatibleType";
}

const SINGLE_VALUE_OPERATORS: WorldFieldConditionOperator[] = [
  "equals",
  "notEquals",
  "isEmpty",
  "isNotEmpty",
];
const MULTI_VALUE_OPERATORS: WorldFieldConditionOperator[] = [
  "contains",
  "notContains",
  "isEmpty",
  "isNotEmpty",
];

// Conditions compare plain values: equality on Text and single Selects,
// membership on multi Selects. Long text is a collaborative document with no
// value to compare.
export function getWorldFieldConditionOperators(
  field: FieldShape,
): WorldFieldConditionOperator[] {
  switch (field.type) {
    case WorldFieldType.Text:
      return SINGLE_VALUE_OPERATORS;
    case WorldFieldType.Select:
      return field.configuration.multiple
        ? MULTI_VALUE_OPERATORS
        : SINGLE_VALUE_OPERATORS;
    default:
      return [];
  }
}

export function canWorldFieldBeConditionSource(field: FieldShape): boolean {
  return getWorldFieldConditionOperators(field).length > 0;
}

export function isWorldFieldConditionCompatible(
  field: FieldShape,
  operator: WorldFieldConditionOperator,
): boolean {
  return getWorldFieldConditionOperators(field).includes(operator);
}

// The nearest matching ancestor is found by comparing one picked value.
export function canWorldFieldBeAncestorSelector(field: FieldShape): boolean {
  return field.type === WorldFieldType.Select && !field.configuration.multiple;
}

export function doesWorldFieldConditionOperatorTakeValue(
  operator: WorldFieldConditionOperator,
): boolean {
  return operator !== "isEmpty" && operator !== "isNotEmpty";
}

// Whether a compared value (or an ancestor selector's value) can match this
// source at all: it must be picked, and a linked entry compares entry IDs.
export function isWorldFieldConditionValueValid(
  source: FieldShape,
  value: string | undefined,
): boolean {
  if (!value?.trim() || value.length > WORLD_FIELD_VALUE_MAX_LENGTH)
    return false;
  return !isWorldFieldLinkedEntry(source) || isWorldUuid(value);
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
