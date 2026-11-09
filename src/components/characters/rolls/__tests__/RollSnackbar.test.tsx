import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { TestWrapper } from "tests/TestWrapper";

import { RollResult, RollType } from "repositories/shared.types";

import { IStatRoll, LogType } from "services/gameLog.service";

import { RollSnackbar } from "../RollSnackbar";

const roll: IStatRoll = {
  id: "roll-1",
  logType: LogType.ROLL,
  timestamp: new Date(0),
  gameId: "game",
  characterId: null,
  uid: "uid",
  guidesOnly: false,
  type: RollType.Stat,
  rollLabel: "Edge",
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

describe("RollSnackbar", () => {
  it("reads as one piece of text, with the dice hidden", () => {
    render(
      <RollSnackbar
        rollId={undefined}
        roll={roll}
        isExpanded
        summaryPrefix={"Kai, today."}
      />,
      { wrapper: TestWrapper },
    );

    expect(
      screen.getByText(
        "Kai, today. Edge: Weak Hit. Action die 3 plus 2, total 5. Challenge dice 4 and 7.",
      ),
    ).toBeInTheDocument();
    // The visible result sits inside the hidden copy.
    expect(screen.getByText("Weak Hit").closest("[aria-hidden]")).not.toBe(
      null,
    );
  });

  it("dismisses only through its named button", async () => {
    const onDismiss = vi.fn();
    render(
      <RollSnackbar
        rollId={undefined}
        roll={roll}
        isExpanded={false}
        onDismiss={onDismiss}
      />,
      { wrapper: TestWrapper },
    );

    await userEvent.click(screen.getByText(/Edge: Weak Hit/));
    expect(onDismiss).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole("button", { name: "Dismiss Edge" }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
