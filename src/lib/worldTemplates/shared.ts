import type { IconDefinition } from "types/Icon.type";

import {
  type WorldFieldCondition,
  type WorldFieldConfiguration,
  type WorldFieldRule,
  createWorldFieldConfiguration,
} from "lib/worldFieldRules";

import type {
  OracleBinding,
  WorldFieldType,
} from "services/worldFieldDefinitions.service";

export interface WorldTemplateField {
  id: string;
  key: string;
  label: string;
  type: WorldFieldType;
  binding: OracleBinding | null;
  configuration: WorldFieldConfiguration;
  gm_only: boolean;
  sort_order: number;
}
export interface WorldTemplateCategory {
  id: string;
  name: string;
  icon: IconDefinition | null;
  sort_order: number;
  supports_hierarchy: boolean;
  supports_map: boolean;
  supports_bonds: boolean;
  subtitle_field_definition_id: string | null;
  fields: WorldTemplateField[];
}
export interface WorldTemplateManifest {
  version: 1;
  categories: WorldTemplateCategory[];
}
export type TemplateField = Omit<WorldTemplateField, "id" | "sort_order">;

export function binding(path: string): OracleBinding {
  const oracleId = `oracle_rollable:${path}`;
  return {
    packageId: path.split("/")[0],
    oracleId,
    resolvedOracleId: oracleId,
  };
}
export function field(
  key: string,
  label: string,
  options: {
    type?: "text" | "richText" | "oracleText" | "tags" | "number";
    oracle?: string;
    gmOnly?: boolean;
    suggestions?: string[];
    visible?: boolean;
    rules?: WorldFieldRule[];
    helpText?: string;
  } = {},
): TemplateField {
  return {
    key,
    label,
    type: (options.type ??
      (options.oracle ? "oracleText" : "text")) as WorldFieldType,
    binding: options.oracle ? binding(options.oracle) : null,
    gm_only: options.gmOnly ?? false,
    configuration: createWorldFieldConfiguration({
      suggestions: options.suggestions ?? [],
      rules: options.rules ?? [],
      visible: options.visible ?? true,
      helpText: options.helpText ?? "",
    }),
  };
}
export function equals(fieldId: string, value: string): WorldFieldCondition {
  return { source: "entry", fieldId, operator: "equals", value };
}
export function regionCondition(
  container: string,
  value: string,
): WorldFieldCondition {
  return {
    source: "ancestor",
    fieldId: "region",
    operator: "equals",
    value,
    ancestor: { fieldId: "locationType", value: container },
  };
}
export function locationField(
  key: string,
  label: string,
  types: string[],
  oracle?: string,
): TemplateField {
  return field(key, label, {
    type: "oracleText",
    gmOnly: true,
    oracle,
    visible: false,
    rules: types.map((type) => ({
      conditions: [equals("locationType", type)],
      visible: true,
    })),
  });
}

/** Explicit groups retain their first key; bindings become conditional on location type. */
export function mergeLocationFields(
  fields: TemplateField[],
  groups: string[][],
): TemplateField[] {
  let merged = fields;
  for (const keys of groups) {
    const definitions = keys.map((key) => {
      const definition = merged.find((candidate) => candidate.key === key);
      if (!definition) throw new Error(`Unknown merged location field: ${key}`);
      return definition;
    });
    const retained = definitions[0];
    if (
      definitions.some(
        (definition) =>
          definition.label !== retained.label ||
          definition.type !== retained.type ||
          definition.gm_only !== retained.gm_only ||
          definition.configuration.visible ||
          definition.configuration.helpText !==
            retained.configuration.helpText ||
          definition.configuration.suggestions.length > 0,
      ) ||
      merged.some((definition) =>
        definition.configuration.rules.some((rule) =>
          rule.conditions.some(
            (condition) =>
              keys.includes(condition.fieldId) ||
              (condition.ancestor && keys.includes(condition.ancestor.fieldId)),
          ),
        ),
      )
    )
      throw new Error(
        `Incompatible merged location fields: ${keys.join(", ")}`,
      );
    const replacement: TemplateField = {
      ...retained,
      binding: null,
      configuration: {
        ...retained.configuration,
        rules: definitions.flatMap((definition) =>
          definition.configuration.rules.map((rule) => ({
            ...rule,
            binding:
              rule.binding === undefined ? definition.binding : rule.binding,
          })),
        ),
      },
    };
    merged = merged.flatMap((definition) =>
      definition.key === retained.key
        ? [replacement]
        : keys.includes(definition.key)
          ? []
          : [definition],
    );
  }
  return merged;
}
export const tags = () => field("tags", "Tags", { type: "tags" });
export const pronouns = () => field("pronouns", "Pronouns");
export const ranks = [
  "Troublesome",
  "Dangerous",
  "Formidable",
  "Extreme",
  "Epic",
];
