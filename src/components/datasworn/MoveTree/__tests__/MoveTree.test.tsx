/**
 * The game's move list: categories that open, moves that open in place to
 * show their rolls and text, and the filter.
 */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, describe, expect, it, vi } from "vitest";

import { TestWrapper } from "tests/TestWrapper";
import { RULESETS, loadRules } from "tests/datasworn/rulesets";

import { MoveTree } from "../MoveTree";

vi.mock("pages/games/hooks/useRollOracleAndAddToLog", () => ({
  useRollOracleAndAddToLog: () => vi.fn(),
}));
vi.mock("pages/games/hooks/useRollStatAndAddToLog", () => ({
  useRollStatAndAddToLog: () => vi.fn(),
}));

function renderTree() {
  return render(<MoveTree />, { wrapper: TestWrapper });
}

beforeAll(() => {
  loadRules(RULESETS.starforged.slice(0, 1));
});

describe("MoveTree", () => {
  it("opens a category, then a move in place", async () => {
    const user = userEvent.setup();
    renderTree();

    expect(
      screen.queryByRole("button", { name: /^face danger$/i }),
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /^adventure moves/i }));

    const move = screen.getByRole("button", { name: /^face danger$/i });
    expect(move).toHaveAttribute("aria-expanded", "false");
    await user.click(move);
    expect(move).toHaveAttribute("aria-expanded", "true");
    expect(
      screen.getByText(/when you attempt something risky/i),
    ).toBeInTheDocument();
  });

  it("shows only the moves the filter matches, with their categories open", async () => {
    const user = userEvent.setup();
    renderTree();

    await user.type(screen.getByLabelText("Filter Moves"), "face danger");

    expect(
      await screen.findByRole("button", { name: /^face danger$/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /^secure an advantage$/i }),
    ).not.toBeInTheDocument();
  });
});
