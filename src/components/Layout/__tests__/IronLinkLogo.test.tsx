import { ThemeProvider } from "@mui/material";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { getTheme } from "providers/ThemeProvider/themes/themeConfig";

import { ColorScheme } from "repositories/shared.types";

import { IronLinkLogo } from "../IronLinkLogo";

function renderLogo(label?: string) {
  return render(
    <ThemeProvider theme={getTheme(ColorScheme.Default)}>
      <IronLinkLogo label={label} />
    </ThemeProvider>,
  );
}

describe("IronLinkLogo", () => {
  it("is hidden from screen readers by default", () => {
    const { container } = renderLogo();
    const svg = container.querySelector("svg");

    expect(svg).toHaveAttribute("aria-hidden", "true");
    expect(svg).not.toHaveAttribute("aria-label");
    expect(screen.queryByRole("img")).toBeNull();
  });

  it("is a named image when given a label", () => {
    renderLogo("Iron Link");

    expect(screen.getByRole("img", { name: "Iron Link" })).toBeInTheDocument();
  });
});
