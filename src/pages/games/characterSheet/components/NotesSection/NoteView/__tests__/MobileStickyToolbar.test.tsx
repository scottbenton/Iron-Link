import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { TestWrapper } from "tests/TestWrapper";

import { MobileStickyNoteToolbar } from "../MobileStickyToolbar";

vi.mock("lib/supabase.lib", () => ({ supabase: {} }));
// Loaded through the notes store; jsdom cannot load audio.
vi.mock("lib/audio.lib", () => ({}));
vi.mock("hooks/useIsMobile", () => ({ useIsMobile: () => true }));

// jsdom lays nothing out; ProseMirror asks for rects when it scrolls.
const noRects = Object.assign([], {
  item: () => null,
}) as unknown as DOMRectList;
Range.prototype.getClientRects = () => noRects;
Range.prototype.getBoundingClientRect = () => new DOMRect();
Element.prototype.getClientRects = () => noRects;

const PERMISSIONS = {
  canEdit: true,
  canDelete: true,
  canChangePermissions: true,
};

let editor: Editor;
let element: HTMLDivElement;
beforeEach(() => {
  element = document.createElement("div");
  document.body.appendChild(element);
  editor = new Editor({
    element,
    extensions: [StarterKit],
    content: "<p>Text</p>",
  });
});
afterEach(() => {
  editor.destroy();
  element.remove();
});

// The visibility check waits a frame after focus leaves.
async function nextFrame() {
  await act(
    () => new Promise((resolve) => requestAnimationFrame(() => resolve(0))),
  );
}

function renderToolbar() {
  render(
    <MobileStickyNoteToolbar
      editor={editor}
      openNoteId={"note"}
      permissions={PERMISSIONS}
    />,
    { wrapper: TestWrapper },
  );
}

describe("MobileStickyNoteToolbar", () => {
  it("shows the Formatting toolbar only while the note is being edited", async () => {
    renderToolbar();
    expect(
      screen.queryByRole("toolbar", { name: "Formatting" }),
    ).not.toBeInTheDocument();

    act(() => {
      editor.view.focus();
    });
    expect(
      screen.getByRole("toolbar", { name: "Formatting" }),
    ).toBeInTheDocument();

    act(() => {
      editor.view.dom.blur();
    });
    await nextFrame();
    expect(
      screen.queryByRole("toolbar", { name: "Formatting" }),
    ).not.toBeInTheDocument();
  });

  it("stops editing on Done editing", async () => {
    const user = userEvent.setup();
    renderToolbar();
    act(() => {
      editor.view.focus();
    });

    await user.click(screen.getByRole("button", { name: "Done editing" }));
    await nextFrame();

    expect(editor.view.dom).not.toHaveFocus();
    expect(
      screen.queryByRole("toolbar", { name: "Formatting" }),
    ).not.toBeInTheDocument();
  });

  it("stops editing on Escape in the text", async () => {
    const user = userEvent.setup();
    renderToolbar();
    act(() => {
      editor.view.focus();
    });

    await user.keyboard("{Escape}");
    await nextFrame();

    expect(editor.view.dom).not.toHaveFocus();
    expect(
      screen.queryByRole("toolbar", { name: "Formatting" }),
    ).not.toBeInTheDocument();
  });

  it("shows nothing for a note the reader cannot edit", () => {
    render(
      <MobileStickyNoteToolbar
        editor={editor}
        openNoteId={"note"}
        permissions={{ ...PERMISSIONS, canEdit: false }}
      />,
      { wrapper: TestWrapper },
    );
    act(() => {
      editor.view.focus();
    });
    expect(
      screen.queryByRole("toolbar", { name: "Formatting" }),
    ).not.toBeInTheDocument();
  });
});
