import {
  type IWorldFieldDefinition,
  type WorldFieldConfiguration,
  type WorldFieldKind,
  type WorldFieldRule,
  WorldFieldType,
} from "types/worldField.type";

type FieldShape = Pick<IWorldFieldDefinition, "type" | "configuration">;
type BoundFieldShape = Pick<
  IWorldFieldDefinition,
  "type" | "binding" | "configuration"
>;

// Any 8-4-4-4-12 hex UUID, as Postgres accepts it. Stricter RFC checks would
// drop IDs the database stores without complaint.
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isWorldUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

// The longest Text value or option the database accepts.
export const WORLD_FIELD_VALUE_MAX_LENGTH = 1000;

// In the order the field editor presents them.
export const WORLD_FIELD_KINDS: WorldFieldKind[] = [
  "text",
  "longText",
  "optionList",
  "linkedEntry",
];

export const DEFAULT_WORLD_FIELD_CONFIGURATION: WorldFieldConfiguration = {
  version: 1,
  suggestions: [],
  helpText: "",
  visible: true,
  rules: [],
};

export function createWorldFieldConfiguration(
  overrides: Partial<WorldFieldConfiguration> = {},
): WorldFieldConfiguration {
  return {
    ...DEFAULT_WORLD_FIELD_CONFIGURATION,
    suggestions: [],
    rules: [],
    ...overrides,
  };
}

// Options as the database accepts them: trimmed, not blank, within the
// length limit, and each listed once.
export function normalizeWorldFieldOptions(values: unknown[]): string[] {
  return [
    ...new Set(
      values
        .filter((value): value is string => typeof value === "string")
        .map((value) => value.trim())
        .filter(
          (value) => !!value && value.length <= WORLD_FIELD_VALUE_MAX_LENGTH,
        ),
    ),
  ];
}

/**
 * Older definitions have no configuration; their fixed binding stays intact.
 * With a type, the configuration also takes that type's shape: only a list
 * Select keeps options, only a Select has `multiple` and `allowOther`, and
 * only a linked Select has a target category.
 */
export function normalizeWorldFieldConfiguration(
  value: unknown,
  type?: WorldFieldType,
): WorldFieldConfiguration {
  if (
    !value ||
    typeof value !== "object" ||
    !("version" in value) ||
    value.version !== 1
  ) {
    return type
      ? shapeWorldFieldConfiguration(createWorldFieldConfiguration(), type)
      : createWorldFieldConfiguration();
  }
  const configuration = value as Partial<WorldFieldConfiguration>;
  const normalized = createWorldFieldConfiguration({
    suggestions: Array.isArray(configuration.suggestions)
      ? configuration.suggestions
      : [],
    ...(isWorldUuid(configuration.targetCategoryId)
      ? { targetCategoryId: configuration.targetCategoryId }
      : {}),
    ...(typeof configuration.multiple === "boolean"
      ? { multiple: configuration.multiple }
      : {}),
    ...(typeof configuration.allowOther === "boolean"
      ? { allowOther: configuration.allowOther }
      : {}),
    helpText:
      typeof configuration.helpText === "string" ? configuration.helpText : "",
    visible:
      typeof configuration.visible === "boolean" ? configuration.visible : true,
    rules: Array.isArray(configuration.rules) ? configuration.rules : [],
  });
  return type ? shapeWorldFieldConfiguration(normalized, type) : normalized;
}

function shapeWorldFieldConfiguration(
  configuration: WorldFieldConfiguration,
  type: WorldFieldType,
): WorldFieldConfiguration {
  const shaped = { ...configuration };
  delete shaped.targetCategoryId;
  delete shaped.multiple;
  delete shaped.allowOther;
  if (type !== WorldFieldType.Select) return { ...shaped, suggestions: [] };
  const linked = configuration.targetCategoryId !== undefined;
  return {
    ...shaped,
    suggestions: linked
      ? []
      : normalizeWorldFieldOptions(configuration.suggestions),
    ...(linked ? { targetCategoryId: configuration.targetCategoryId } : {}),
    multiple: configuration.multiple ?? false,
    allowOther: !linked && (configuration.allowOther ?? false),
  };
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

export function getWorldFieldKind(field: FieldShape): WorldFieldKind {
  switch (field.type) {
    case WorldFieldType.RichText:
      return "longText";
    case WorldFieldType.Select:
      return field.configuration.targetCategoryId === undefined
        ? "optionList"
        : "linkedEntry";
    default:
      return "text";
  }
}

export function isWorldFieldLinkedEntry(field: FieldShape): boolean {
  return getWorldFieldKind(field) === "linkedEntry";
}

// Long text is a collaborative document and a linked entry stores entry IDs,
// so neither can hold a rolled result.
export function canWorldFieldHaveOracleBinding(field: FieldShape): boolean {
  const kind = getWorldFieldKind(field);
  return kind === "text" || kind === "optionList";
}

/**
 * Applies the storage contract to a definition about to be saved: the
 * configuration takes its type's shape, and fields that cannot roll lose
 * their field and rule bindings.
 */
export function normalizeWorldFieldDefinition<T extends BoundFieldShape>(
  definition: T,
): T {
  const configuration = normalizeWorldFieldConfiguration(
    definition.configuration,
    definition.type,
  );
  const bindable = canWorldFieldHaveOracleBinding({
    type: definition.type,
    configuration,
  });
  return {
    ...definition,
    binding: bindable ? definition.binding : null,
    configuration: bindable
      ? configuration
      : {
          ...configuration,
          rules: withoutWorldFieldOracleBindings(configuration.rules),
        },
  };
}

/**
 * The draft a field becomes when its author picks another kind. Help text,
 * visibility and rules carry over, and so does anything the new kind can
 * still use. A linked entry starts without a category until one is chosen.
 */
export function changeWorldFieldKind<T extends BoundFieldShape>(
  definition: T,
  kind: WorldFieldKind,
): T {
  if (kind === getWorldFieldKind(definition)) return definition;
  const { configuration } = definition;
  const base = createWorldFieldConfiguration({
    helpText: configuration.helpText,
    visible: configuration.visible,
    rules: configuration.rules,
  });
  const multiple = configuration.multiple ?? false;
  const next: Pick<IWorldFieldDefinition, "type" | "configuration"> =
    kind === "text"
      ? { type: WorldFieldType.Text, configuration: base }
      : kind === "longText"
        ? { type: WorldFieldType.RichText, configuration: base }
        : kind === "optionList"
          ? {
              type: WorldFieldType.Select,
              // Most lists in the setting defaults are open, and an open
              // single list is also what a Text field can become in place.
              configuration: { ...base, multiple, allowOther: true },
            }
          : {
              type: WorldFieldType.Select,
              configuration: {
                ...base,
                // An empty target keeps the kind until a category is chosen;
                // saving is blocked while it is missing.
                targetCategoryId: "",
                multiple,
                allowOther: false,
              },
            };
  const bindable = canWorldFieldHaveOracleBinding(next);
  return {
    ...definition,
    type: next.type,
    binding: bindable ? definition.binding : null,
    configuration: bindable
      ? next.configuration
      : {
          ...next.configuration,
          rules: withoutWorldFieldOracleBindings(next.configuration.rules),
        },
  };
}
