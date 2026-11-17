import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PropsWithChildren } from "react";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { MAIN_CONTENT_ID } from "components/Layout/SkipToContentButton";

import {
  ReferenceTabs,
  getReferenceTabId,
  useAppState,
} from "stores/appState.store";

import { TestWrapper } from "tests/TestWrapper";

import { RollResult, RollType } from "repositories/shared.types";

import { IStatRoll, LogType } from "services/gameLog.service";

import { RollSnackbarSection } from "../RollSnackbarSection";

const layout = vi.hoisted(() => ({
  isMobile: true,
  gameId: undefined as string | undefined,
}));
vi.mock("hooks/useIsMobile", () => ({ useIsMobile: () => layout.isMobile }));
vi.mock("pages/games/gamePageLayout/hooks/useGameId", () => ({
  useGameId: () => layout.gameId,
  useGameIdOptional: () => layout.gameId,
}));

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
  return render(
    <>
      <main id={MAIN_CONTENT_ID} tabIndex={-1}>
        <h1>Game</h1>
        <button id={getReferenceTabId(ReferenceTabs.GameLog)}>Game Log</button>
      </main>
      <RollSnackbarSection isPage />
    </>,
    { wrapper: Wrapper },
  );
}

function resetState(isMobile: boolean) {
  layout.isMobile = isMobile;
  layout.gameId = undefined;
  useAppState.setState({
    visibleRolls: [],
    rollCardHosts: [],
    currentReferenceTab: ReferenceTabs.Moves,
    isReferencePanelVisible: true,
  });
}

describe("RollSnackbarSection on phones", () => {
  beforeEach(() => {
    resetState(true);
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

  it("clears every roll and closes the dialog", async () => {
    renderStack(3);
    await userEvent.click(screen.getByRole("button", { name: "3 rolls" }));
    const dialog = await screen.findByRole("dialog", { name: "Recent rolls" });

    await userEvent.click(
      within(dialog).getByRole("button", { name: "Clear all" }),
    );

    expect(useAppState.getState().visibleRolls).toHaveLength(0);
    await waitFor(() =>
      expect(
        screen.queryByRole("dialog", { name: "Recent rolls" }),
      ).not.toBeInTheDocument(),
    );
    // The handle that opened it went with the rolls, so focus goes to the
    // start of the page.
    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "Game" })).toHaveFocus(),
    );
  });

  it("offers no Visit the log button", () => {
    layout.gameId = "game";
    renderStack(3);

    expect(
      screen.queryByRole("button", { name: "Visit the log" }),
    ).not.toBeInTheDocument();
  });
});

describe("RollSnackbarSection on wider screens", () => {
  beforeEach(() => {
    resetState(false);
  });

  function getStack() {
    return screen.getByTestId("roll-stack");
  }

  it("shows the last three rolls, the older two hidden behind the newest", () => {
    renderStack(4);

    const region = screen.getByRole("region", { name: "Recent rolls" });
    expect(getStack()).toHaveAttribute("data-expanded", "false");
    expect(
      within(region).getByRole("button", { name: "Dismiss Shadow" }),
    ).toBeInTheDocument();
    expect(
      within(region).queryByRole("button", { name: /Dismiss (Iron|Heart)/ }),
    ).not.toBeInTheDocument();
    expect(within(region).queryByRole("button", { name: "4 rolls" })).toBe(
      null,
    );

    const older = within(region).getAllByTestId("roll-stack-older");
    expect(older).toHaveLength(2);
    older.forEach((card) => {
      expect(card).toHaveAttribute("aria-hidden", "true");
      expect(card).toHaveAttribute("inert");
    });
    // The oldest roll is only in the log.
    expect(
      within(region).queryByRole("button", {
        name: "Dismiss Edge",
        hidden: true,
      }),
    ).not.toBeInTheDocument();
  });

  it("expands while the pointer is over the stack", async () => {
    renderStack(3);

    await userEvent.hover(screen.getByRole("button", { name: "Dismiss Iron" }));

    expect(getStack()).toHaveAttribute("data-expanded", "true");
    screen.getAllByTestId("roll-stack-older").forEach((card) => {
      expect(card).not.toHaveAttribute("aria-hidden");
      expect(card).not.toHaveAttribute("inert");
    });
    expect(
      screen.getByRole("button", { name: "Dismiss Heart" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Dismiss Edge" }),
    ).toBeInTheDocument();

    await userEvent.unhover(getStack());

    expect(getStack()).toHaveAttribute("data-expanded", "false");
    expect(
      screen.queryByRole("button", { name: "Dismiss Heart" }),
    ).not.toBeInTheDocument();
  });

  it("expands while focus is inside the stack", async () => {
    renderStack(3);

    act(() => {
      screen.getByRole("button", { name: "Dismiss Iron" }).focus();
    });
    expect(getStack()).toHaveAttribute("data-expanded", "true");

    // Older cards are reachable while it is open.
    const older = screen.getByRole("button", { name: "Dismiss Heart" });
    act(() => older.focus());
    expect(older).toHaveFocus();
    expect(getStack()).toHaveAttribute("data-expanded", "true");

    act(() => {
      screen.getByRole("button", { name: "Game Log" }).focus();
    });
    expect(getStack()).toHaveAttribute("data-expanded", "false");
  });

  it("dismisses an older card and keeps focus in the stack", async () => {
    renderStack(3);
    act(() => {
      screen.getByRole("button", { name: "Dismiss Iron" }).focus();
    });

    await userEvent.click(
      screen.getByRole("button", { name: "Dismiss Heart" }),
    );

    expect(
      useAppState.getState().visibleRolls.map(({ roll }) => roll.rollLabel),
    ).toEqual(["Edge", "Iron"]);
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Dismiss Edge" }),
      ).toHaveFocus(),
    );
    expect(getStack()).toHaveAttribute("data-expanded", "true");
  });

  it("opens the game log from Visit the log", async () => {
    layout.gameId = "game";
    renderStack(2);

    await userEvent.click(
      screen.getByRole("button", { name: "Visit the log" }),
    );

    expect(useAppState.getState().currentReferenceTab).toBe(
      ReferenceTabs.GameLog,
    );
    expect(screen.getByRole("button", { name: "Game Log" })).toHaveFocus();
    // The log is on screen now, so the button goes.
    expect(
      screen.queryByRole("button", { name: "Visit the log" }),
    ).not.toBeInTheDocument();
  });

  it("offers Visit the log only in a game", () => {
    renderStack(2);

    expect(
      screen.queryByRole("button", { name: "Visit the log" }),
    ).not.toBeInTheDocument();
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
    resetState(true);
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
