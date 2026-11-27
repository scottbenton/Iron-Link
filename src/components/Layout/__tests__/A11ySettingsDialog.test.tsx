import { ThemeProvider } from "@mui/material";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";

import { getTheme } from "providers/ThemeProvider/themes/themeConfig";

import { useAccessibilityState } from "stores/accessibility.store";
import { useAppState } from "stores/appState.store";

import { ColorScheme } from "repositories/shared.types";

import { A11ySettingsDialog } from "../A11ySettingsDialog";

// Characterization tests for Accessibility Settings (slice 5).

function renderDialog() {
  return render(
    <ThemeProvider theme={getTheme(ColorScheme.Default)}>
      <A11ySettingsDialog open onClose={() => {}} />
    </ThemeProvider>,
  );
}

beforeEach(() => {
  useAccessibilityState.setState({ modifierKey: undefined, keybinds: {} });
});

describe("A11ySettingsDialog", () => {
  it("chooses the modifier key for focus shortcuts", async () => {
    const user = userEvent.setup();
    renderDialog();
    const dialog = screen.getByRole("dialog", {
      name: "Accessibility Settings",
    });
    const group = within(dialog).getByRole("radiogroup", {
      name: "Modifier Key",
    });
    expect(
      within(group).getByRole("radio", { name: "Disabled" }),
    ).toBeChecked();

    // The labels: jsdom has no PointerEvent for a press on the radio itself.
    await user.click(within(group).getByText("Alt/Option"));
    expect(useAccessibilityState.getState().modifierKey).toBe("Alt");

    await user.click(within(group).getByText("Disabled"));
    expect(useAccessibilityState.getState().modifierKey).toBeUndefined();
  });

  it("sets an action's key from the next key pressed", async () => {
    const user = userEvent.setup();
    renderDialog();
    const row = screen.getByRole("row", { name: /Notes Section/ });
    await user.click(within(row).getByRole("button", { name: "Set" }));
    expect(
      within(row).getByRole("button", { name: "Listening" }),
    ).toBeInTheDocument();

    await user.keyboard("n");
    expect(useAccessibilityState.getState().keybinds["notes-section"]).toBe(
      "n",
    );
    expect(useAppState.getState().announcement).toBe("Key set to n");
    expect(
      within(row).getByRole("button", { name: "Set" }),
    ).toBeInTheDocument();
  });

  it("stops listening on Escape without setting a key or closing", async () => {
    const user = userEvent.setup();
    useAccessibilityState.setState({ keybinds: { "notes-section": "n" } });
    renderDialog();
    const row = screen.getByRole("row", { name: /Notes Section/ });
    await user.click(within(row).getByRole("button", { name: "Set" }));

    await user.keyboard("{Escape}");
    expect(useAccessibilityState.getState().keybinds["notes-section"]).toBe(
      "n",
    );
    expect(
      within(row).getByRole("button", { name: "Set" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("dialog", { name: "Accessibility Settings" }),
    ).toBeInTheDocument();
  });

  it("labels the shortcut table's columns", () => {
    renderDialog();
    const table = screen.getByRole("table", { name: "Keybindings" });
    expect(
      within(table)
        .getAllByRole("columnheader")
        .map((cell) => cell.textContent),
    ).toEqual(["Action", "Key", "Change"]);
  });
});
