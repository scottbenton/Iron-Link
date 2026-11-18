import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ColorModeToggle } from "./ColorModeToggle";
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
      "logSound",
      "deleteGame",
    ]);
  });

  it("gives a player only what applies to them", () => {
    const game = { ...archive, isGuide: false, secondScreen: true };
    expect(itemsOf({ game }, "game")).toEqual(["logSound", "secondScreen"]);
  });

  it("leaves the log sound and Edit Access out of a solo game", () => {
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

  it("leaves Dark Mode out for the rail, which has its own toggle", () => {
    expect(itemsOf({ hideColorMode: true }, "app")).toEqual([
      "accessibility",
      "advancedFeatures",
      "signOut",
    ]);
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

  it("shows the log sound as a device checkbox", async () => {
    const onLogSoundChange = vi.fn();
    render(
      <SettingsMenu
        {...baseProps}
        game={{ ...archive, isGuide: false }}
        logSound
        onLogSoundChange={onLogSoundChange}
      />,
    );
    const item = await screen.findByRole("menuitemcheckbox", {
      name: /Sound on New Log Messages/,
    });
    expect(item).toHaveAttribute("aria-checked", "true");
    expect(item).toHaveTextContent("On this device only");
    await userEvent.click(item);
    expect(onLogSoundChange).toHaveBeenCalledWith(false);
  });

  it("drops Dark Mode with hideColorMode", async () => {
    render(<SettingsMenu {...baseProps} hideColorMode />);
    expect(await screen.findByText("App Settings")).toBeInTheDocument();
    expect(
      screen.queryByRole("menuitemcheckbox", { name: "Dark Mode" }),
    ).toBeNull();
  });

  it("says Change Theme covers the game in a solo game with one character", async () => {
    const solo = { ...archive, solo: true };
    const { unmount } = render(
      <SettingsMenu {...baseProps} character={kira} game={solo} />,
    );
    expect(
      await screen.findByRole("menuitem", { name: /This game or the app/ }),
    ).toBeInTheDocument();
    unmount();
    render(
      <SettingsMenu
        {...baseProps}
        character={kira}
        game={{ ...solo, characterCount: 2 }}
      />,
    );
    expect(
      await screen.findByRole("menuitem", {
        name: /Your characters, this game or the app/,
      }),
    ).toBeInTheDocument();
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

describe("ColorModeToggle", () => {
  it("is named for the mode it switches to and switches to it", async () => {
    const onColorModeChange = vi.fn();
    const { rerender } = render(
      <ColorModeToggle
        colorMode="light"
        onColorModeChange={onColorModeChange}
      />,
    );
    const button = screen.getByRole("button", { name: "Switch to dark mode" });
    expect(button).not.toHaveAttribute("aria-pressed");
    await userEvent.click(button);
    expect(onColorModeChange).toHaveBeenCalledWith("dark");

    rerender(
      <ColorModeToggle
        colorMode="dark"
        onColorModeChange={onColorModeChange}
      />,
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Switch to light mode" }),
    );
    expect(onColorModeChange).toHaveBeenLastCalledWith("light");
  });
});
