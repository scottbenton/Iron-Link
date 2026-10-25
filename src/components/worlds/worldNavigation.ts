import type { NavigationLinkProps } from "components/LinkComponent";

import { pathConfig } from "pages/pathConfig";

export type WorldView =
  | { type: "world" }
  | { type: "category"; categoryId: string }
  // An entry opens on its Details; one in a category with nesting also has
  // a Places section listing the entries inside it.
  | {
      type: "entry";
      categoryId: string;
      entryId: string;
      section?: "places";
    }
  | { type: "settings" }
  | { type: "category-settings"; categoryId: string };

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
        : pathConfig.worldEntry(worldId, view.categoryId, view.entryId);
    case "settings":
      return pathConfig.worldSettings(worldId);
    case "category-settings":
      return pathConfig.worldCategorySettings(worldId, view.categoryId);
  }
}
