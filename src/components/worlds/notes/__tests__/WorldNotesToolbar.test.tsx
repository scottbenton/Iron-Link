import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TextSelection } from "@tiptap/pm/state";
import { Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ExtendedImageExtension } from "components/RichTextEditor/ExtendedImageNode";
import type { SecretsToolbarState } from "components/RichTextEditor/richTextToolbar";

import { TestWrapper } from "tests/TestWrapper";
import { mockWindowWidth } from "tests/mockWindowWidth";

import { MAX_FILE_SIZE } from "repositories/storage.repository";

import { WorldNotesToolbar } from "../WorldNotesToolbar";

vi.mock("lib/supabase.lib", () => ({ supabase: {} }));

// jsdom lays nothing out; ProseMirror asks for rects when it scrolls.
const noRects = Object.assign([], {
  item: () => null,
}) as unknown as DOMRectList;
Range.prototype.getClientRects = () => noRects;
Range.prototype.getBoundingClientRect = () => new DOMRect();
Element.prototype.getClientRects = () => noRects;

let restoreWidth: () => void;
let editor: Editor | undefined;

beforeEach(() => {
  restoreWidth = mockWindowWidth(1280);
});

afterEach(() => {
  editor?.destroy();
  editor = undefined;
  restoreWidth();
});

interface SetupOptions {
  content?: string;
  // The caret goes into this text, or selects all of it with `select`.
  at?: string;
  select?: boolean;
  editable?: boolean;
  secrets?: Partial<SecretsToolbarState>;
  upload?: (file: File) => Promise<string>;
}

function setup(options: SetupOptions = {}) {
  const {
    content = "<p>Text</p>",
    at = "Text",
    select = false,
    editable = true,
    upload = vi.fn(() => Promise.resolve("https://example.com/a.png")),
  } = options;
  editor = new Editor({
    extensions: [StarterKit, ExtendedImageExtension],
    content,
    editable,
  });
  const current = editor;
  let from = 0;
  let to = 0;
  current.state.doc.descendants((node, pos) => {
    if (node.isText && node.text === at) {
      from = pos;
      to = pos + node.nodeSize;
    }
  });
  current.view.dispatch(
    current.state.tr.setSelection(
      TextSelection.create(current.state.doc, from, select ? to : from),
    ),
  );
  const secrets: SecretsToolbarState | undefined = options.secrets && {
    inSecret: false,
    canInsert: false,
    insertSecret: vi.fn(),
    canMakeSecret: false,
    makeSecret: vi.fn(),
    uploadImage: vi.fn(),
    ...options.secrets,
  };
  const ui = () => (
    <TestWrapper>
      <WorldNotesToolbar editor={current} upload={upload} secrets={secrets} />
    </TestWrapper>
  );
  const view = render(ui());
  return {
    ...view,
    editor: current,
    upload,
    secrets,
    // The editor re-renders its toolbar on every transaction.
    rerender: () => view.rerender(ui()),
  };
}

// Picks a text type the way a person would, whatever the control is.
async function chooseTextType(name: string) {
  const user = userEvent.setup();
  await user.click(textTypeButton());
  await user.click(await screen.findByRole("menuitemradio", { name }));
}

// Named for the line's current type, such as "Text type: Heading 1".
function textTypeButton() {
  return screen.getByRole("button", { name: /^Text type: / });
}

function currentTextType() {
  return textTypeButton().textContent;
}

