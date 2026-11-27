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

    await user.click(within(group).getByRole("radio", { name: "Alt/Option" }));
    expect(useAccessibilityState.getState().modifierKey).toBe("Alt");

    await user.click(within(group).getByRole("radio", { name: "Disabled" }));
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
});
