import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ThemeProvider } from "providers/ThemeProvider";

import { useAppState } from "stores/appState.store";

import { RULESETS, loadRules } from "tests/datasworn/rulesets";

import { DataswornDialog } from "../DataswornDialog";

vi.mock("pages/games/hooks/useRollOracleAndAddToLog", () => ({
  useRollOracleAndAddToLog: () => vi.fn(),
}));

const FACE_DANGER = "move:starforged/adventure/face_danger";
const ACTION = "oracle_rollable:starforged/core/action";

function renderDialog() {
  render(
    <ThemeProvider>
      <MemoryRouter>
        <DataswornDialog />
      </MemoryRouter>
    </ThemeProvider>,
  );
}

function open(id: string) {
  act(() => useAppState.getState().openDataswornDialog(id));
}

describe("DataswornDialog", () => {
  beforeEach(() => {
    loadRules(RULESETS.starforged);
    act(() => useAppState.getState().closeDataswornDialog());
  });

  it("shows a move, named by its title alone", () => {
    renderDialog();
    open(FACE_DANGER);
    const dialog = screen.getByRole("dialog", { name: "Face Danger" });
    expect(
      within(dialog).getByRole("heading", { name: "Face Danger" }),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByText(/When you attempt something/),
    ).toBeVisible();
  });

  it("shows an oracle with its table and a roll button", () => {
    renderDialog();
    open(ACTION);
    const dialog = screen.getByRole("dialog", { name: "Action" });
    expect(
      within(dialog).getByRole("button", { name: "Roll Action" }),
    ).toBeInTheDocument();
    expect(within(dialog).getByRole("table")).toBeInTheDocument();
    expect(within(dialog).getByText("Abandon")).toBeInTheDocument();
  });

  it("goes back to the item it opened from", async () => {
    const user = userEvent.setup();
    renderDialog();
    open(FACE_DANGER);
    expect(
      within(screen.getByRole("dialog")).queryByRole("button", {
        name: "Back to previous item",
      }),
    ).not.toBeInTheDocument();
    open(ACTION);
    expect(screen.getByRole("dialog", { name: "Action" })).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: "Back to previous item" }),
    );
    expect(
      screen.getByRole("dialog", { name: "Face Danger" }),
    ).toBeInTheDocument();
  });

  it("closes from its close button", async () => {
    const user = userEvent.setup();
    renderDialog();
    open(FACE_DANGER);
    await user.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: /^Close/,
      }),
    );
    expect(useAppState.getState().dataswornDialogState.isOpen).toBe(false);
  });

  it("says when a linked item can't be found", async () => {
    const user = userEvent.setup();
    renderDialog();
    open("move:starforged/adventure/not_a_move");
    const dialog = screen.getByRole("dialog", { name: "Could not find item" });
    expect(
      within(dialog).getByText(
        "The linked item with id move:starforged/adventure/not_a_move could not be found.",
      ),
    ).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "Close" }));
    expect(useAppState.getState().dataswornDialogState.isOpen).toBe(false);
  });
});
