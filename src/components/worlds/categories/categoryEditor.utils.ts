import type { TFunction } from "i18next";

import {
  type WorldFieldConditionOperator,
  type WorldFieldKind,
  canWorldFieldBeAncestorSelector,
  doesWorldFieldConditionOperatorTakeValue,
  getWorldFieldKind,
  isWorldFieldConditionCompatible,
  isWorldFieldConditionValueValid,
  isWorldFieldLinkedEntry,
} from "lib/worldFieldRules";

import { RepositoryError } from "repositories/errors/RepositoryErrors";

import { IWorldFieldDefinition } from "services/worldFieldDefinitions.service";

// Authors choose fields by purpose, so these are the only type names shown.
export function getFieldKindLabel(t: TFunction, kind: WorldFieldKind): string {
  switch (kind) {
    case "text":
      return t("worlds.fields.kind-text", "Text");
    case "optionList":
      return t("worlds.fields.kind-option-list", "Option list");
    case "linkedEntry":
      return t("worlds.fields.kind-linked-entry", "Linked entry");
  }
}

export function getFieldKindHint(t: TFunction, kind: WorldFieldKind): string {
  switch (kind) {
    case "text":
      return t(
        "worlds.fields.kind-text-hint",
        "A short line, like a name or a rolled result. Can roll from an oracle.",
      );
    case "optionList":
      return t(
        "worlds.fields.kind-option-list-hint",
        "Pick from a list of options, like Location Type or Tags.",
      );
    case "linkedEntry":
      return t(
        "worlds.fields.kind-linked-entry-hint",
        "Link to entries in another category, like an NPC's home Location.",
      );
  }
}

export function getFieldTypeLabel(
  t: TFunction,
  field: Pick<IWorldFieldDefinition, "type" | "configuration">,
): string {
  return getFieldKindLabel(t, getWorldFieldKind(field));
}

export function getConditionOperatorLabel(
  t: TFunction,
  operator: WorldFieldConditionOperator,
): string {
  switch (operator) {
    case "equals":
      return t("worlds.fields.equals", "Equals");
    case "notEquals":
      return t("worlds.fields.not-equals", "Does not equal");
    case "contains":
      return t("worlds.fields.contains", "Contains");
    case "notContains":
      return t("worlds.fields.not-contains", "Does not contain");
    case "isEmpty":
      return t("worlds.fields.empty", "Is empty");
    case "isNotEmpty":
      return t("worlds.fields.not-empty", "Is not empty");
  }
}

export function fieldChoiceLabel(
  field: IWorldFieldDefinition,
  fields: IWorldFieldDefinition[],
  t: TFunction,
) {
  const duplicates = fields.filter(
    (candidate) => candidate.label === field.label,
  );
  if (duplicates.length < 2) return field.label;
  // Fields that share a label usually appear for different subtypes, so
  // prefer the value that makes one visible (such as "Planet" for a field
  // shown when Location Type equals Planet). Linked entries compare entry
  // IDs, which are no name. Otherwise use the field type and list position,
  // never a storage identity.
  const subtype = (candidate: IWorldFieldDefinition) =>
    candidate.configuration.rules
      .filter((rule) => rule.visible === true)
      .flatMap((rule) => rule.conditions)
      .find(
        (condition) =>
          condition.source === "entry" &&
          condition.operator === "equals" &&
          !!condition.value?.trim() &&
          fields.some(
            (source) =>
              source.id === condition.fieldId &&
              !isWorldFieldLinkedEntry(source),
          ),
      )?.value;
  const context = subtype(field);
  if (
    context &&
    duplicates.filter((candidate) => subtype(candidate) === context).length ===
      1
  ) {
    return `${field.label} (${context})`;
  }
  return `${field.label} (${getFieldTypeLabel(t, field)}, ${duplicates.findIndex((candidate) => candidate.id === field.id) + 1})`;
}

