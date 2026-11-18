import type { RulesTextMacro } from "./RulesTextContext";

/** `{{table>id}}`, `{{table:id}}`, `{{table_columns>id}}`, `{{text>id}}`. */
const MACRO = /\{\{([a-z_]+)[>:]([^}]+)\}\}/g;
const BLOCK_MACRO = /^\s*\{\{([a-z_]+)[>:]([^}]+)\}\}\s*$/;

/** The scheme an inline macro becomes, so the markdown keeps it as a link. */
export const INLINE_MACRO_SCHEME = "rules-macro:";

/** A paragraph that is only a macro, as tables are. */
export function parseBlockMacro(text: string): RulesTextMacro | undefined {
  const match = text.match(BLOCK_MACRO);
  if (!match) return undefined;
  return { type: match[1], id: match[2].trim(), block: true };
}

/** The readable fallback for an inline macro: its id's last part, spaced. */
export function getMacroFallbackLabel(id: string): string {
  const last = id.split(/[/.:]/).pop() ?? id;
  const words = last.replace(/_/g, " ").trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/**
 * Turns macros that sit inside a sentence into links with their own scheme,
 * so the markdown parser keeps their place and RulesText can draw them.
 * Macros alone in a paragraph stay as they are and render as blocks.
 */
export function prepareMarkdown(markdown: string): string {
  return markdown
    .split(/\n{2,}/)
    .map((paragraph) => {
      if (BLOCK_MACRO.test(paragraph)) return paragraph;
      return paragraph.replace(MACRO, (_, type: string, id: string) => {
        const label = getMacroFallbackLabel(id).replace(/[[\]]/g, "");
        return `[${label}](${INLINE_MACRO_SCHEME}${type}>${id.trim()})`;
      });
    })
    .join("\n\n");
}

/** Reads an inline macro back from its link. */
export function parseInlineMacro(href: string): RulesTextMacro | undefined {
  if (!href.startsWith(INLINE_MACRO_SCHEME)) return undefined;
  const rest = href.slice(INLINE_MACRO_SCHEME.length);
  const separator = rest.indexOf(">");
  if (separator < 0) return undefined;
  return {
    type: rest.slice(0, separator),
    id: rest.slice(separator + 1),
    block: false,
  };
}
