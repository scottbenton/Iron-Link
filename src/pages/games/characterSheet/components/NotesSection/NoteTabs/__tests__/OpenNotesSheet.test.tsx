import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";

import { TestWrapper } from "tests/TestWrapper";

import { OpenNotesSheet, OpenNotesSheetTab } from "../OpenNotesSheet";

const TABS: OpenNotesSheetTab[] = [
  { id: "a", label: "Session 4", type: "note" },
  { id: "b", label: "Your notes", type: "folder" },
  { id: "c", label: "The Ironlands", type: "world" },
];

function Harness(props: {
  initialTabs?: OpenNotesSheetTab[];
  currentTabId?: string;
  onSelectTab?: (tabId: string) => void;
  onNewNote?: () => void;
  onAllNotes?: () => void;
}) {
  const [tabs, setTabs] = useState(props.initialTabs ?? TABS);
  return (
    <OpenNotesSheet
      open
      onClose={() => {}}
      tabs={tabs}
      currentTabId={props.currentTabId ?? "b"}
      onSelectTab={props.onSelectTab ?? (() => {})}
      onCloseTab={(tabId) =>
        setTabs((current) => current.filter((tab) => tab.id !== tabId))
      }
      onNewNote={props.onNewNote}
      onAllNotes={props.onAllNotes}
    />
  );
}

describe("OpenNotesSheet", () => {
  it("lists the open notes, with focus on the one that is open", () => {
    render(<Harness />, { wrapper: TestWrapper });

    const dialog = screen.getByRole("dialog", { name: "Open notes" });
    const rows = within(dialog).getAllByRole("listitem");
    expect(rows.map((row) => row.textContent)).toEqual([
      "Session 4",
      "Your notes",
      "The Ironlands",
    ]);
    const current = within(dialog).getByRole("button", { name: "Your notes" });
    expect(current).toHaveAttribute("aria-current", "true");
    expect(current).toHaveFocus();
  });

  it("gives each row its own Close button beside it", () => {
    render(<Harness />, { wrapper: TestWrapper });

    const open = screen.getByRole("button", { name: "Session 4" });
    const close = screen.getByRole("button", { name: "Close Session 4" });
    expect(open).not.toContainElement(close);
  });

  it("opens a note from its row", async () => {
    const user = userEvent.setup();
    const onSelectTab = vi.fn();
    render(<Harness onSelectTab={onSelectTab} />, { wrapper: TestWrapper });

    await user.click(screen.getByRole("button", { name: "The Ironlands" }));
    expect(onSelectTab).toHaveBeenCalledWith("c");
  });

  it("closes a note and moves focus to the row that takes its place", async () => {
    const user = userEvent.setup();
    render(<Harness />, { wrapper: TestWrapper });

    await user.click(screen.getByRole("button", { name: "Close Your notes" }));

    expect(
      screen.queryByRole("button", { name: "Your notes" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "The Ironlands" })).toHaveFocus();

    await user.click(
      screen.getByRole("button", { name: "Close The Ironlands" }),
    );
    expect(screen.getByRole("button", { name: "Session 4" })).toHaveFocus();
  });

  it("moves focus to the heading once the last note is closed", async () => {
    const user = userEvent.setup();
    render(<Harness initialTabs={[TABS[0]]} currentTabId="a" />, {
      wrapper: TestWrapper,
    });

    await user.click(screen.getByRole("button", { name: "Close Session 4" }));

    expect(screen.getByRole("heading", { name: "Open notes" })).toHaveFocus();
    expect(screen.getByText("No open notes")).toBeInTheDocument();
  });

  it("offers New note and All notes only where they are given", async () => {
    const user = userEvent.setup();
    const onNewNote = vi.fn();
    const onAllNotes = vi.fn();
    const { unmount } = render(
      <Harness onNewNote={onNewNote} onAllNotes={onAllNotes} />,
      { wrapper: TestWrapper },
    );

    await user.click(screen.getByRole("button", { name: "New note" }));
    await user.click(screen.getByRole("button", { name: "All notes" }));
    expect(onNewNote).toHaveBeenCalledOnce();
    expect(onAllNotes).toHaveBeenCalledOnce();
    unmount();

    render(<Harness />, { wrapper: TestWrapper });
    expect(
      screen.queryByRole("button", { name: "New note" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "All notes" }),
    ).not.toBeInTheDocument();
  });
});
