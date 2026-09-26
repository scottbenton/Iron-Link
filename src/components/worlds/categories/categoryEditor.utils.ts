import { isWorldFieldConditionCompatible } from "lib/worldFieldRules";

import { RepositoryError } from "repositories/errors/RepositoryErrors";

import {
  IWorldFieldDefinition,
  WorldFieldType,
} from "services/worldFieldDefinitions.service";

export const FIELD_TYPE_LABELS = {
  [WorldFieldType.Text]: "Text",
  [WorldFieldType.RichText]: "Rich text",
  [WorldFieldType.OracleText]: "Oracle text",
  [WorldFieldType.Tags]: "Tags",
  [WorldFieldType.Number]: "Number",
};

export function fieldChoiceLabel(
  field: IWorldFieldDefinition,
  fields: IWorldFieldDefinition[],
) {
  return fields.filter((candidate) => candidate.label === field.label).length >
    1
    ? `${field.label} (${field.id.slice(0, 8)})`
    : field.label;
}

export function isConditionField(field: IWorldFieldDefinition) {
  return [
    WorldFieldType.Text,
    WorldFieldType.Number,
    WorldFieldType.Tags,
  ].includes(field.type);
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

export function editorError(error: unknown, fallback: string): string {
  return error instanceof Error && !(error instanceof RepositoryError)
    ? error.message
    : fallback;
}

export function getInvalidatedDependents(
  id: string,
  type: WorldFieldType,
  gmOnly: boolean,
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
            ((readsValue || selectsAncestor) && gmOnly && !field.gmOnly) ||
            (readsValue &&
              !isWorldFieldConditionCompatible(type, condition.operator)) ||
            (selectsAncestor && type !== WorldFieldType.Text)
          );
        }),
      ),
  );
}

export function validateFieldDraft(
  draft: Pick<IWorldFieldDefinition, "type" | "gmOnly" | "configuration">,
  fields: IWorldFieldDefinition[],
  editedId?: string,
  createNew = false,
) {
  const sourceFields = fields.map((source) =>
    source.id === editedId && !createNew
      ? { ...source, type: draft.type, gmOnly: draft.gmOnly }
      : source,
  );
  const invalidCondition = draft.configuration.rules.some(
    (rule) =>
      !rule.conditions.length ||
      rule.conditions.some((condition) => {
        const source = sourceFields.find(
          (candidate) => candidate.id === condition.fieldId,
        );
        return (
          !source ||
          !isWorldFieldConditionCompatible(source.type, condition.operator) ||
          (condition.source === "ancestor" &&
            (!condition.ancestor ||
              !sourceFields.some(
                (candidate) =>
                  candidate.id === condition.ancestor?.fieldId &&
                  candidate.type === WorldFieldType.Text,
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
      ? getInvalidatedDependents(editedId, draft.type, draft.gmOnly, fields)
      : [];
  return {
    sourceFields,
    invalidCondition,
    invalidRuleLabel,
    gmDependency,
    affected,
  };
}
