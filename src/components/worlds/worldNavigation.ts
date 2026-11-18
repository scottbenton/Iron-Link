import type { NavigationLinkProps } from "components/LinkComponent";

import { pathConfig } from "pages/pathConfig";

export type WorldView =
  | { type: "world" }
  | { type: "category"; categoryId: string }
  // An entry opens on its Details; one in a category with nesting also has
  // a Places section listing the entries inside it, and one in a category
  // with maps a Map section.
  | {
      type: "entry";
      categoryId: string;
      entryId: string;
      section?: WorldEntrySection;
    }
  | { type: "truths" }
  | { type: "settings" }
  | { type: "category-settings"; categoryId: string };

export type WorldEntrySection = "places" | "map";

export function isWorldEntrySection(
  value: string | null | undefined,
): value is WorldEntrySection {
  return value === "places" || value === "map";
}

export type WorldLinkProps = NavigationLinkProps;

// Routes and Notes tabs own destination identity. Shared world components only
// request links, so regular, modifier, and middle clicks work on both surfaces.
export interface WorldNavigation {
  view: WorldView;
  getLinkProps: (view: WorldView) => WorldLinkProps;
  navigate: (view: WorldView) => void;
}

// World paths are built only here and read only by parseWorldViewPath, its
// inverse. Ids are URI-encoded on the way out and decoded on the way in.
export function getWorldViewPath(worldId: string, view: WorldView): string {
  const world = encodeURIComponent(worldId);
  switch (view.type) {
    case "world":
      return pathConfig.world(world);
    case "category":
      return pathConfig.worldCategory(
        world,
        encodeURIComponent(view.categoryId),
      );
    case "entry": {
      const category = encodeURIComponent(view.categoryId);
      const entry = encodeURIComponent(view.entryId);
      return view.section === "places"
        ? pathConfig.worldEntryPlaces(world, category, entry)
        : view.section === "map"
          ? pathConfig.worldEntryMap(world, category, entry)
          : pathConfig.worldEntry(world, category, entry);
    }
    case "truths":
      return pathConfig.worldTruths(world);
    case "settings":
      return pathConfig.worldSettings(world);
    case "category-settings":
      return pathConfig.worldCategorySettings(
        world,
        encodeURIComponent(view.categoryId),
      );
  }
}

export interface ParsedWorldViewPath {
  worldId: string;
  view: WorldView;
}

// Reads a full pathname ("/worlds/:worldId/...", trailing slashes allowed)
// back into the destination getWorldViewPath built it from. Anything else,
// including /worlds/create and unknown sub-paths, is null.
export function parseWorldViewPath(
  pathname: string,
): ParsedWorldViewPath | null {
  const raw = pathname.replace(/\/+$/, "").split("/");
  if (raw[0] !== "" || raw[1] !== "worlds" || raw.length < 3) return null;
  let segments: string[];
  try {
    segments = raw.slice(2).map((segment) => decodeURIComponent(segment));
  } catch {
    return null;
  }
  if (segments.some((segment) => segment === "")) return null;

  const [worldId, ...rest] = segments;
  if (worldId === "create") return null;
  const view = parseWorldViewSegments(rest);
  return view ? { worldId, view } : null;
}

function parseWorldViewSegments(segments: string[]): WorldView | null {
  const [first, second, third, fourth, fifth, ...extra] = segments;
  if (first === undefined) return { type: "world" };
  if (first === "truths")
    return second === undefined ? { type: "truths" } : null;
  if (first === "settings") {
    if (second === undefined) return { type: "settings" };
    if (
      second === "categories" &&
      third !== undefined &&
      fourth === undefined
    ) {
      return { type: "category-settings", categoryId: third };
    }
    return null;
  }
  if (first !== "categories" || second === undefined) return null;
  if (third === undefined) return { type: "category", categoryId: second };
  if (third !== "entries" || fourth === undefined || extra.length > 0) {
    return null;
  }
  if (fifth === undefined) {
    return { type: "entry", categoryId: second, entryId: fourth };
  }
  return isWorldEntrySection(fifth)
    ? { type: "entry", categoryId: second, entryId: fourth, section: fifth }
    : null;
}

// The section of each entry last shown, this session. Going back up the
// breadcrumbs returns to it, so a place opened from its parent's map leads
// back to the map rather than the parent's Places.
const lastEntrySections = new Map<string, WorldEntrySection | undefined>();

export function rememberWorldEntrySection(
  entryId: string,
  section: WorldEntrySection | undefined,
) {
  lastEntrySections.set(entryId, section);
}

export function getWorldEntryReturnSection(entryId: string): WorldEntrySection {
  return lastEntrySections.get(entryId) ?? "places";
}
