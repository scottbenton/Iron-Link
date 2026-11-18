import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SettingsMenu, SettingsMenuProps } from "./SettingsMenu";
import {
  getCharacterMenuItems,
  getSettingsMenuSections,
} from "./settingsMenuSections";

const kira = { name: "Kira Vale", isOwner: true };
const archive = { name: "The Drowned Archive", isGuide: true };

function sectionIds(...args: Parameters<typeof getSettingsMenuSections>) {
  return getSettingsMenuSections(...args).map((section) => section.id);
}

function itemsOf(
  context: Parameters<typeof getSettingsMenuSections>[0],
  id: string,
) {
  return getSettingsMenuSections(context).find((section) => section.id === id)
    ?.items;
}

describe("getSettingsMenuSections", () => {
  it("shows only Theme and the app outside a game", () => {
    expect(sectionIds({})).toEqual(["theme", "app"]);
  });

  it("adds the character and the game where they apply, in order", () => {
    expect(sectionIds({ character: kira, game: archive })).toEqual([
      "character",
      "game",
      "theme",
      "app",
    ]);
    expect(sectionIds({ game: archive })).toEqual(["game", "theme", "app"]);
  });

  it("gives a Guide every game item, Delete Game last", () => {
    expect(itemsOf({ game: archive }, "game")).toEqual([
      "gameName",
      "gameRulesets",
      "gameNotifications",
      "deleteGame",
    ]);
  });

  it("gives a player only what applies to them", () => {
    const game = { ...archive, isGuide: false, secondScreen: true };
    expect(itemsOf({ game }, "game")).toEqual([
      "gameNotifications",
      "secondScreen",
    ]);
  });

  it("leaves Notification Settings and Edit Access out of a solo game", () => {
    const game = { ...archive, solo: true };
    expect(itemsOf({ character: kira, game }, "game")).toEqual([
      "gameName",
      "gameRulesets",
      "deleteGame",
    ]);
    expect(itemsOf({ character: kira, game }, "character")).toEqual([
      "characterDetails",
      "characterStats",
      "deleteCharacter",
    ]);
  });

  it("keeps Edit Access and Delete Character for the owner", () => {
    const shared = { name: "Senna Ash-Eye", isOwner: false };
    expect(itemsOf({ character: shared, game: archive }, "character")).toEqual([
      "characterDetails",
      "characterStats",
    ]);
  });

  it("adds Admin Settings for admins and Sign Out when signed in", () => {
    expect(itemsOf({ isAdmin: true }, "app")).toEqual([
      "colorMode",
      "accessibility",
      "advancedFeatures",
      "admin",
      "signOut",
    ]);
    expect(itemsOf({ signedIn: false }, "app")).not.toContain("signOut");
  });

  it("puts Theme before Delete in the character column's menu", () => {
    expect(getCharacterMenuItems(kira, archive)).toEqual([
      "characterDetails",
      "characterStats",
      "characterAccess",
      "theme",
      "deleteCharacter",
    ]);
  });
});

const baseProps: SettingsMenuProps = {
  colorMode: "dark",
  onColorModeChange: () => {},
  onSelect: () => {},
  defaultOpen: true,
};

describe("SettingsMenu", () => {
  it("labels each section that applies and checks Dark Mode", async () => {
    render(<SettingsMenu {...baseProps} character={kira} game={archive} />);
    expect(await screen.findByText("Kira Vale Settings")).toBeInTheDocument();
    expect(screen.getByText("Game Settings")).toBeInTheDocument();
    expect(screen.getByText("App Settings")).toBeInTheDocument();
    expect(
      screen.getByRole("menuitemcheckbox", { name: "Dark Mode" }),
    ).toHaveAttribute("aria-checked", "true");
  });

  it("shows no character or game section on the games list", async () => {
    render(<SettingsMenu {...baseProps} />);
    expect(await screen.findByText("App Settings")).toBeInTheDocument();
    expect(screen.queryByText("Game Settings")).toBeNull();
    expect(screen.queryByRole("menuitem", { name: "Delete Game" })).toBeNull();
    expect(
      screen.getByRole("menuitem", { name: /Change Theme/ }),
    ).toBeInTheDocument();
  });
});
