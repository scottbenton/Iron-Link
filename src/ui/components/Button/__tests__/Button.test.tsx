import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Button } from "../Button";

describe("Button", () => {
  it("stays a link when it renders one", () => {
    render(
      <Button nativeButton={false} render={<a href="/games" />}>
        Back to Games
      </Button>,
    );
    expect(screen.getByRole("link", { name: "Back to Games" })).toHaveAttribute(
      "href",
      "/games",
    );
  });

  it("is a button when it renders a non-link element", () => {
    render(
      <Button nativeButton={false} render={<span />}>
        Roll
      </Button>,
    );
    expect(screen.getByRole("button", { name: "Roll" })).toBeInTheDocument();
  });
});
