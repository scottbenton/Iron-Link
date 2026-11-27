import { ThemeProvider } from "@mui/material";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";

import { getTheme } from "providers/ThemeProvider/themes/themeConfig";

import { defaultPlaysets } from "data/playset.config";

import {
  ExpansionConfig,
  PlaysetConfig,
  RulesetConfig,
} from "repositories/game.repository";
import { ColorScheme } from "repositories/shared.types";

import { RulesPackageSelector } from "../RulesPackageSelector";

// Characterization tests for the rules package selector (slice 8): which
// rulesets and expansions it offers, how expansions follow their ruleset and
// each other, and the default playsets.

vi.mock("lib/supabase.lib", () => ({ supabase: {} }));

interface HarnessState {
  rulesets: RulesetConfig;
  expansions: ExpansionConfig;
  playset: PlaysetConfig;
}

function Harness(props: {
  initial?: Partial<HarnessState>;
  onState: (state: HarnessState) => void;
}) {
  const { initial, onState } = props;
  const [rulesets, setRulesets] = useState<RulesetConfig>(
    initial?.rulesets ?? {},
  );
  const [expansions, setExpansions] = useState<ExpansionConfig>(
    initial?.expansions ?? {},
  );
  const [playset, setPlayset] = useState<PlaysetConfig>(initial?.playset ?? {});
  onState({ rulesets, expansions, playset });

  return (
    <RulesPackageSelector
      activeRulesetConfig={rulesets}
      onRulesetChange={(rulesetKey, isActive) =>
        setRulesets((prev) => ({ ...prev, [rulesetKey]: isActive }))
      }
      activeExpansionConfig={expansions}
      onExpansionChange={(rulesetKey, expansionKey, isActive) =>
        setExpansions((prev) => ({
          ...prev,
          [rulesetKey]: { ...prev[rulesetKey], [expansionKey]: isActive },
        }))
      }
      activePlaysetConfig={playset}
      onPlaysetChange={setPlayset}
    />
  );
}

function renderSelector(initial?: Partial<HarnessState>) {
  const state: { current: HarnessState } = {
    current: { rulesets: {}, expansions: {}, playset: {} },
  };
  render(
    <ThemeProvider theme={getTheme(ColorScheme.Default)}>
      <Harness
        initial={initial}
        onState={(next) => {
          state.current = next;
        }}
      />
    </ThemeProvider>,
  );
  return state;
}

// Expansion checkboxes may carry an info hint after their name.
function getCheckbox(name: string) {
  return screen.getByRole("checkbox", { name: new RegExp(`^${name}`) });
}

describe("RulesPackageSelector", () => {
  it("lists the official and third-party rulesets with their expansions", () => {
    renderSelector();

    expect(screen.getByText("Official Rulesets")).toBeInTheDocument();
    expect(screen.getByText("Third-Party Rulesets")).toBeInTheDocument();
    expect(screen.getByText("Third-Party Expansions")).toBeInTheDocument();

    for (const name of ["Ironsworn", "Starforged", "Elegy"]) {
      expect(getCheckbox(name)).not.toBeChecked();
    }
    for (const name of ["Delve", "Lodestar", "Sundered Isles", "Starsmith"]) {
      expect(getCheckbox(name)).toBeDisabled();
    }
    // Ironsworn and Starforged each have their own giveaways.
    expect(
      screen.getAllByRole("checkbox", { name: /^Giveaway Assets/ }),
    ).toHaveLength(2);

    // Third-party packages credit their author and license.
    expect(screen.getByRole("link", { name: "Eric Bright" })).toHaveAttribute(
      "href",
      "https://playeveryrole.com/starsmith-products/",
    );
    expect(
      screen.getByRole("link", { name: "Moro de Oliveira" }),
    ).toHaveAttribute("href", "https://miraclem.itch.io/elegy");
    expect(screen.getAllByRole("link", { name: /CC BY 4.0/ })).toHaveLength(2);
  });

  it("turns rulesets on, which lets their expansions be chosen", async () => {
    const user = userEvent.setup();
    const state = renderSelector();

    expect(
      screen.queryByRole("button", { name: "Edit Playset" }),
    ).not.toBeInTheDocument();

    // The labels: jsdom has no PointerEvent for a press on the box itself.
    await user.click(screen.getByText("Starforged"));
    expect(state.current.rulesets).toEqual({ starforged: true });
    expect(getCheckbox("Starforged")).toBeChecked();
    expect(getCheckbox("Sundered Isles")).toBeEnabled();
    expect(getCheckbox("Delve")).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Edit Playset" }),
    ).toBeInTheDocument();

    await user.click(screen.getByText("Sundered Isles"));
    expect(state.current.expansions).toEqual({
      starforged: { sundered_isles: true },
    });
  });

  it("shows an expansion as unticked while its ruleset is off", () => {
    renderSelector({
      rulesets: { classic: false },
      expansions: { classic: { delve: true } },
    });
    expect(getCheckbox("Delve")).not.toBeChecked();
    expect(getCheckbox("Delve")).toBeDisabled();
  });

  it("ticks an expansion's dependencies and unticks its dependents", async () => {
    const user = userEvent.setup();
    const state = renderSelector({ rulesets: { classic: true } });

    // Lodestar uses Delve, so ticking it ticks Delve too.
    await user.click(screen.getByText("Lodestar"));
    expect(state.current.expansions.classic).toEqual({
      delve: true,
      lodestar: true,
    });
    expect(getCheckbox("Delve")).toBeChecked();

    // And unticking Delve unticks Lodestar.
    await user.click(screen.getByText("Delve"));
    expect(state.current.expansions.classic).toEqual({
      delve: false,
      lodestar: false,
    });
  });

  it("offers default playsets once Sundered Isles is ticked", async () => {
    const user = userEvent.setup();
    const state = renderSelector({
      rulesets: { starforged: true },
      expansions: { starforged: { sundered_isles: true } },
    });

    expect(
      screen.getByText("Apply a default playset (optional)"),
    ).toBeInTheDocument();
    const [starforgedPlayset, sunderedIslesPlayset] =
      defaultPlaysets.sundered_isles.playsets;

    await user.click(
      screen.getByRole("button", { name: starforgedPlayset.label }),
    );
    expect(state.current.playset).toEqual(starforgedPlayset.playset);

    await user.click(
      screen.getByRole("button", { name: sunderedIslesPlayset.label }),
    );
    expect(state.current.playset).toEqual(sunderedIslesPlayset.playset);
  });

  it("opens the playset editor", async () => {
    const user = userEvent.setup();
    renderSelector({ rulesets: { elegy: true } });

    await user.click(screen.getByRole("button", { name: "Edit Playset" }));
    const dialog = await screen.findByRole("dialog", { name: "Edit Playset" });
    expect(
      within(dialog).getByText(
        "Checked assets, moves, and oracles will be included in your game.",
      ),
    ).toBeInTheDocument();
  });
});
