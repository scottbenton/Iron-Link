import { ReferenceTabs } from "stores/appState.store";

import { MobileTabs } from "./MobileTabs";

// The bar's height above the safe area, which the page leaves free at its
// bottom so nothing is hidden behind it.
export const GAME_BOTTOM_NAV_HEIGHT = 64;

// The space the bar takes at the bottom of the window, safe area included.
export const GAME_BOTTOM_NAV_CLEARANCE = `calc(${GAME_BOTTOM_NAV_HEIGHT}px + env(safe-area-inset-bottom, 0px))`;

// The items of the phone layout's bottom nav, in order.
export enum GameBottomNavItem {
  Sheet = "sheet",
  Notes = "notes",
  Moves = "moves",
  Oracles = "oracles",
  Log = "log",
}

export const GAME_BOTTOM_NAV_ITEMS = [
  GameBottomNavItem.Sheet,
  GameBottomNavItem.Notes,
  GameBottomNavItem.Moves,
  GameBottomNavItem.Oracles,
  GameBottomNavItem.Log,
] as const;

export interface GameBottomNavTarget {
  mobileTab: MobileTabs;
  // The Reference panel's tab an item opens, for the items that open it.
  referenceTab?: ReferenceTabs;
}

const ITEM_REFERENCE_TABS: Partial<Record<GameBottomNavItem, ReferenceTabs>> = {
  [GameBottomNavItem.Moves]: ReferenceTabs.Moves,
  [GameBottomNavItem.Oracles]: ReferenceTabs.Oracles,
  [GameBottomNavItem.Log]: ReferenceTabs.GameLog,
};

// Where an item goes: Sheet and Notes are sections of their own, and Moves,
// Oracles and Log each open the Reference panel on its tab.
export function getGameBottomNavTarget(
  item: GameBottomNavItem,
): GameBottomNavTarget {
  if (item === GameBottomNavItem.Sheet) {
    return { mobileTab: MobileTabs.Sheet };
  }
  if (item === GameBottomNavItem.Notes) {
    return { mobileTab: MobileTabs.Notes };
  }
  return {
    mobileTab: MobileTabs.Reference,
    referenceTab: ITEM_REFERENCE_TABS[item],
  };
}

// The item showing, or none when the Reference panel is on a tab the bottom
// nav has no item for.
export function getActiveGameBottomNavItem(
  mobileTab: MobileTabs,
  referenceTab: ReferenceTabs,
): GameBottomNavItem | undefined {
  if (mobileTab === MobileTabs.Sheet) return GameBottomNavItem.Sheet;
  if (mobileTab === MobileTabs.Notes) return GameBottomNavItem.Notes;
  return GAME_BOTTOM_NAV_ITEMS.find(
    (item) => ITEM_REFERENCE_TABS[item] === referenceTab,
  );
}

// The id of an item's button, which keyboard shortcuts focus on phones.
export function getGameBottomNavItemId(item: GameBottomNavItem): string {
  return `game-bottom-nav-${item}`;
}
