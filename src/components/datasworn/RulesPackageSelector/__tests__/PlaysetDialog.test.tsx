import { ThemeProvider } from "@mui/material";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getTheme } from "providers/ThemeProvider/themes/themeConfig";

import {
  IExpansionConfig,
  IRulesetConfig,
  starforgedRulesetConfig,
  sunderedIslesConfig,
} from "data/package.config";

import { PlaysetConfig } from "repositories/game.repository";
import { ColorScheme } from "repositories/shared.types";

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
    <ThemeProvider theme={getTheme(ColorScheme.Default)}>
      <PlaysetDialog
        open
        onClose={onClose}
        playset={playset}
        setPlayset={setPlayset}
        rulesets={rulesets}
        expansions={expansions}
      />
    </ThemeProvider>,
  );
}

type User = ReturnType<typeof userEvent.setup>;

// Opens a section and waits for the packages to load into it.
async function openSection(user: User, section: string, waitFor: RegExp) {
  await user.click(screen.getByRole("button", { name: section }));
  return (
    await screen.findAllByRole("checkbox", { name: waitFor }, { timeout: 5000 })
  )[0];
}

beforeEach(() => {
  onClose.mockClear();
  setPlayset.mockClear();
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
        within(dialog).getByRole("button", { name: section }),
      ).toBeInTheDocument();
    }

    expect(
      await openSection(user, "Assets", /^Companion Assets/),
    ).toBeChecked();
    expect(screen.getAllByText("Starforged").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Sundered Isles").length).toBeGreaterThan(0);
  });

  it("shows collections that an expansion replaces as replaced", async () => {
    const user = userEvent.setup();
    renderDialog();

    // Sundered Isles replaces Starforged's Character oracles.
    const character = await openSection(
      user,
      "Oracles",
      /^Character Oracles\s*This collection is replaced by another/,
    );
    expect(character).not.toBeChecked();
    expect(character).toBeDisabled();
  });

  it("does not offer the cursed die setting", async () => {
    // Sundered Isles has cursed tables, but the editor looks for a tag no
    // package uses, so the setting never shows.
    const user = userEvent.setup();
    renderDialog();
    await openSection(user, "Assets", /^Companion Assets/);

    expect(
      screen.queryByText("Automatically Roll Cursed Die?"),
    ).not.toBeInTheDocument();
  });

  it("excludes a collection and an item, and saves them", async () => {
    const user = userEvent.setup();
    renderDialog({ playset: { disableAutomaticCursedDieRolls: false } });

    const companions = await openSection(user, "Assets", /^Companion Assets/);
    await user.click(companions);
    expect(companions).not.toBeChecked();
    expect(
      screen.getAllByRole("checkbox", {
        name: /^Companion Assets\s*This collection is excluded/,
      }).length,
    ).toBeGreaterThan(0);

    // Opening a collection lists its items.
    await user.click(
      screen.getAllByRole("button", { name: /^Path Assets/ })[0],
    );
    await user.click(screen.getByText("Ace"));
    expect(screen.getByRole("checkbox", { name: "Ace" })).not.toBeChecked();

    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(setPlayset).toHaveBeenCalledTimes(1);
    const saved = setPlayset.mock.calls[0][0] as PlaysetConfig;
    expect(saved.disableAutomaticCursedDieRolls).toBe(false);
    expect(saved.excludes?.assetCategories).toMatchObject({
      [companions.getAttribute("aria-labelledby") ?? ""]: true,
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

    expect(
      await openSection(
        user,
        "Assets",
        /^Companion Assets\s*This collection is excluded/,
      ),
    ).not.toBeChecked();

    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onClose).toHaveBeenCalled();
    expect(setPlayset).not.toHaveBeenCalled();
  });
});
