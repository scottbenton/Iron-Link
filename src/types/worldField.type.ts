// Storage types. Authors never see these names: they choose a field by
// purpose (WorldFieldKind), and a Select's kind follows from its source.
export enum WorldFieldType {
  Text = "text",
  Select = "select",
}

// What a field is for, as presented in the field editor. A Select reads its
// options from a list unless it links entries in a target category.
export type WorldFieldKind = "text" | "optionList" | "linkedEntry";

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

export type WorldFieldConditionOperator =
  | "equals"
  | "notEquals"
  | "contains"
  | "notContains"
  | "isEmpty"
  | "isNotEmpty";

export interface WorldFieldCondition {
  source: "entry" | "ancestor";
  fieldId: string;
  operator: WorldFieldConditionOperator;
  // A string for Text and option lists, or an entry ID for a linked entry.
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
  // A list Select's options. Always empty on every other field.
  suggestions: string[];
  // Present exactly when a Select links entries: its values are entry IDs
  // from this category instead of strings from the options.
  targetCategoryId?: string;
  // Required on Select and absent on every other type.
  multiple?: boolean;
  // Whether a list accepts values outside its options. Always false when the
  // Select links entries.
  allowOther?: boolean;
  // Whether a Text value takes a whole row on an entry page. Only Text fields
  // set it; multi-value fields always take a whole row.
  fullWidth?: boolean;
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
