/**
 * The cards of the last few rolls, shown over every page (migration slice
 * 10): newest last, three at most, each dismissed on its own or all at once.
 */
import { act, cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useAppState } from "stores/appState.store";

import { TestWrapper } from "tests/TestWrapper";

import { RollResult, RollType } from "repositories/shared.types";

import { IStatRoll, LogType } from "services/gameLog.service";

import { RollSnackbarSection } from "../RollSnackbarSection";

vi.mock("lib/supabase.lib", () => ({ supabase: {} }));

function statRoll(id: string, rollLabel: string): IStatRoll {
  return {
    id,
    logType: LogType.ROLL,
    timestamp: new Date(0),
    gameId: "game",
    characterId: null,
    uid: "uid",
    guidesOnly: false,
    type: RollType.Stat,
    rollLabel,
    statKey: "edge",
    action: 3,
    actionTotal: 5,
    challenge1: 4,
    challenge2: 7,
    modifier: 2,
    adds: 0,
    matchedNegativeMomentum: false,
    momentumBurned: null,
    result: RollResult.WeakHit,
  };
}

function addRolls(...labels: string[]) {
  act(() => {
    labels.forEach((label) =>
      useAppState.getState().addRoll(undefined, statRoll(label, label)),
    );
  });
}

function renderRolls() {
  return render(<RollSnackbarSection isPage />, { wrapper: TestWrapper });
}

afterEach(() => {
  cleanup();
  act(() => useAppState.getState().clearAllRolls());
});

describe("recent rolls", () => {
  it("shows the three newest rolls in a named region", () => {
    renderRolls();
    addRolls("Edge", "Heart", "Iron", "Shadow");

    const region = screen.getByRole("region", { name: "Recent rolls" });
    expect(within(region).queryByText(/^Edge: /)).not.toBeInTheDocument();
    for (const label of ["Heart", "Iron", "Shadow"]) {
      expect(
        within(region).getByRole("button", { name: `Dismiss ${label}` }),
      ).toBeInTheDocument();
    }
  });

  it("dismisses one roll and keeps focus on the next one's dismiss button", async () => {
    const user = userEvent.setup();
    renderRolls();
    addRolls("Edge", "Heart");

    await user.click(screen.getByRole("button", { name: "Dismiss Edge" }));
    expect(
      useAppState.getState().visibleRolls.map(({ roll }) => roll.id),
    ).toEqual(["Heart"]);
    expect(screen.getByRole("button", { name: "Dismiss Heart" })).toHaveFocus();
  });

  it("clears every roll at once and says so", async () => {
    const user = userEvent.setup();
    renderRolls();
    addRolls("Edge", "Heart");

    await user.click(screen.getByRole("button", { name: /clear all/i }));
    expect(useAppState.getState().visibleRolls).toHaveLength(0);
    expect(useAppState.getState().announcement).toBe("Cleared recent rolls");
  });
});
