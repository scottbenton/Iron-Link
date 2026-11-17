import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PropsWithChildren } from "react";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { useAppState } from "stores/appState.store";

import { TestWrapper } from "tests/TestWrapper";

import { RollResult, RollType } from "repositories/shared.types";

import { IStatRoll, LogType } from "services/gameLog.service";

import { RollSnackbarSection } from "../RollSnackbarSection";

function makeRoll(id: string, rollLabel: string): IStatRoll {
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
    statKey: rollLabel.toLowerCase(),
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

const labels = ["Edge", "Heart", "Iron", "Shadow"];

function Wrapper(props: PropsWithChildren) {
  return (
    <MemoryRouter>
      <TestWrapper>{props.children}</TestWrapper>
    </MemoryRouter>
  );
}

function renderStack(count: number) {
  useAppState.setState({
    visibleRolls: labels
      .slice(0, count)
      .map((label, index) => ({ roll: makeRoll(`roll-${index}`, label) })),
  });
  return render(<RollSnackbarSection isPage />, { wrapper: Wrapper });
}

describe("RollSnackbarSection", () => {
  beforeEach(() => {
    useAppState.setState({ visibleRolls: [], rollCardHosts: [] });
  });

  it("shows the newest roll in full, older ones only as edges", () => {
    renderStack(4);

    const stack = screen.getByRole("region", { name: "Recent rolls" });
    expect(
      within(stack).getByRole("button", { name: "Dismiss Shadow" }),
    ).toBeInTheDocument();
    expect(
      within(stack).queryByRole("button", { name: "Dismiss Iron" }),
    ).not.toBeInTheDocument();
    expect(within(stack).queryByText(/Edge: Weak Hit/)).not.toBeInTheDocument();

    const peeks = within(stack).getAllByTestId("roll-stack-peek");
    expect(peeks).toHaveLength(2);
    peeks.forEach((peek) => {
      expect(peek).toHaveAttribute("aria-hidden", "true");
      expect(peek).toBeEmptyDOMElement();
    });

    expect(
      within(stack).getByRole("button", { name: "4 rolls" }),
    ).toHaveAttribute("aria-haspopup", "dialog");
  });

  it("rings a new roll once, not the cards already there", async () => {
    renderStack(1);
    expect(screen.queryByTestId("roll-stack-new-ring")).toBe(null);

    act(() => {
      useAppState.getState().addRoll(undefined, makeRoll("roll-new", "Wits"));
    });
    expect(screen.getByTestId("roll-stack-new-ring")).toHaveAttribute(
      "aria-hidden",
      "true",
    );

    // Dismissing it uncovers an older card, which gets no ring.
    await userEvent.click(screen.getByRole("button", { name: "Dismiss Wits" }));
    expect(
      screen.getByRole("button", { name: "Dismiss Edge" }),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("roll-stack-new-ring")).toBe(null);
  });

  it("shows no handle for a single roll", () => {
    renderStack(1);

    const stack = screen.getByRole("region", { name: "Recent rolls" });
    expect(within(stack).queryByRole("button", { name: /rolls/ })).toBe(null);
    expect(within(stack).queryAllByTestId("roll-stack-peek")).toHaveLength(0);
  });

  it("lists every recent roll in a dialog, newest first", async () => {
    renderStack(4);

    await userEvent.click(screen.getByRole("button", { name: "4 rolls" }));

    const dialog = await screen.findByRole("dialog", { name: "Recent rolls" });
    const dismissButtons = within(dialog).getAllByRole("button", {
      name: /^Dismiss/,
    });
    expect(
      dismissButtons.map((button) => button.getAttribute("aria-label")),
    ).toEqual([
      "Dismiss Shadow",
      "Dismiss Iron",
      "Dismiss Heart",
      "Dismiss Edge",
    ]);
  });

  it("dismisses a roll from the dialog and moves focus to the next", async () => {
    renderStack(3);
    await userEvent.click(screen.getByRole("button", { name: "3 rolls" }));
    const dialog = await screen.findByRole("dialog", { name: "Recent rolls" });

    await userEvent.click(
      within(dialog).getByRole("button", { name: "Dismiss Heart" }),
    );

    expect(
      within(dialog).queryByRole("button", { name: "Dismiss Heart" }),
    ).not.toBeInTheDocument();
    expect(useAppState.getState().visibleRolls).toHaveLength(2);
    await waitFor(() =>
      expect(
        within(dialog).getByRole("button", { name: "Dismiss Edge" }),
      ).toHaveFocus(),
    );
  });

  it("clears every roll from the dialog", async () => {
    renderStack(3);
    await userEvent.click(screen.getByRole("button", { name: "3 rolls" }));
    const dialog = await screen.findByRole("dialog", { name: "Recent rolls" });

    await userEvent.click(
      within(dialog).getByRole("button", { name: "Clear all" }),
    );

    expect(useAppState.getState().visibleRolls).toHaveLength(0);
    await waitFor(() =>
      expect(within(dialog).getByText("No recent rolls")).toHaveFocus(),
    );
  });
});

describe("RollSnackbarSection long results", () => {
  const scrollHeight = Object.getOwnPropertyDescriptor(
    HTMLElement.prototype,
    "scrollHeight",
  );
  const clientHeight = Object.getOwnPropertyDescriptor(
    HTMLElement.prototype,
    "clientHeight",
  );

  beforeEach(() => {
    useAppState.setState({ visibleRolls: [], rollCardHosts: [] });
    // jsdom lays nothing out: a clamped card holds more than it shows.
    Object.defineProperty(HTMLElement.prototype, "scrollHeight", {
      configurable: true,
      get(this: HTMLElement) {
        return this.dataset.clamped === "true" ? 400 : 0;
      },
    });
    Object.defineProperty(HTMLElement.prototype, "clientHeight", {
      configurable: true,
      get(this: HTMLElement) {
        return this.dataset.clamped === "true" ? 192 : 0;
      },
    });
  });

  afterEach(() => {
    if (scrollHeight) {
      Object.defineProperty(
        HTMLElement.prototype,
        "scrollHeight",
        scrollHeight,
      );
    }
    if (clientHeight) {
      Object.defineProperty(
        HTMLElement.prototype,
        "clientHeight",
        clientHeight,
      );
    }
  });

  it("clamps a long card with a Show all toggle", async () => {
    renderStack(1);

    const toggle = screen.getByRole("button", { name: "Show all" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");

    await userEvent.click(toggle);
    expect(screen.getByRole("button", { name: "Show less" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );

    await userEvent.click(screen.getByRole("button", { name: "Show less" }));
    expect(screen.getByRole("button", { name: "Show all" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });
});
