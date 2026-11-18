import { Datasworn } from "@datasworn-community/core";
import delve from "@datasworn-community/ironsworn-classic-delve/json/delve.json";
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { MoveOracles } from "../MoveOracles";

vi.mock("pages/games/hooks/useRollOracleAndAddToLog", () => ({
  useRollOracleAndAddToLog: () => vi.fn(),
}));

const delveMoves = (delve as unknown as Datasworn.RulesPackage).moves!.delve
  .contents as Record<string, Datasworn.Move>;

describe("MoveOracles", () => {
  it("puts every roll button before the first table", () => {
    render(<MoveOracles move={delveMoves.delve_the_depths} />);

    const rolls = screen.getByRole("group", {
      name: "Delve the Depths rolls",
    });
    expect(
      within(rolls)
        .getAllByRole("button")
        .map((button) => button.textContent),
    ).toEqual(["Roll Edge", "Roll Shadow", "Roll Wits"]);

    const firstTable = screen.getAllByRole("table")[0];
    expect(
      rolls.compareDocumentPosition(firstTable) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("names each table and shows its name", () => {
    render(<MoveOracles move={delveMoves.delve_the_depths} />);

    for (const name of ["Edge", "Shadow", "Wits"]) {
      expect(screen.getByRole("table", { name })).toBeInTheDocument();
      expect(screen.getByText(name, { selector: "p" })).toBeVisible();
    }
  });

  it("names a move's only table without repeating it on screen", () => {
    render(<MoveOracles move={delveMoves.reveal_a_danger} />);

    expect(
      screen.getByRole("table", { name: "Reveal a Danger" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Reveal a Danger", { selector: "p" }),
    ).not.toBeInTheDocument();
  });
});
