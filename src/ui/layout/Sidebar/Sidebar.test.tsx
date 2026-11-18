import { act, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it } from "vitest";

import { Sidebar } from "./Sidebar";

const sections = [
  { id: "overview", title: "Overview", icon: <svg /> },
  { id: "assets", title: "Assets", icon: <svg /> },
];

function Harness() {
  const [section, setSection] = useState("overview");
  const [collapsed, setCollapsed] = useState(true);
  return (
    <div>
      <Sidebar
        collapsed={collapsed}
        onCollapsedChange={setCollapsed}
        resizable={false}
        panels={[
          {
            id: "character",
            title: "Character",
            sections,
            activeSectionId: section,
            onActiveSectionChange: setSection,
            content: <p>Showing {section}</p>,
          },
        ]}
      />
      <button type="button">On the page</button>
    </div>
  );
}

describe("a collapsed sidebar's rail", () => {
  it("shows a section over the page and gives focus back on Escape", () => {
    render(<Harness />);
    const assets = screen.getByRole("button", { name: "Assets" });
    expect(screen.queryByRole("dialog")).toBeNull();

    act(() => assets.focus());
    fireEvent.click(assets);

    const overlay = screen.getByRole("dialog", { name: "Character" });
    expect(overlay).toHaveTextContent("Showing assets");
    expect(assets).toHaveAttribute("aria-expanded", "true");
    expect(document.activeElement).toBe(
      screen.getByRole("heading", { name: "Character" }),
    );
    // Still collapsed: Expand stays in the rail.
    expect(
      screen.getByRole("button", { name: "Expand Sidebar" }),
    ).toBeInTheDocument();

    fireEvent.keyDown(overlay, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(assets);
  });

  it("closes on a press on the page", () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole("button", { name: "Overview" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    fireEvent.pointerDown(screen.getByRole("button", { name: "On the page" }));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("docks the sidebar from the overlay", () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole("button", { name: "Assets" }));
    fireEvent.click(screen.getByRole("button", { name: "Keep Sidebar Open" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.queryByRole("button", { name: "Expand Sidebar" })).toBeNull();
    expect(document.activeElement).toBe(
      screen.getByRole("button", { name: "Collapse Sidebar" }),
    );
    expect(screen.getByText("Showing assets")).toBeVisible();
  });
});

function StackedHarness() {
  const [collapsed, setCollapsed] = useState(true);
  return (
    <Sidebar
      stackPanels
      collapsed={collapsed}
      onCollapsedChange={setCollapsed}
      resizable={false}
      panels={[
        {
          id: "character",
          title: "Character",
          sections,
          content: <p>The sheet</p>,
        },
        {
          id: "reference",
          title: "Reference",
          sections: [{ id: "oracles", title: "Oracles", icon: <svg /> }],
          content: <p>The oracles</p>,
        },
      ]}
    />
  );
}

describe("stacked panels", () => {
  it("collapse to one rail and show only the pressed panel", () => {
    render(<StackedHarness />);
    fireEvent.click(screen.getByRole("button", { name: "Oracles" }));

    const overlay = screen.getByRole("dialog", { name: "Reference" });
    expect(overlay).toHaveTextContent("The oracles");
    expect(screen.getByText("The sheet")).not.toBeVisible();
    expect(document.activeElement).toBe(
      screen.getByRole("heading", { name: "Reference" }),
    );

    fireEvent.click(screen.getByRole("button", { name: "Keep Sidebar Open" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.getByText("The sheet")).toBeVisible();
    expect(screen.getByText("The oracles")).toBeVisible();
    // Collapse sits in the first panel's header only.
    expect(
      screen.getAllByRole("button", { name: "Collapse Sidebar" }),
    ).toHaveLength(1);
    expect(document.activeElement).toBe(
      screen.getByRole("button", { name: "Collapse Sidebar" }),
    );
  });
});
