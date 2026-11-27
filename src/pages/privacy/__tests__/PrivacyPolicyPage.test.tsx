import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { TestWrapper } from "tests/TestWrapper";

import PrivacyPolicyPage from "../PrivacyPolicyPage";

// Characterization tests for the privacy policy (slice 6).

vi.mock("lib/supabase.lib", () => ({ supabase: {} }));
vi.mock("hooks/useSendPageViewEvents", () => ({
  PageCategory: { Privacy: "privacy" },
  useSendPageViewEvent: () => {},
}));

function renderPage() {
  return render(
    <TestWrapper>
      <PrivacyPolicyPage />
    </TestWrapper>,
  );
}

describe("PrivacyPolicyPage", () => {
  it("names the page and when it last changed", () => {
    renderPage();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(
      screen.getByRole("heading", { level: 1, name: "Privacy Policy" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Last updated October 4, 2026"),
    ).toBeInTheDocument();
    expect(document.title).toBe("Privacy Policy | Iron Link");
  });

  it("has a heading for each section", () => {
    renderPage();
    expect(
      screen
        .getAllByRole("heading", { level: 2 })
        .map((heading) => heading.textContent)
        .filter((text) => text !== "Last updated October 4, 2026"),
    ).toEqual([
      "Information we collect",
      "How we use your information",
      "Services we rely on",
      "Cookies and local storage",
      "How long we keep your data",
      "Your choices and rights",
      "Children",
      "Changes to this policy",
      "Contact",
    ]);
  });

  it("gives an address to write to", () => {
    renderPage();
    const links = screen.getAllByRole("link", {
      name: "scott@scottbenton.dev",
    });
    expect(links.length).toBeGreaterThan(0);
    for (const link of links) {
      expect(link).toHaveAttribute("href", "mailto:scott@scottbenton.dev");
    }
  });

  it("lists what the account holds", () => {
    renderPage();
    const items = screen.getAllByRole("listitem");
    expect(items.length).toBeGreaterThan(2);
    expect(
      screen.getByText(/we never sell your data/, { exact: false }),
    ).toBeInTheDocument();
  });
});
