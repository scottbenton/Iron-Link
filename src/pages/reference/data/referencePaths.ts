import { pathConfig } from "pages/pathConfig";

import { ReferenceSection, referenceSections } from "./referenceTabs";

// Reference links are Datasworn ids turned into paths: the package id, then
// the section, then the rest of the id. move:starforged/adventure/face_danger
// is /reference/starforged/moves/adventure/face_danger. A list link carries a
// tab id in place of the package id; tab ids are their home package's id.

type ItemType =
  | "move"
  | "move_category"
  | "oracle_rollable"
  | "oracle_collection"
  | "asset"
  | "asset_collection";

const sectionTypes: Record<
  Exclude<ReferenceSection, "rules">,
  { item: ItemType; collection: ItemType }
> = {
  moves: { item: "move", collection: "move_category" },
  oracles: { item: "oracle_rollable", collection: "oracle_collection" },
  assets: { item: "asset", collection: "asset_collection" },
};

const typeSections: Record<ItemType, Exclude<ReferenceSection, "rules">> = {
  move: "moves",
  move_category: "moves",
  oracle_rollable: "oracles",
  oracle_collection: "oracles",
  asset: "assets",
  asset_collection: "assets",
};

export interface ParsedReferencePath {
  // A tab id on a list URL, the item's package id on an item URL.
  packageId?: string;
  section?: string;
  // The rest of the Datasworn id, without the package, when an item is open.
  itemPath?: string;
}

export function parseReferencePath(splat: string | undefined) {
  const segments = (splat ?? "")
    .split("/")
    .filter((segment) => segment.length > 0);
  const [packageId, section, ...rest] = segments;
  const parsed: ParsedReferencePath = {};
  if (packageId) parsed.packageId = packageId;
  if (section) parsed.section = section;
  if (rest.length > 0) parsed.itemPath = rest.join("/");
  return parsed;
}

export function isReferenceSection(
  section: string | undefined,
): section is ReferenceSection {
  return referenceSections.includes(section as ReferenceSection);
}

// The ids an item URL may name, item type first, then the collection type.
export function getCandidateIds(
  packageId: string,
  section: ReferenceSection,
  itemPath: string,
): string[] {
  if (section === "rules") return [];
  const { item, collection } = sectionTypes[section];
  return [
    `${item}:${packageId}/${itemPath}`,
    `${collection}:${packageId}/${itemPath}`,
  ];
}

interface SplitId {
  type: ItemType;
  packageId: string;
  path: string;
}

// Splits a top level Datasworn id. Embedded ids (an oracle inside a move, a
// move inside an asset ability) have dotted types and get no path of their own.
export function splitDataswornId(id: string): SplitId | undefined {
  const colonIndex = id.indexOf(":");
  if (colonIndex < 0) return undefined;
  const type = id.slice(0, colonIndex);
  if (!(type in typeSections)) return undefined;
  const rest = id.slice(colonIndex + 1);
  const slashIndex = rest.indexOf("/");
  if (slashIndex <= 0 || slashIndex === rest.length - 1) return undefined;
  return {
    type: type as ItemType,
    packageId: rest.slice(0, slashIndex),
    path: rest.slice(slashIndex + 1),
  };
}

export function getPackageIdFromDataswornId(id: string): string | undefined {
  const colonIndex = id.indexOf(":");
  if (colonIndex < 0) return undefined;
  const rest = id.slice(colonIndex + 1);
  const slashIndex = rest.indexOf("/");
  return slashIndex > 0 ? rest.slice(0, slashIndex) : undefined;
}

export function getReferenceItemHref(id: string): string | undefined {
  const split = splitDataswornId(id);
  if (!split) return undefined;
  return `${pathConfig.reference}/${split.packageId}/${typeSections[split.type]}/${split.path}`;
}

export function getReferenceSectionHref(
  tabId: string,
  section: ReferenceSection,
): string {
  return `${pathConfig.reference}/${tabId}/${section}`;
}

// The collection an item or collection sits in, by id: the last path segment
// dropped and the type swapped for the collection type. Returns undefined for
// a root collection.
export function getParentCollectionId(id: string): string | undefined {
  const split = splitDataswornId(id);
  if (!split) return undefined;
  const segments = split.path.split("/");
  if (segments.length < 2) return undefined;
  const parentPath = segments.slice(0, -1).join("/");
  const collectionType = sectionTypes[typeSections[split.type]].collection;
  return `${collectionType}:${split.packageId}/${parentPath}`;
}

export interface ResolveTabOptions {
  parsed: ParsedReferencePath;
  storedTabId: string | undefined;
  // A tab the open item was missing from, so the item's home tab is used.
  rejectedTabId?: string;
  getHomeTabId: (packageId: string) => string | undefined;
  tabLoadsPackage: (tabId: string, packageId: string) => boolean;
  isTab: (tabId: string) => boolean;
  defaultTabId: string;
}

// Which tab shows a reference URL. A list URL names its tab. An item URL keeps
// the tab already open when it loads the item's package (unless the item turned
// out to be filtered out of it), and otherwise opens the package's home tab.
export function resolveReferenceTab(options: ResolveTabOptions): string {
  const {
    parsed,
    storedTabId,
    rejectedTabId,
    getHomeTabId,
    tabLoadsPackage,
    isTab,
    defaultTabId,
  } = options;

  const storedTab = storedTabId && isTab(storedTabId) ? storedTabId : undefined;

  if (!parsed.packageId) {
    return storedTab ?? defaultTabId;
  }

  const homeTab = getHomeTabId(parsed.packageId);

  if (!parsed.itemPath) {
    if (isTab(parsed.packageId)) return parsed.packageId;
    return homeTab ?? storedTab ?? defaultTabId;
  }

  if (
    storedTab &&
    storedTab !== rejectedTabId &&
    tabLoadsPackage(storedTab, parsed.packageId)
  ) {
    return storedTab;
  }

  return homeTab ?? storedTab ?? defaultTabId;
}
