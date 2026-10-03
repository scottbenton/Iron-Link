import { validate as isUuid } from "uuid";

import type { WorldFieldConfiguration } from "types/worldField.type";

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

/** Older definitions have no configuration; their fixed binding stays intact. */
export function normalizeWorldFieldConfiguration(
  value: unknown,
): WorldFieldConfiguration {
  if (
    !value ||
    typeof value !== "object" ||
    !("version" in value) ||
    value.version !== 1
  ) {
    return createWorldFieldConfiguration();
  }
  const configuration = value as Partial<WorldFieldConfiguration>;
  return createWorldFieldConfiguration({
    suggestions: Array.isArray(configuration.suggestions)
      ? configuration.suggestions
      : [],
    ...(typeof configuration.targetCategoryId === "string" &&
    isUuid(configuration.targetCategoryId)
      ? { targetCategoryId: configuration.targetCategoryId }
      : {}),
    helpText:
      typeof configuration.helpText === "string" ? configuration.helpText : "",
    visible:
      typeof configuration.visible === "boolean" ? configuration.visible : true,
    rules: Array.isArray(configuration.rules) ? configuration.rules : [],
  });
}
