import { fireEvent, render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";

import { NoteTabs } from "../NoteTabs";

const tabs = [
  { id: "notes-1", label: "Session 4" },
  { id: "log", label: "Game Log", pinned: true, unread: 2 },
];

// jsdom has no layout, so no scrolling the open note into view.
beforeAll(() => {
  Element.prototype.scrollBy ??= () => {};
});

describe("pinned note tabs", () => {
  it("come first, have no close button and ignore Delete", () => {
    const onClose = vi.fn();
    render(
      <NoteTabs
        tabs={tabs}
        value="notes-1"
        onValueChange={() => {}}
        onClose={onClose}
      />,
    );

    const [first, second] = screen.getAllByRole("tab");
    expect(first).toHaveAccessibleName("Game Log, 2 new");
    expect(second).toHaveAccessibleName("Session 4");
    expect(
      screen.queryByRole("button", { name: "Close Game Log" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Close Session 4" }),
    ).toBeInTheDocument();

    fireEvent.keyDown(first, { key: "Delete" });
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.keyDown(second, { key: "Delete" });
    expect(onClose).toHaveBeenCalledWith("notes-1");
  });

  it("drop the unread count while open", () => {
    render(
      <NoteTabs
        tabs={tabs}
        value="log"
        onValueChange={() => {}}
        onClose={() => {}}
      />,
    );
    expect(screen.getAllByRole("tab")[0]).toHaveAccessibleName("Game Log");
  });
});
