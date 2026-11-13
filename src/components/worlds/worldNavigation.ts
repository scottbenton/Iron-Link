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

export function getWorldViewPath(worldId: string, view: WorldView): string {
  switch (view.type) {
    case "world":
      return pathConfig.world(worldId);
    case "category":
      return pathConfig.worldCategory(worldId, view.categoryId);
    case "entry":
      return view.section === "places"
        ? pathConfig.worldEntryPlaces(worldId, view.categoryId, view.entryId)
        : view.section === "map"
          ? pathConfig.worldEntryMap(worldId, view.categoryId, view.entryId)
          : pathConfig.worldEntry(worldId, view.categoryId, view.entryId);
    case "settings":
      return pathConfig.worldSettings(worldId);
    case "category-settings":
      return pathConfig.worldCategorySettings(worldId, view.categoryId);
  }
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

export function getWorldEntryReturnSection(
  entryId: string,
): WorldEntrySection {
  return lastEntrySections.get(entryId) ?? "places";
}
