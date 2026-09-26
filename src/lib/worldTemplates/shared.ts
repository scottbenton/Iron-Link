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
export const notes = () =>
  field("gmNotes", "GM Notes", { type: "richText", gmOnly: true });
export const tags = () => field("tags", "Tags", { type: "tags" });
export const pronouns = () => field("pronouns", "Pronouns");
export const ranks = [
  "Troublesome",
  "Dangerous",
  "Formidable",
  "Extreme",
  "Epic",
];
