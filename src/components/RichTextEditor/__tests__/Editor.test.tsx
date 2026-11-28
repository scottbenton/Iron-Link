import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Editor as TTEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { TestWrapper } from "tests/TestWrapper";
import { mockWindowWidth } from "tests/mockWindowWidth";

import { Editor, type EditorProps } from "../Editor";
import type { RichTextToolbarProps } from "../richTextToolbar";

// jsdom lays nothing out; ProseMirror asks for rects when it scrolls.
const noRects = Object.assign([], {
  item: () => null,
}) as unknown as DOMRectList;
Range.prototype.getClientRects = () => noRects;
Range.prototype.getBoundingClientRect = () => new DOMRect();
Element.prototype.getClientRects = () => noRects;

let restoreWidth: () => void;
let editor: TTEditor | undefined;

beforeEach(() => {
  restoreWidth = mockWindowWidth(1280);
});

afterEach(() => {
  editor?.destroy();
  editor = undefined;
  restoreWidth();
});

function Toolbar(props: RichTextToolbarProps) {
  return (
    <button type="button" onClick={() => props.editor.commands.toggleBold()}>
      Bold
    </button>
  );
}

function setup(props: Partial<EditorProps> = {}) {
  editor = new TTEditor({
    extensions: [StarterKit],
    content: "<p>Notes</p>",
  });
  const current = editor;
  const ui = (extra: Partial<EditorProps> = {}) => (
    <TestWrapper>
      <Editor
        editor={current}
        editable
        Toolbar={Toolbar}
        {...props}
        {...extra}
      />
    </TestWrapper>
  );
  const view = render(ui());
  return {
    ...view,
    editor: current,
    rerender: (extra: Partial<EditorProps>) => view.rerender(ui(extra)),
  };
}

describe("Editor", () => {
  it("draws its toolbar and its text", () => {
    setup();
    expect(screen.getByRole("button", { name: "Bold" })).toBeInTheDocument();
    expect(screen.getByText("Notes")).toBeInTheDocument();
  });

  it("puts a skip link before the toolbar that moves focus to the text", async () => {
    const { editor } = setup({ label: "Notes" });
    const skip = screen.getByRole("button", { name: "Skip to notes" });
    const bold = screen.getByRole("button", { name: "Bold" });
    expect(
      skip.compareDocumentPosition(bold) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();

    fireEvent.click(skip);
    // Tiptap focuses on the next frame.
    await waitFor(() => expect(editor.isFocused).toBe(true));
  });

  it("offers no skip link without a label or while read only", () => {
    const { rerender } = setup();
    expect(
      screen.queryByRole("button", { name: /Skip to/ }),
    ).not.toBeInTheDocument();
    rerender({ label: "Notes", editable: false });
    expect(
      screen.queryByRole("button", { name: /Skip to/ }),
    ).not.toBeInTheDocument();
  });

  it("shows that it is saving only while it is", () => {
    const { rerender } = setup();
    const idle = screen.queryByText(/^Saving/);
    if (idle) expect(idle).not.toBeVisible();
    rerender({ saving: true });
    expect(screen.getByText(/^Saving/)).toBeVisible();
  });
});
