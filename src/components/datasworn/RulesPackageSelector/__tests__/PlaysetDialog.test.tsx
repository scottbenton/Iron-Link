import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import {
  IExpansionConfig,
  IRulesetConfig,
  starforgedRulesetConfig,
  sunderedIslesConfig,
} from "data/package.config";

import { PlaysetConfig } from "repositories/game.repository";

import { PlaysetDialog } from "../PlaysetDialog";

// Characterization tests for the playset editor (slice 8), with the real
// Starforged and Sundered Isles packages: excluding collections and items,
// collections an expansion replaces, and saving.

vi.mock("lib/supabase.lib", () => ({ supabase: {} }));

const onClose = vi.fn();
const setPlayset = vi.fn();

function renderDialog(
  options: {
    playset?: PlaysetConfig;
    rulesets?: Record<string, IRulesetConfig>;
    expansions?: Record<string, IExpansionConfig>;
  } = {},
) {
  const {
    playset = {},
    rulesets = { starforged: starforgedRulesetConfig },
    expansions = { sundered_isles: sunderedIslesConfig },
  } = options;
  return render(
    <PlaysetDialog
      open
      onClose={onClose}
      playset={playset}
      setPlayset={setPlayset}
      rulesets={rulesets}
      expansions={expansions}
    />,
  );
}

type User = ReturnType<typeof userEvent.setup>;

// Waits for the packages to load, opens a section and finds a collection.
async function openSection(user: User, section: string, collection: string) {
  await user.click(
    await screen.findByRole("button", { name: section }, { timeout: 5000 }),
  );
  return screen.getAllByRole("checkbox", { name: collection })[0];
}

beforeEach(() => {
  onClose.mockClear();
  setPlayset.mockClear();
});

beforeAll(() => {
  window.PointerEvent ??= MouseEvent as unknown as typeof PointerEvent;
});

describe("PlaysetDialog", () => {
  it("shows the assets, moves and oracles of every package", async () => {
    const user = userEvent.setup();
    renderDialog();

    const dialog = screen.getByRole("dialog", { name: "Edit Playset" });
    expect(
      within(dialog).getByText(
        "Checked assets, moves, and oracles will be included in your game.",
      ),
    ).toBeInTheDocument();
    for (const section of ["Assets", "Moves", "Oracles"]) {
      expect(
        await within(dialog).findByRole(
          "button",
          { name: section },
          { timeout: 5000 },
        ),
      ).toBeInTheDocument();
    }

    expect(await openSection(user, "Assets", "Companion Assets")).toBeChecked();
    expect(screen.getAllByText("Starforged").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Sundered Isles").length).toBeGreaterThan(0);
  });

  it("shows collections that an expansion replaces as replaced", async () => {
    const user = userEvent.setup();
    renderDialog();

    // Sundered Isles replaces Starforged's Character oracles.
    const character = await openSection(user, "Oracles", "Character Oracles");
    expect(character).toHaveAccessibleDescription(
      "This collection is replaced by another",
    );
    expect(character).not.toBeChecked();
    // The library's checkbox is a span, so it says so with aria-disabled.
    expect(character).toHaveAttribute("aria-disabled", "true");
  });

  it("offers the cursed die setting with Sundered Isles, and saves it", async () => {
    // Fixed in slice 8: the editor used to look for a tag no package
    // defines, so the setting never showed.
    const user = userEvent.setup();
    renderDialog();
    await openSection(user, "Assets", "Companion Assets");

    const cursedDie = screen.getByRole("checkbox", {
      name: "Automatically Roll Cursed Die?",
    });
    expect(cursedDie).toBeChecked();
    await user.click(screen.getByText("Automatically Roll Cursed Die?"));
    expect(cursedDie).not.toBeChecked();

    await user.click(screen.getByRole("button", { name: "Save" }));
    const saved = setPlayset.mock.calls[0][0] as PlaysetConfig;
    expect(saved.disableAutomaticCursedDieRolls).toBe(true);
  });

  it("does not offer the cursed die setting without Sundered Isles", async () => {
    const user = userEvent.setup();
    renderDialog({ expansions: {} });
    await openSection(user, "Assets", "Companion Assets");

    expect(
      screen.queryByText("Automatically Roll Cursed Die?"),
    ).not.toBeInTheDocument();
  });

  it("excludes a collection and an item, and saves them", async () => {
    const user = userEvent.setup();
    renderDialog({ playset: { disableAutomaticCursedDieRolls: false } });

    const companions = await openSection(user, "Assets", "Companion Assets");
    // The label: jsdom has no PointerEvent for a press on the box itself.
    await user.click(screen.getAllByText("Companion Assets")[0]);
    expect(companions).not.toBeChecked();
    expect(companions).toHaveAccessibleDescription(
      "This collection is excluded",
    );
    // An excluded collection can't be opened.
    expect(
      screen.getAllByRole("button", { name: "Show Companion Assets" })[0],
    ).toBeDisabled();
    expect(companions).toHaveAttribute("aria-checked", "false");

    // Opening a collection lists its items.
    const showPaths = screen.getAllByRole("button", {
      name: "Show Path Assets",
    })[0];
    await user.click(showPaths);
    expect(showPaths).toHaveAttribute("aria-expanded", "true");
    expect(showPaths).toHaveAccessibleName("Hide Path Assets");
    await user.click(screen.getByText("Ace"));
    expect(screen.getByRole("checkbox", { name: "Ace" })).not.toBeChecked();

    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(setPlayset).toHaveBeenCalledTimes(1);
    const saved = setPlayset.mock.calls[0][0] as PlaysetConfig;
    expect(saved.disableAutomaticCursedDieRolls).toBe(false);
    expect(saved.excludes?.assetCategories).toMatchObject({
      "asset_collection:starforged/companion": true,
    });
    expect(saved.excludes?.assets).toEqual({
      "asset:starforged/path/ace": true,
    });
    expect(onClose).toHaveBeenCalled();
  });

  it("starts from the saved playset and closes without saving on Cancel", async () => {
    const user = userEvent.setup();
    renderDialog({
      playset: {
        excludes: {
          assetCategories: { "asset_collection:starforged/companion": true },
          assets: {},
          moveCategories: {},
          moves: {},
          oracleCategories: {},
          oracles: {},
        },
      },
    });

    const companions = await openSection(user, "Assets", "Companion Assets");
    expect(companions).toHaveAccessibleDescription(
      "This collection is excluded",
    );
    expect(companions).not.toBeChecked();

    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onClose).toHaveBeenCalled();
    expect(setPlayset).not.toHaveBeenCalled();
  });
});

describe("PlaysetDialog, beyond the old editor", () => {
  it("keeps exclusions the editor does not show when it saves", async () => {
    const user = userEvent.setup();
    renderDialog({
      playset: {
        excludes: {
          assetCategories: {},
          assets: {},
          moveCategories: {},
          moves: {},
          oracleCategories: {},
          oracles: {},
          truths: { "truth:starforged/cataclysm": true },
        },
      },
    });
    await screen.findByRole("button", { name: "Assets" }, { timeout: 5000 });

    await user.click(screen.getByRole("button", { name: "Save" }));
    const saved = setPlayset.mock.calls[0][0] as PlaysetConfig;
    expect(saved.excludes?.truths).toEqual({
      "truth:starforged/cataclysm": true,
    });
  });
});
