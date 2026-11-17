import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useAuthStore } from "stores/auth.store";
import { useNotesStore } from "stores/notes.store";

import { TestWrapper } from "tests/TestWrapper";

import type { INoteFolder } from "services/noteFolders.service";
import type { INote } from "services/notes.service";

import { MobileNoteTabsHeader } from "../MobileNoteTabsHeader";
import { useNoteTabLabels } from "../useNoteTabLabels";

vi.mock("lib/supabase.lib", () => ({ supabase: {} }));
// Loaded through the notes store; jsdom cannot load audio.
vi.mock("lib/audio.lib", () => ({}));
vi.mock("pages/games/gamePageLayout/hooks/useGameId", () => ({
  useGameId: () => "game",
}));

function Header() {
  const getTabLabel = useNoteTabLabels();
  return <MobileNoteTabsHeader getTabLabel={getTabLabel} />;
}

function note(id: string, title: string): INote {
  return {
    id,
    title,
    parentFolderId: "folder",
    order: 1,
  } as unknown as INote;
}

beforeEach(() => {
  useAuthStore.setState({ uid: "me" });
  useNotesStore.setState({
    noteState: {
      notes: { one: note("one", "Session 4"), two: note("two", "Leads") },
      permissions: {},
      loading: false,
    },
    folderState: {
      folders: {
        folder: {
          id: "folder",
          name: null,
          creator: "me",
          isRootPlayerFolder: true,
        } as unknown as INoteFolder,
      },
      permissions: {},
      loading: false,
    },
    noteTabItems: {
      a: { type: "note", itemId: "one" },
      b: { type: "folder", itemId: "folder" },
      c: { type: "note", itemId: "two" },
    },
    noteTabOrder: ["a", "b", "c"],
    openTabId: "a",
  });
});

describe("MobileNoteTabsHeader", () => {
  it("shows the open note's name and a count box naming how many are open", () => {
    render(<Header />, { wrapper: TestWrapper });

    expect(screen.getByText("Session 4")).toBeInTheDocument();
    const countBox = screen.getByRole("button", { name: "Open notes, 3" });
    expect(countBox).toHaveAttribute("aria-haspopup", "dialog");
    expect(countBox).toHaveTextContent("3");
  });

  it("lists the open notes, and closing one there closes it", async () => {
    const user = userEvent.setup();
    render(<Header />, { wrapper: TestWrapper });

    await user.click(screen.getByRole("button", { name: "Open notes, 3" }));
    const dialog = screen.getByRole("dialog", { name: "Open notes" });
    expect(
      within(dialog)
        .getAllByRole("listitem")
        .map((row) => row.textContent),
    ).toEqual(["Session 4", expect.any(String), "Leads"]);

    await user.click(
      within(dialog).getByRole("button", { name: "Close Leads" }),
    );
    expect(useNotesStore.getState().noteTabOrder).toEqual(["a", "b"]);
    // Behind the sheet, so hidden from the accessibility tree for now.
    expect(
      screen.getByRole("button", { name: "Open notes, 2", hidden: true }),
    ).toBeInTheDocument();
  });

  it("switches to the note picked in the list", async () => {
    const user = userEvent.setup();
    render(<Header />, { wrapper: TestWrapper });

    await user.click(screen.getByRole("button", { name: "Open notes, 3" }));
    await user.click(screen.getByRole("button", { name: "Leads" }));

    expect(useNotesStore.getState().openTabId).toBe("c");
  });

  it("opens All notes in the tab that already shows them", async () => {
    const user = userEvent.setup();
    render(<Header />, { wrapper: TestWrapper });

    await user.click(screen.getByRole("button", { name: "Open notes, 3" }));
    await user.click(screen.getByRole("button", { name: "All notes" }));

    expect(useNotesStore.getState().openTabId).toBe("b");
    expect(useNotesStore.getState().noteTabOrder).toHaveLength(3);
  });
});
