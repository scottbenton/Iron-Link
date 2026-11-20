import { act, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it } from "vitest";

import { Sidebar } from "../Sidebar";
import { SidebarHeaderEnd } from "../SidebarHeaderEnd";

const sections = [
  { id: "overview", title: "Overview", icon: <svg /> },
  { id: "assets", title: "Assets", icon: <svg /> },
];

function Harness(props: { initialCollapsed?: boolean; pinnable?: boolean }) {
  const { initialCollapsed = true, pinnable } = props;
  const [section, setSection] = useState("overview");
  const [collapsed, setCollapsed] = useState(initialCollapsed);
  return (
    <div>
      <Sidebar
        pinnable={pinnable}
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

  it("stays on the rail when it can't be pinned, even if left open", () => {
    render(<Harness initialCollapsed={false} pinnable={false} />);
    expect(screen.queryByRole("button", { name: "Expand Sidebar" })).toBeNull();
    expect(screen.queryByText("Showing overview")).not.toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Assets" }));
    const overlay = screen.getByRole("dialog", { name: "Character" });
    expect(overlay).toHaveTextContent("Showing assets");
    expect(
      screen.queryByRole("button", { name: "Keep Sidebar Open" }),
    ).toBeNull();
    expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument();
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

describe("stacked panels with their controls in the content", () => {
  it("drop the visible header but keep the h2 and Collapse", () => {
    render(
      <Sidebar
        stackPanels
        resizable={false}
        panels={[
          {
            id: "character",
            title: "Character",
            content: (
              <div data-testid="character-row">
                <SidebarHeaderEnd />
              </div>
            ),
          },
          {
            id: "reference",
            title: "Reference",
            content: <p>No slot here</p>,
          },
        ]}
      />,
    );
    const row = screen.getByTestId("character-row");
    const collapse = screen.getByRole("button", { name: "Collapse Sidebar" });
    expect(row).toContainElement(collapse);
    // The h2 stays for heading navigation, now screen reader only.
    const heading = screen.getByRole("heading", { name: "Character" });
    expect(heading.parentElement).toHaveAttribute("data-stack-panel");
    // A panel without the slot keeps its header.
    expect(
      screen.getByRole("heading", { name: "Reference" }).parentElement,
    ).not.toHaveAttribute("data-stack-panel");
  });
});

describe("a rail shared by two sidebars", () => {
  function SharedRail(props: { expanded: string[] }) {
    const { expanded } = props;
    const panel = (id: string, title: string, sectionIds: string[]) => ({
      id,
      title,
      sections: sectionIds.map((sectionId) => ({
        id: sectionId,
        title: sectionId,
        icon: <svg />,
      })),
      content: <p>{title} content</p>,
    });
    return (
      <Sidebar
        collapsed
        stackPanels
        resizable={false}
        panels={[
          panel("sheet", "Character", ["Stats"]),
          panel("reference", "Reference", ["Moves", "Oracles"]),
        ]}
        railGroups={[
          {
            label: "Character",
            panelIds: ["sheet"],
            expandLabel: "Expand Character",
            onExpand: () => expanded.push("sheet"),
          },
          {
            label: "Reference",
            panelIds: ["reference"],
            expandLabel: "Expand Reference",
            onExpand: () => expanded.push("reference"),
          },
        ]}
      />
    );
  }

  it("groups each sidebar's Expand with its own sections", () => {
    const expanded: string[] = [];
    render(<SharedRail expanded={expanded} />);
    const reference = screen.getByRole("group", { name: "Reference" });
    expect(reference).toContainElement(
      screen.getByRole("button", { name: "Expand Reference" }),
    );
    expect(reference).toContainElement(
      screen.getByRole("button", { name: "Moves" }),
    );
    expect(
      screen.getByRole("group", { name: "Character" }),
    ).not.toContainElement(screen.getByRole("button", { name: "Moves" }));

    fireEvent.click(screen.getByRole("button", { name: "Expand Reference" }));
    expect(expanded).toEqual(["reference"]);
  });

  it("opens the peeked panel's own sidebar when kept open", () => {
    const expanded: string[] = [];
    render(<SharedRail expanded={expanded} />);
    fireEvent.click(screen.getByRole("button", { name: "Oracles" }));
    fireEvent.click(screen.getByRole("button", { name: /^Keep .* Open$/ }));
    expect(expanded).toEqual(["reference"]);
  });
});
