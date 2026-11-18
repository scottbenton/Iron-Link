import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { TestWrapper } from "tests/TestWrapper";

import { WorldPageLayout } from "../WorldPageLayout";

const layout = vi.hoisted(() => ({
  width: undefined as number | undefined,
  mobile: false,
}));
vi.mock("hooks/useElementWidth", () => ({
  useElementWidth: () => [() => {}, layout.width],
}));
vi.mock("hooks/useIsMobile", () => ({ useIsMobile: () => layout.mobile }));

function renderLayout() {
  return render(
    <WorldPageLayout
      world={<p>World content</p>}
      reference={({ headingId, headingAction, hideHeading }) => (
        <>
          <h2 id={headingId} hidden={hideHeading}>
            Reference
          </h2>
          {headingAction}
          <p>Oracles</p>
        </>
      )}
    />,
    { wrapper: TestWrapper },
  );
}

beforeEach(() => {
  layout.width = 1400;
  layout.mobile = false;
});

describe("WorldPageLayout", () => {
  it("docks Reference beside the world when the page has room", () => {
    renderLayout();
    expect(screen.getByText("World content")).toBeVisible();
    expect(screen.getByText("Oracles")).toBeVisible();
    expect(
      screen.queryByRole("button", { name: "Show Reference" }),
    ).not.toBeInTheDocument();
  });

  it("collapses Reference to a strip that opens it, by the page's width", async () => {
    const user = userEvent.setup();
    layout.width = 900;
    renderLayout();
    const show = screen.getByRole("button", { name: "Show Reference" });
    expect(show).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText("Oracles")).not.toBeVisible();

    await user.click(show);
    expect(show).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("region", { name: "Reference" })).toBeVisible();

    await user.keyboard("{Escape}");
    expect(screen.queryByText("Oracles")).not.toBeVisible();

    await user.click(show);
    await user.click(screen.getByRole("button", { name: "Hide Reference" }));
    expect(screen.queryByText("Oracles")).not.toBeVisible();
    expect(show).toHaveFocus();
  });

  it("gives phones World and Reference tabs", async () => {
    const user = userEvent.setup();
    layout.mobile = true;
    renderLayout();
    expect(screen.getByRole("tab", { name: "World" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByText("World content")).toBeVisible();
    expect(screen.queryByText("Oracles")).not.toBeVisible();

    await user.click(screen.getByRole("tab", { name: "Reference" }));
    expect(screen.getByRole("tabpanel", { name: "Reference" })).toBeVisible();
    expect(screen.queryByText("World content")).not.toBeVisible();
  });
});
