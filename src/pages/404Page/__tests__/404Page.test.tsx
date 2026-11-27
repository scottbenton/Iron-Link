import { ThemeProvider } from "@mui/material";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";

import { getTheme } from "providers/ThemeProvider/themes/themeConfig";

import { ColorScheme } from "repositories/shared.types";

import { Page404 } from "../404Page";

// Characterization tests for the 404 page (slice 5).

describe("Page404", () => {
  it("says the page is missing and links back to the games", () => {
    render(
      <ThemeProvider theme={getTheme(ColorScheme.Default)}>
        <MemoryRouter initialEntries={["/nowhere"]}>
          <Page404 />
        </MemoryRouter>
      </ThemeProvider>,
    );

    expect(
      screen.getByRole("heading", { level: 1, name: "Page Not Found" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Sorry, the page you are looking for does not exist."),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to Games" })).toHaveAttribute(
      "href",
      "/games",
    );
    expect(document.title).toBe("Page Not Found | Iron Link");
  });
});
