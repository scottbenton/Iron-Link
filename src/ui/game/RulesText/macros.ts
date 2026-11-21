import type { RulesTextMacro } from "./RulesTextContext";

/**
 * A paragraph that is only `{{table>id}}`, `{{table:id}}`,
 * `{{table_columns>id}}` or another `{{type>id}}` macro, as tables are.
 */
const BLOCK_MACRO = /^\s*\{\{([a-z_]+)[>:]([^}]+)\}\}\s*$/;

export function parseBlockMacro(text: string): RulesTextMacro | undefined {
  const match = text.match(BLOCK_MACRO);
  if (!match) return undefined;
  return { type: match[1], id: match[2].trim() };
}