export function getReferencingFields(
  id: string,
  fields: IWorldFieldDefinition[],
) {
  return fields.filter(
    (field) =>
      field.id !== id &&
      field.configuration.rules.some((rule) =>
        rule.conditions.some(
          (condition) =>
            condition.fieldId === id || condition.ancestor?.fieldId === id,
        ),
      ),
  );
}

// Repository errors already raise a snackbar, so editors only show their
// own client-side messages (guards and validation) inline.
export function getEditorErrorMessage(error: unknown): string | undefined {
  return error instanceof Error && !(error instanceof RepositoryError)
    ? error.message
    : undefined;
}

export function getInvalidatedDependents(
  id: string,
  draft: Pick<IWorldFieldDefinition, "type" | "configuration" | "gmOnly">,
  fields: IWorldFieldDefinition[],
) {
  return fields.filter(
    (field) =>
      field.id !== id &&
      field.configuration.rules.some((rule) =>
        rule.conditions.some((condition) => {
          const readsValue = condition.fieldId === id;
          const selectsAncestor = condition.ancestor?.fieldId === id;
          return (
            ((readsValue || selectsAncestor) &&
              draft.gmOnly &&
              !field.gmOnly) ||
            (readsValue &&
              (!isWorldFieldConditionCompatible(draft, condition.operator) ||
                (doesWorldFieldConditionOperatorTakeValue(condition.operator) &&
                  !isWorldFieldConditionValueValid(draft, condition.value)))) ||
            (selectsAncestor &&
              (!canWorldFieldBeAncestorSelector(draft) ||
                !isWorldFieldConditionValueValid(
                  draft,
                  condition.ancestor?.value,
                )))
          );
        }),
      ),
  );
}

export function validateFieldDraft(
  draft: Pick<IWorldFieldDefinition, "type" | "gmOnly" | "configuration"> &
    Partial<Pick<IWorldFieldDefinition, "label" | "binding">>,
  fields: IWorldFieldDefinition[],
  editedId?: string,
  createNew = false,
) {
  // A field's rules may read its own value, so conditions are checked against
  // the edited field as it will be saved. Creating a new field instead leaves
  // the original untouched.
  const sourceFields = fields.map((source) =>
    source.id === editedId && !createNew ? { ...source, ...draft } : source,
  );
  const invalidCondition = draft.configuration.rules.some(
    (rule) =>
      !rule.conditions.length ||
      rule.conditions.some((condition) => {
        const source = sourceFields.find(
          (candidate) => candidate.id === condition.fieldId,
        );
        const selector =
          condition.source === "ancestor"
            ? sourceFields.find(
                (candidate) =>
                  candidate.id === condition.ancestor?.fieldId &&
                  canWorldFieldBeAncestorSelector(candidate),
              )
            : undefined;
        return (
          !source ||
          !isWorldFieldConditionCompatible(source, condition.operator) ||
          (doesWorldFieldConditionOperatorTakeValue(condition.operator) &&
            !isWorldFieldConditionValueValid(source, condition.value)) ||
          (condition.source === "ancestor" &&
            (!selector ||
              !isWorldFieldConditionValueValid(
                selector,
                condition.ancestor?.value,
              )))
        );
      }),
  );
  const invalidRuleLabel = draft.configuration.rules.some(
    (rule) => rule.label !== undefined && !rule.label.trim(),
  );
  const gmDependency =
    !draft.gmOnly &&
    draft.configuration.rules.some((rule) =>
      rule.conditions.some((condition) =>
        sourceFields.some(
          (source) =>
            source.gmOnly &&
            (source.id === condition.fieldId ||
              source.id === condition.ancestor?.fieldId),
        ),
      ),
    );
  const affected =
    editedId && !createNew
      ? getInvalidatedDependents(editedId, draft, fields)
      : [];
  return {
    sourceFields,
    invalidCondition,
    invalidRuleLabel,
    gmDependency,
    affected,
  };
}
