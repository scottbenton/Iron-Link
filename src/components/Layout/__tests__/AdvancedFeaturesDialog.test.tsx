import { ThemeProvider } from "@mui/material";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getTheme } from "providers/ThemeProvider/themes/themeConfig";

import { useAdvancedFeatureToggles } from "hooks/advancedFeatures/advancedFeatures";

import { ColorScheme } from "repositories/shared.types";

import { AdvancedFeaturesDialog } from "../AdvancedFeaturesDialog";

// Characterization tests for Advanced Features (slice 5).

vi.mock("lib/supabase.lib", () => ({ supabase: {} }));

function renderDialog() {
  return render(
    <ThemeProvider theme={getTheme(ColorScheme.Default)}>
      <AdvancedFeaturesDialog open onClose={() => {}} />
    </ThemeProvider>,
  );
}

beforeEach(() => {
  useAdvancedFeatureToggles.setState({
    toggles: { secondScreen: false, worlds: true },
  });
});

describe("AdvancedFeaturesDialog", () => {
  it("shows each feature with its description and turns it on and off", async () => {
    const user = userEvent.setup();
    renderDialog();
    const dialog = screen.getByRole("dialog", { name: "Advanced Features" });

    const secondScreen = within(dialog).getByRole("checkbox", {
      name: "Second Screen Options",
    });
    const worlds = within(dialog).getByRole("checkbox", {
      name: "Worlds (Beta)",
    });
    expect(secondScreen).not.toBeChecked();
    expect(worlds).toBeChecked();
    expect(
      within(dialog).getByText(/Adds toggles for guide-level players/),
    ).toBeInTheDocument();

    await user.click(secondScreen);
    expect(useAdvancedFeatureToggles.getState().toggles.secondScreen).toBe(
      true,
    );
    await user.click(worlds);
    expect(useAdvancedFeatureToggles.getState().toggles.worlds).toBe(false);
  });
});
