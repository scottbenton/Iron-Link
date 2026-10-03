export enum WorldFieldType {
  Text = "text",
  RichText = "richText",
  OracleText = "oracleText",
  Tags = "tags",
  Number = "number",
  CategorySelect = "categorySelect",
  CategoryMultiSelect = "categoryMultiSelect",
}

// JSON shape stored in world_field_definitions.binding.
// Bindings are pinned and concrete: the picker browses the world's effective
// playset with `replaces` applied, so what the user picked is what is stored.
export interface OracleBinding {
  packageId: string;
  oracleId: string;
  // What the binding actually resolved to last time; a difference against a
  // fresh resolution is a divergence and must be surfaced, never silent.
  resolvedOracleId: string;
  // Escape hatch: ignore replacements, always roll exactly oracleId.
  exact?: boolean;
}

export interface WorldFieldCondition {
  source: "entry" | "ancestor";
  fieldId: string;
  operator: "equals" | "notEquals" | "isEmpty" | "isNotEmpty";
  value?: string;
  ancestor?: { fieldId: string; value: string };
}

export interface WorldFieldRule {
  conditions: WorldFieldCondition[];
  visible?: boolean;
  label?: string;
  helpText?: string;
  binding?: OracleBinding | null;
}

export interface WorldFieldConfiguration {
  version: 1;
  suggestions: string[];
  // Category-reference fields store entry IDs in their value JSON. The
  // target is the category from which those entries may be selected.
  targetCategoryId?: string;
  helpText: string;
  visible: boolean;
  rules: WorldFieldRule[];
}

export interface IWorldFieldDefinition {
  id: string;
  categoryId: string;
  worldId: string;
  // Stable import/export handle. Values point at `id`, so renaming a field's
  // label costs nothing and this only matters to the IF importer.
  key: string;
  label: string;
  type: WorldFieldType;
  binding: OracleBinding | null;
  configuration: WorldFieldConfiguration;
  // Mirrored onto every value row by a database trigger; flipping it here is
  // what moves existing values across the RLS boundary.
  gmOnly: boolean;
  sortOrder: number;
}
