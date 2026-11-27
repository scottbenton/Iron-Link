import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { RULESETS, loadRules } from "tests/datasworn/rulesets";

import { Oracle } from "../Oracle";

const rollOracle = vi.hoisted(() => vi.fn(() => ({ result: undefined })));
vi.mock("pages/games/hooks/useRollOracleAndAddToLog", () => ({
  useRollOracleAndAddToLog: () => rollOracle,
}));

describe("Oracle", () => {
  beforeEach(() => {
    rollOracle.mockClear();
    loadRules(RULESETS.starforged);
  });

  it("shows the oracle's rows and rolls it", async () => {
    render(<Oracle oracleId="oracle_rollable:starforged/core/action" />);
    const table = screen.getByRole("table");
    expect(
      within(table).getByRole("columnheader", { name: "Roll" }),
    ).toBeInTheDocument();
    expect(
      within(table).getByRole("columnheader", { name: "Result" }),
    ).toBeInTheDocument();
    expect(within(table).getByRole("cell", { name: "Abandon" })).toBeVisible();
    await userEvent.click(screen.getByRole("button", { name: "Roll Action" }));
    // Rolls the oracle that replaces it in the loaded rules, if any.
    expect(rollOracle).toHaveBeenCalledWith(
      expect.stringMatching(/\/core\/action$/),
    );
  });

  it("offers a cursed oracle's variant as a second tab", async () => {
    // Sundered Isles tags an oracle with the one the cursed die swaps in.
    render(<Oracle oracleId="oracle_rollable:sundered_isles/cave/threshold" />);
    const tabs = screen.getAllByRole("tab");
    expect(tabs).toHaveLength(2);
    expect(tabs[1]).toHaveAccessibleName(/Cursed/);
    expect(tabs[0]).toHaveAttribute("aria-selected", "true");
    await userEvent.click(tabs[1]);
    expect(tabs[1]).toHaveAttribute("aria-selected", "true");
  });

  it("says when the oracle can't be found", () => {
    render(<Oracle oracleId="oracle_rollable:starforged/core/not_here" />);
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });
});
