import { fireEvent, render, screen } from "@testing-library/react";
import type { NodeViewProps } from "@tiptap/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useNotesStore } from "stores/notes.store";

import { TestWrapper } from "tests/TestWrapper";

import type { INote } from "services/notes.service";

import { NoteMention } from "../NoteMention";

vi.mock("lib/supabase.lib", () => ({ supabase: {} }));

const initialNotes = useNotesStore.getState().noteState.notes;
const initialOpenItemTab = useNotesStore.getState().openItemTab;
const openItemTab = vi.fn();

beforeEach(() => {
  useNotesStore.setState((state) => {
    state.openItemTab = openItemTab;
  });
});

afterEach(() => {
  openItemTab.mockReset();
  useNotesStore.setState((state) => {
    state.noteState.notes = initialNotes;
    state.openItemTab = initialOpenItemTab;
  });
});

function setNote(id: string) {
  useNotesStore.setState((state) => {
    state.noteState.notes = {
      [id]: { id, title: "Session one" } as unknown as INote,
    };
  });
}

function renderMention(id = "n1", label = "Session one") {
  const props = {
    node: { attrs: { id, label, kind: "note" } },
  } as unknown as NodeViewProps;
  return render(
    <TestWrapper>
      <NoteMention {...props} />
    </TestWrapper>,
  );
}

describe("NoteMention", () => {
  it("opens the note it names in place of the current tab", () => {
    setNote("n1");
    renderMention();
    fireEvent.click(screen.getByRole("button", { name: "Session one" }));
    expect(openItemTab).toHaveBeenCalledWith({
      type: "note",
      id: "n1",
      replaceCurrent: true,
      openInBackground: false,
    });
  });

  it("opens the note in a background tab with a modifier or middle click", () => {
    setNote("n1");
    renderMention();
    const chip = screen.getByRole("button", { name: "Session one" });

    fireEvent.click(chip, { ctrlKey: true });
    expect(openItemTab).toHaveBeenLastCalledWith(
      expect.objectContaining({
        replaceCurrent: false,
        openInBackground: true,
      }),
    );

    fireEvent.click(chip, { metaKey: true });
    expect(openItemTab).toHaveBeenLastCalledWith(
      expect.objectContaining({
        replaceCurrent: false,
        openInBackground: true,
      }),
    );

    openItemTab.mockClear();
    fireEvent(chip, new MouseEvent("auxclick", { bubbles: true, button: 1 }));
    expect(openItemTab).toHaveBeenCalledWith({
      type: "note",
      id: "n1",
      replaceCurrent: false,
      openInBackground: true,
    });
  });

  it("shows a note that no longer exists, and opens nothing", () => {
    renderMention("gone", "Old note");
    expect(screen.getByText("Old note")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Old note" }),
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByText("Old note"));
    expect(openItemTab).not.toHaveBeenCalled();
  });
});
