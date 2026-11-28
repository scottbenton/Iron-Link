import { act, render, screen } from "@testing-library/react";
import { Editor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { afterEach, describe, expect, it, vi } from "vitest";

import { TestWrapper } from "tests/TestWrapper";

import { MobileStickyNoteToolbar } from "../MobileStickyToolbar";

vi.mock("lib/supabase.lib", () => ({ supabase: {} }));
vi.mock("ui/hooks/useIsMobile", () => ({ useIsMobile: () => true }));

let editor: Editor | undefined;

afterEach(() => {
  editor?.destroy();
  editor = undefined;
});

function renderToolbar(canEdit = true) {
  editor = new Editor({ extensions: [StarterKit], content: "<p>Notes</p>" });
  const current = editor;
  render(
    <TestWrapper>
      <MobileStickyNoteToolbar
        openNoteId="n1"
        editor={current}
        canEdit={canEdit}
      />
      <EditorContent editor={current} />
    </TestWrapper>,
  );
  return current;
}

describe("MobileStickyNoteToolbar", () => {
  // The notes stay mounted while another section of the phone's game page
  // shows, so the bar must not show just because the note is open.
  it("shows only while the note is being edited", () => {
    const current = renderToolbar();
    expect(
      screen.queryByRole("toolbar", { name: "Formatting" }),
    ).not.toBeInTheDocument();

    act(() => current.view.dom.focus());
    expect(
      screen.getByRole("toolbar", { name: "Formatting" }),
    ).toBeInTheDocument();
  });

  it("isn't there for someone who can't edit the note", () => {
    const current = renderToolbar(false);
    act(() => current.view.dom.focus());
    expect(screen.queryByText("Back to Folder")).not.toBeInTheDocument();
  });
});
