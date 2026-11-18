import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { ReferenceCategory } from "./ReferenceCategory";

describe("ReferenceCategory", () => {
  it("steps headings down as categories nest, and opens and closes", async () => {
    const user = userEvent.setup();
    render(
      <ReferenceCategory title="Planet Oracles" count={3} defaultOpen>
        <ReferenceCategory title="Desert World" count={2} defaultOpen>
          <ReferenceCategory title="Settlements" count={1}>
            <span>Population</span>
          </ReferenceCategory>
        </ReferenceCategory>
      </ReferenceCategory>,
    );

    expect(
      screen.getByRole("heading", {
        level: 3,
        name: /^Planet Oracles\s*, 3 items$/,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        level: 4,
        name: /^Desert World\s*, 2 items$/,
      }),
    ).toBeInTheDocument();
    const deepest = screen.getByRole("button", {
      name: /^Settlements\s*, 1 item$/,
    });
    expect(deepest.closest("h5")).not.toBeNull();
    expect(deepest).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText("Population")).toBeNull();

    await user.click(deepest);
    expect(deepest).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("Population")).toBeInTheDocument();
  });
});
