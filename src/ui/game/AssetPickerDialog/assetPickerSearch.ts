import type { Datasworn } from "@datasworn-community/core";

/** One collapsible group in the picker: an asset type, such as Companion. */
export interface AssetPickerGroup {
  id: string;
  name: string;
  assets: Datasworn.Asset[];
  /**
   * The rules the type comes from, such as Starforged. With types from more
   * than one source, the list is headed by source.
   */
  source?: string;
}

/** Markdown links, emphasis and line breaks, read as plain text. */
export function plainText(markdown: string) {
  return markdown
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[*_]+/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** The line under an asset's name: its requirement, else its first ability. */
export function summarizeAsset(asset: Datasworn.Asset) {
  const first = asset.abilities[0]?.text ?? "";
  return plainText(asset.requirement ?? first);
}

/** Whether the asset's name or one of its abilities holds the query. */
export function assetMatches(asset: Datasworn.Asset, query: string) {
  if (!query) return true;
  return (
    asset.name.toLowerCase().includes(query) ||
    asset.abilities.some((ability) =>
      plainText(ability.text).toLowerCase().includes(query),
    )
  );
}

/** How much of an ability to keep before a match, so it shows in the row. */
const EXCERPT_LEAD = 24;

/**
 * The line under an asset's name while searching. A name match keeps the
 * usual line; an ability match shows that ability from just before the
 * match, so the match is in view rather than cut off at the end of the row.
 */
export function searchLine(asset: Datasworn.Asset, query: string) {
  if (asset.name.toLowerCase().includes(query)) return summarizeAsset(asset);
  for (const ability of asset.abilities) {
    const text = plainText(ability.text);
    const index = text.toLowerCase().indexOf(query);
    if (index === -1) continue;
    if (index <= EXCERPT_LEAD) return text;
    // Start at a word boundary a little before the match.
    const space = text.indexOf(" ", index - EXCERPT_LEAD);
    const start = space === -1 || space >= index ? index : space + 1;
    return `…${text.slice(start)}`;
  }
  return summarizeAsset(asset);
}

/** The groups holding a match, each with only its matching assets. */
export function filterGroups(
  groups: AssetPickerGroup[],
  query: string,
): AssetPickerGroup[] {
  return groups
    .map((group) => ({
      ...group,
      assets: group.assets.filter((asset) => assetMatches(asset, query)),
    }))
    .filter((group) => group.assets.length > 0);
}

/** Splits text around each place it holds the query (lowercase). */
export function splitOnMatches(
  text: string,
  query: string,
): { text: string; match: boolean }[] {
  if (!query) return [{ text, match: false }];
  const lower = text.toLowerCase();
  const parts: { text: string; match: boolean }[] = [];
  let from = 0;
  let index = lower.indexOf(query);
  while (index !== -1) {
    if (index > from)
      parts.push({ text: text.slice(from, index), match: false });
    parts.push({ text: text.slice(index, index + query.length), match: true });
    from = index + query.length;
    index = lower.indexOf(query, from);
  }
  if (from < text.length) parts.push({ text: text.slice(from), match: false });
  return parts;
}
