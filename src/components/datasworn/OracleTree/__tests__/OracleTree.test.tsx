/**
 * The game's oracle list: rows that roll (secretly for a Guide), a view of
 * the full table, shared-text collections rolled through their chosen
 * table, the Ask the Oracle odds, and the filter.
 */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { useAppState } from "stores/appState.store";
import { GamePermission, useGameStore } from "stores/game.store";

import { TestWrapper } from "tests/TestWrapper";
import { RULESETS, loadRules } from "tests/datasworn/rulesets";

import { OracleTree } from "../OracleTree";

const rollOracle = vi.fn();
vi.mock("pages/games/hooks/useRollOracleAndAddToLog", () => ({
  useRollOracleAndAddToLog: () => rollOracle,
}));
// Oracle rows measure their secondary action.
vi.stubGlobal(
  "ResizeObserver",
  class {
    observe() {}
    unobserve() {}
    disconnect() {}
  },
);

const ACTION = "oracle_rollable:starforged/core/action";
const BASIC_FORM = "oracle_collection:starforged/creature/basic_form";
const openDataswornDialog = vi.fn();

function renderTree() {
  return render(<OracleTree />, { wrapper: TestWrapper });
}

async function filter(text: string) {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText("Filter Oracles"), text);
  return user;
}

beforeAll(() => {
  loadRules(RULESETS.starforged.slice(0, 1));
});

beforeEach(() => {
  vi.clearAllMocks();
  useGameStore.setState({ gamePermissions: GamePermission.Player });
  useAppState.setState({ openDataswornDialog });
});

describe("OracleTree", () => {
  it("rolls a filtered oracle from its row", async () => {
    renderTree();
    const user = await filter("Action");

    await user.click(
      screen.getAllByRole("button", { name: /^(roll )?action$/i })[0],
    );
    expect(rollOracle).toHaveBeenCalledWith(ACTION, false);
  });

  it("rolls secretly for a Guide", async () => {
    useGameStore.setState({ gamePermissions: GamePermission.Guide });
    renderTree();
    const user = await filter("Action");

    await user.click(
      screen.getAllByRole("button", { name: /^(roll )?action$/i })[0],
    );
    expect(rollOracle).toHaveBeenCalledWith(ACTION, true);
  });

  it("opens an oracle's full table", async () => {
    renderTree();
    const user = await filter("Action");

    await user.click(
      screen.getAllByRole("button", {
        name: /view (full )?table for action$/i,
      })[0],
    );
    expect(openDataswornDialog).toHaveBeenCalledWith(ACTION);
  });

  it("rolls a shared-text collection through its chosen table", async () => {
    renderTree();
    const user = await filter("Creature Basic Form");

    const row = screen.getByRole("button", {
      name: /^(roll )?creature basic form$/i,
    });
    await user.click(row);
    expect(rollOracle).toHaveBeenLastCalledWith(
      `${BASIC_FORM.replace("oracle_collection", "oracle_rollable")}/space`,
      false,
    );

    await user.click(
      screen.getByRole("combobox", { name: "Creature Basic Form option" }),
    );
    await user.click(await screen.findByRole("option", { name: "Air" }));
    await user.click(row);
    expect(rollOracle).toHaveBeenLastCalledWith(
      `${BASIC_FORM.replace("oracle_collection", "oracle_rollable")}/air`,
      false,
    );

    await user.click(
      screen.getByRole("button", {
        name: /view (full )?table for creature basic form$/i,
      }),
    );
    expect(openDataswornDialog).toHaveBeenCalledWith(BASIC_FORM);
  });

  it("asks the oracle at the chosen odds", async () => {
    const user = userEvent.setup();
    renderTree();

    await user.click(screen.getByRole("button", { name: /almost certain/i }));
    expect(rollOracle).toHaveBeenCalledWith(
      "oracle_rollable:ironlink/ask_the_oracle/almost_certain",
      false,
    );
  });

  it("hides oracles the filter doesn't match", async () => {
    renderTree();
    await filter("Creature Basic Form");

    expect(
      screen.queryByRole("button", { name: /^(roll )?action$/i }),
    ).not.toBeInTheDocument();
  });
});
