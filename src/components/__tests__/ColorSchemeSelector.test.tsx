import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ColorScheme } from "repositories/shared.types";

import { ColorSchemeSelector } from "../ColorSchemeSelector";

describe("ColorSchemeSelector", () => {
  it("marks only the chosen scheme as pressed", () => {
    render(
      <ColorSchemeSelector
        selectedColorScheme={ColorScheme.Cinder}
        onChange={() => {}}
      />,
    );

    expect(screen.getByRole("button", { name: "Cinder" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "Mystic" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });
});
