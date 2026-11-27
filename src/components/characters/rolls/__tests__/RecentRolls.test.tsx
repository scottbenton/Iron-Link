/**
 * The cards of the last few rolls (migration slice 10): newest last, three
 * at most, each dismissed on its own or all at once. They are toasts over
 * the page, the activity dock on a phone's game page, and a copy of their
 * own inside an MUI dialog, which hides the toasts from screen readers.
 */
import {
  act,
  cleanup,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { toast } from "ui/components/Toast";

import { useAppState } from "stores/appState.store";

import { TestWrapper } from "tests/TestWrapper";

import { RollResult, RollType } from "repositories/shared.types";

import { IStatRoll, LogType } from "services/gameLog.service";

import { RecentRolls } from "../RecentRolls";
import { RecentRollsDock } from "../RecentRollsDock";
import { RecentRollsInDialog } from "../RecentRollsInDialog";

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

function shownRollIds() {
  return useAppState.getState().visibleRolls.map(({ roll }) => roll.id);
}

afterEach(async () => {
  act(() => toast.dismissAll());
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 250));
  });
  cleanup();
  act(() => useAppState.getState().clearAllRolls());
});

describe("recent rolls over the page", () => {
  it("shows the three newest rolls as toasts", async () => {
    render(<RecentRolls />, { wrapper: TestWrapper });
    addRolls("Edge", "Heart", "Iron", "Shadow");

    for (const label of ["Heart", "Iron", "Shadow"]) {
      expect(
        await screen.findByRole("button", { name: `Dismiss ${label}` }),
      ).toBeInTheDocument();
    }
    expect(
      screen.queryByRole("button", { name: "Dismiss Edge" }),
    ).not.toBeInTheDocument();
  });

  it("clears a roll when its card is dismissed", async () => {
    const user = userEvent.setup();
    render(<RecentRolls />, { wrapper: TestWrapper });
    addRolls("Edge", "Heart");

    await user.click(
      await screen.findByRole("button", { name: "Dismiss Edge" }),
    );
    await waitFor(() => expect(shownRollIds()).toEqual(["Heart"]));
  });

  it("clears every roll with the toasts' Clear All", async () => {
    const user = userEvent.setup();
    render(<RecentRolls />, { wrapper: TestWrapper });
    addRolls("Edge", "Heart");

    await user.click(await screen.findByRole("button", { name: /clear all/i }));
    await waitFor(() => expect(shownRollIds()).toEqual([]));
  });

  it("steps aside for a dialog's copy and comes back, keeping the rolls", async () => {
    const { rerender } = render(
      <RecentRolls>
        <RecentRollsInDialog />
      </RecentRolls>,
      { wrapper: TestWrapper },
    );
    addRolls("Edge");

    const region = screen.getByRole("region", { name: "Recent rolls" });
    expect(
      within(region).getByRole("button", { name: "Dismiss Edge" }),
    ).toBeInTheDocument();
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 250));
    });
    expect(
      screen.getAllByRole("button", { name: "Dismiss Edge" }),
    ).toHaveLength(1);

    rerender(<RecentRolls />);
    expect(
      await screen.findByRole("button", { name: "Dismiss Edge" }),
    ).toBeInTheDocument();
    expect(shownRollIds()).toEqual(["Edge"]);
  });
});

describe("recent rolls in an MUI dialog", () => {
  it("shows them in a named region", () => {
    render(<RecentRollsInDialog />, { wrapper: TestWrapper });
    addRolls("Edge", "Heart");

    const region = screen.getByRole("region", { name: "Recent rolls" });
    for (const label of ["Edge", "Heart"]) {
      expect(
        within(region).getByRole("button", { name: `Dismiss ${label}` }),
      ).toBeInTheDocument();
    }
  });

  it("dismisses one roll and keeps focus on the next one's dismiss button", async () => {
    const user = userEvent.setup();
    render(<RecentRollsInDialog />, { wrapper: TestWrapper });
    addRolls("Edge", "Heart");

    await user.click(screen.getByRole("button", { name: "Dismiss Edge" }));
    expect(shownRollIds()).toEqual(["Heart"]);
    expect(screen.getByRole("button", { name: "Dismiss Heart" })).toHaveFocus();
  });

  it("clears every roll at once and says so", async () => {
    const user = userEvent.setup();
    render(<RecentRollsInDialog />, { wrapper: TestWrapper });
    addRolls("Edge", "Heart");

    await user.click(screen.getByRole("button", { name: /clear all/i }));
    expect(shownRollIds()).toHaveLength(0);
    expect(useAppState.getState().announcement).toBe("Cleared recent rolls");
  });
});

describe("recent rolls on a phone's game page", () => {
  it("docks the newest roll, with the rest behind a count", () => {
    render(<RecentRollsDock />, { wrapper: TestWrapper });
    addRolls("Edge", "Heart");

    const region = screen.getByRole("region", { name: "Recent rolls" });
    expect(
      within(region).getByRole("button", { name: "Dismiss Heart" }),
    ).toBeInTheDocument();
    expect(
      within(region).getByRole("button", { name: "2 recent rolls" }),
    ).toBeInTheDocument();
  });
});
