import { describe, expect, it } from "vitest";

import { ReferenceTabs } from "stores/appState.store";

import { MobileTabs } from "../MobileTabs";
import {
  GAME_BOTTOM_NAV_ITEMS,
  GameBottomNavItem,
  getActiveGameBottomNavItem,
  getGameBottomNavTarget,
} from "../gameBottomNavItems";

describe("getGameBottomNavTarget", () => {
  it("opens Sheet and Notes as sections of their own", () => {
    expect(getGameBottomNavTarget(GameBottomNavItem.Sheet)).toEqual({
      mobileTab: MobileTabs.Sheet,
    });
    expect(getGameBottomNavTarget(GameBottomNavItem.Notes)).toEqual({
      mobileTab: MobileTabs.Notes,
    });
  });

  it("opens the Reference panel on the tab of Moves, Oracles and Log", () => {
    expect(getGameBottomNavTarget(GameBottomNavItem.Moves)).toEqual({
      mobileTab: MobileTabs.Reference,
      referenceTab: ReferenceTabs.Moves,
    });
    expect(getGameBottomNavTarget(GameBottomNavItem.Oracles)).toEqual({
      mobileTab: MobileTabs.Reference,
      referenceTab: ReferenceTabs.Oracles,
    });
    expect(getGameBottomNavTarget(GameBottomNavItem.Log)).toEqual({
      mobileTab: MobileTabs.Reference,
      referenceTab: ReferenceTabs.GameLog,
    });
  });
});

describe("getActiveGameBottomNavItem", () => {
  it("shows each item as active once it is chosen", () => {
    for (const item of GAME_BOTTOM_NAV_ITEMS) {
      const { mobileTab, referenceTab } = getGameBottomNavTarget(item);
      expect(
        getActiveGameBottomNavItem(
          mobileTab,
          referenceTab ?? ReferenceTabs.Moves,
        ),
      ).toBe(item);
    }
  });

  it("keeps Sheet and Notes active whatever the Reference panel shows", () => {
    expect(
      getActiveGameBottomNavItem(MobileTabs.Notes, ReferenceTabs.GameLog),
    ).toBe(GameBottomNavItem.Notes);
  });

  it("shows no item for a Reference tab the bottom nav has none for", () => {
    expect(
      getActiveGameBottomNavItem(
        MobileTabs.Reference,
        ReferenceTabs.SecondScreen,
      ),
    ).toBeUndefined();
  });
});
