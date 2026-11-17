// "1-33" for a d100 range, or the single number when it is one.
export function formatTruthRange(
  range: { min: number; max: number } | null | undefined,
): string {
  if (!range) return "";
  return range.min === range.max ? `${range.min}` : `${range.min}–${range.max}`;
}

// Datasworn embeds the sub-table in the description; the card lists it below.
export function withoutTableEmbeds(markdown: string) {
  return markdown.replace(/\n*\{\{table>[^}]+\}\}\n*/g, "\n\n").trim();
}

// Drops the sentence that leads into each sub-table embed ("These entities
// took the form of:"), for a summary whose sub-table has no row chosen. The
// lead-in is the sentence ending in a colon just before the embed; the rest
// of its paragraph stays.
export function withoutTableLeadIns(markdown: string) {
  return markdown.replace(
    /(^|[.!?]\s+|\n)[^.!?\n]*:\s*(\{\{table>[^}]+\}\})/g,
    (_match, before: string, embed: string) =>
      `${before.trimEnd() ? before.trimEnd() : before}\n\n${embed}`,
  );
}
