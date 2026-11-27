import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { TestWrapper } from "tests/TestWrapper";

import HomebrewSelectPage from "../HomebrewSelectPage";

// Characterization tests for the homebrew page (slice 6).

vi.mock("lib/supabase.lib", () => ({ supabase: {} }));
vi.mock("hooks/useSendPageViewEvents", () => ({
  PageCategory: { HomebrewSelect: "homebrew-select" },
  useSendPageViewEvent: () => {},
}));

describe("HomebrewSelectPage", () => {
  it("says homebrew is coming", () => {
    render(
      <TestWrapper>
        <HomebrewSelectPage />
      </TestWrapper>,
    );
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(
      screen.getByRole("heading", { level: 1, name: "Homebrew" }),
    ).toBeInTheDocument();
    expect(document.title).toBe("Homebrew | Iron Link");
    expect(screen.getByText("Coming Soon!")).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Coming Soon!" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText("Homebrew is not yet available in the beta version."),
    ).toBeInTheDocument();
  });
});