describe("WorldNotesToolbar", () => {
  it("shows nothing to a reader without secrets", () => {
    setup({ editable: false });
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("offers the formatting controls by name", () => {
    setup();
    for (const name of [
      "Bold",
      "Italic",
      "Strikethrough",
      "Bulleted List",
      "Numbered List",
      "Outdent",
      "Indent",
      "Horizontal Line",
      "Quote",
      "Upload Image",
    ]) {
      expect(screen.getByRole("button", { name })).toBeInTheDocument();
    }
  });

  it("marks the formatting the caret is in as pressed", () => {
    setup({ content: "<p><strong>Text</strong></p>" });
    expect(screen.getByRole("button", { name: "Bold" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "Italic" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("applies formatting to the selection", () => {
    const { editor } = setup({ select: true });
    fireEvent.click(screen.getByRole("button", { name: "Bold" }));
    expect(editor.getHTML()).toBe("<p><strong>Text</strong></p>");
  });

  it("turns the line into a quote and adds a rule", () => {
    const { editor, rerender } = setup();
    fireEvent.click(screen.getByRole("button", { name: "Quote" }));
    expect(editor.getHTML()).toBe("<blockquote><p>Text</p></blockquote>");
    rerender();
    fireEvent.click(screen.getByRole("button", { name: "Horizontal Line" }));
    expect(editor.getHTML()).toContain("<hr>");
  });

  it("starts a bulleted and a numbered list", () => {
    const { editor, rerender } = setup();
    fireEvent.click(screen.getByRole("button", { name: "Bulleted List" }));
    expect(editor.getHTML()).toBe("<ul><li><p>Text</p></li></ul>");
    rerender();
    fireEvent.click(screen.getByRole("button", { name: "Numbered List" }));
    expect(editor.getHTML()).toBe("<ol><li><p>Text</p></li></ol>");
  });

  it("shows the line's text type and changes it", async () => {
    const { editor, rerender } = setup({ content: "<h1>Text</h1>" });
    expect(currentTextType()).toBe("Heading 1");

    await chooseTextType("Heading 3");
    expect(editor.getHTML()).toBe("<h3>Text</h3>");

    rerender();
    expect(currentTextType()).toBe("Heading 3");
    await chooseTextType("Normal Text");
    expect(editor.getHTML()).toBe("<p>Text</p>");
  });

  it("uploads a chosen image and puts it in the note", async () => {
    const { editor, upload, container } = setup();
    const input =
      container.querySelector<HTMLInputElement>('input[type="file"]')!;
    expect(input).toHaveAttribute(
      "accept",
      "image/png,image/jpeg,image/gif,image/webp",
    );
    const file = new File(["a"], "a.png", { type: "image/png" });
    await act(async () => {
      fireEvent.change(input, { target: { files: [file] } });
    });
    expect(upload).toHaveBeenCalledWith(file);
    await waitFor(() =>
      expect(editor.getHTML()).toContain('src="https://example.com/a.png"'),
    );
  });

  it("refuses an image over the size limit", async () => {
    const { upload, container } = setup();
    const input =
      container.querySelector<HTMLInputElement>('input[type="file"]')!;
    const file = new File(["a"], "big.png", { type: "image/png" });
    Object.defineProperty(file, "size", { value: MAX_FILE_SIZE + 1 });
    await act(async () => {
      fireEvent.change(input, { target: { files: [file] } });
    });
    expect(upload).not.toHaveBeenCalled();
    expect(await screen.findByText(/File is too large/)).toBeInTheDocument();
  });

  describe("secrets", () => {
    it("offers no secret controls to anyone but a Guide", () => {
      setup();
      expect(
        screen.queryByRole("button", { name: "Insert secret" }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: "Make secret" }),
      ).not.toBeInTheDocument();
    });

    it("inserts a secret block", () => {
      const { secrets } = setup({ secrets: { canInsert: true } });
      const button = screen.getByRole("button", { name: "Insert secret" });
      expect(button).not.toHaveAttribute("aria-pressed");
      fireEvent.click(button);
      expect(secrets!.insertSecret).toHaveBeenCalled();
    });

    it("warns before making the selection a secret", async () => {
      const user = userEvent.setup();
      const { secrets } = setup({ secrets: { canMakeSecret: true } });

      await user.click(screen.getByRole("button", { name: "Make secret" }));
      let dialog = await screen.findByRole("alertdialog");
      expect(
        within(dialog).getByText(/Players may already have seen this/),
      ).toBeInTheDocument();
      await user.click(within(dialog).getByRole("button", { name: "Cancel" }));
      expect(secrets!.makeSecret).not.toHaveBeenCalled();
      await waitFor(() =>
        expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument(),
      );

      await user.click(screen.getByRole("button", { name: "Make secret" }));
      dialog = await screen.findByRole("alertdialog");
      await user.click(
        within(dialog).getByRole("button", { name: "Make secret" }),
      );
      expect(secrets!.makeSecret).toHaveBeenCalledTimes(1);
    });

    it("leaves a reader's formatting out but keeps a Guide's secrets", () => {
      setup({ editable: false, secrets: { canInsert: true } });
      expect(
        screen.queryByRole("button", { name: "Bold" }),
      ).not.toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Insert secret" }),
      ).toBeInTheDocument();
    });
  });
});
