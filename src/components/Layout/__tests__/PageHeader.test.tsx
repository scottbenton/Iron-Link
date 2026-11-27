import { ThemeProvider } from "@mui/material";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { getTheme } from "providers/ThemeProvider/themes/themeConfig";

import { ColorScheme } from "repositories/shared.types";

import { PageContent } from "../PageContent";
import { PageHeader } from "../PageHeader";

// Characterization tests for the page header and content (slice 5).

function renderPage() {
  return render(
    <ThemeProvider theme={getTheme(ColorScheme.Default)}>
      <PageHeader
        label="Your Games"
        subLabel="Last updated today"
        actions={<button>Create Game</button>}
      />
      <PageContent>
        <p>Page body</p>
      </PageContent>
    </ThemeProvider>,
  );
}

describe("PageHeader", () => {
  it("names the page with its one h1 and shows its actions and subtitle", () => {
    renderPage();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(
      screen.getByRole("heading", { level: 1, name: "Your Games" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Last updated today")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Create Game" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Page body")).toBeInTheDocument();
  });
});
