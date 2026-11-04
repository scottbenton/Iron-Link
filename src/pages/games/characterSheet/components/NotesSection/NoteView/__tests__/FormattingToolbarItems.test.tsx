import { fireEvent, render, screen } from "@testing-library/react";
import { TextSelection } from "@tiptap/pm/state";
import { Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { afterEach, describe, expect, it } from "vitest";

import { FormattingToolbarItems } from "../FormattingToolbarItems";

// jsdom lays nothing out; ProseMirror asks for rects when it scrolls.
const noRects = Object.assign([], {
  item: () => null,
}) as unknown as DOMRectList;
Range.prototype.getClientRects = () => noRects;
Range.prototype.getBoundingClientRect = () => new DOMRect();
Element.prototype.getClientRects = () => noRects;

let editor: Editor | undefined;
afterEach(() => {
  editor?.destroy();
  editor = undefined;
});

// An editor holding `content`, with the caret in the text `at`.
function setup(content: string, at: string) {
  editor = new Editor({ extensions: [StarterKit], content });
  const current = editor;
  let position = 0;
  current.state.doc.descendants((node, pos) => {
    if (node.isText && node.text === at) position = pos + 1;
  });
  current.view.dispatch(
    current.state.tr.setSelection(
      TextSelection.create(current.state.doc, position),
    ),
  );
  const view = render(<FormattingToolbarItems editor={current} />);
  return {
    editor: current,
    rerender: () => view.rerender(<FormattingToolbarItems editor={current} />),
  };
}

const LIST = "<ul><li><p>First</p></li><li><p>Second</p></li></ul>";

describe("FormattingToolbarItems indent and outdent", () => {
  it("are disabled outside a list", () => {
    setup("<p>Text</p>", "Text");
    expect(screen.getByRole("button", { name: "Indent" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Outdent" })).toBeDisabled();
  });

  it("can't indent the first item, which has nothing to nest under", () => {
    setup(LIST, "First");
    expect(screen.getByRole("button", { name: "Indent" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Outdent" })).toBeEnabled();
  });

  it("nests a later item under the one before it, and lifts it back", () => {
    const { editor, rerender } = setup(LIST, "Second");

    fireEvent.click(screen.getByRole("button", { name: "Indent" }));
    expect(editor.getHTML()).toBe(
      "<ul><li><p>First</p><ul><li><p>Second</p></li></ul></li></ul>",
    );

    rerender();
    fireEvent.click(screen.getByRole("button", { name: "Outdent" }));
    expect(editor.getHTML()).toBe(LIST);
  });
});
