import { ThemeProvider } from "@mui/material";
import { render, screen } from "@testing-library/react";
import { RouterProvider, createMemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getTheme } from "providers/ThemeProvider/themes/themeConfig";

import { ColorScheme } from "repositories/shared.types";

import { ErrorRoute } from "../ErrorRoute";

// Characterization tests for the crash page (slice 5).

const analytics = vi.hoisted(() => ({ logError: vi.fn() }));
vi.mock("services/analytics.service", () => ({
  AnalyticsService: analytics,
}));

function Crash(): never {
  throw new Error("Kaboom");
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("ErrorRoute", () => {
  it("says the app crashed, shows the error and logs it", async () => {
    const router = createMemoryRouter([
      { path: "/", Component: Crash, ErrorBoundary: ErrorRoute },
    ]);
    render(
      <ThemeProvider theme={getTheme(ColorScheme.Default)}>
        <RouterProvider router={router} />
      </ThemeProvider>,
    );

    expect(await screen.findByText("Iron Link Crashed")).toBeInTheDocument();
    expect(screen.getByText(/Kaboom/)).toBeInTheDocument();
    expect(
      screen.getByText(/reach out to me on the discord/),
    ).toBeInTheDocument();
    expect(analytics.logError).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Kaboom" }),
    );
  });
});
