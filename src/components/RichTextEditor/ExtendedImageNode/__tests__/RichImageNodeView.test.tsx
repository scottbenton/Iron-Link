import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NodeSelection, TextSelection } from "@tiptap/pm/state";
import { Editor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";

import { TestWrapper } from "tests/TestWrapper";

import { ExtendedImageExtension } from "../extension";

vi.mock("lib/supabase.lib", () => ({ supabase: {} }));

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

const IMAGE = '<img src="https://example.com/a.png" alt="A map">';

function imageAttrs() {
  let attrs: Record<string, unknown> = {};
  editor!.state.doc.descendants((node) => {
    if (node.type.name === "image") attrs = node.attrs;
  });
  return attrs;
}

async function setup(options: { editable?: boolean } = {}) {
  const { editable = true } = options;
  editor = new Editor({
    extensions: [StarterKit, ExtendedImageExtension],
    content: `${IMAGE}<p>After</p>`,
    editable,
  });
  const current = editor;
  // The caret starts in the text after the image, leaving it unselected.
  current.view.dispatch(
    current.state.tr.setSelection(TextSelection.atEnd(current.state.doc)),
  );
  render(
    <MemoryRouter>
      <TestWrapper>
        <EditorContent editor={current} />
      </TestWrapper>
    </MemoryRouter>,
  );
  await screen.findByRole("img", { name: "A map" });
  return current;
}

// Selects the image, which shows its controls.
async function selectImage(current: Editor) {
  act(() => {
    current.view.dispatch(
      current.state.tr.setSelection(NodeSelection.create(current.state.doc, 0)),
    );
  });
  return screen.findByRole("button", { name: "Align Left" });
}

describe("RichImageNodeView", () => {
  it("shows the image by its alt text", async () => {
    await setup({ editable: false });
    expect(screen.getByRole("img", { name: "A map" })).toHaveAttribute(
      "src",
      "https://example.com/a.png",
    );
  });

  it("offers no controls to a reader", async () => {
    await setup({ editable: false });
    expect(
      screen.queryByRole("button", { name: "Align Left" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("slider", { name: "Image width" }),
    ).not.toBeInTheDocument();
  });

  it("shows its controls only while selected", async () => {
    const current = await setup();
    expect(
      screen.queryByRole("button", { name: "Align Left" }),
    ).not.toBeInTheDocument();
    await selectImage(current);
    for (const name of [
      "Align Left",
      "Align Center",
      "Align Right",
      "Wrap Text",
      "Break Text",
      "Add or Change Alt Text",
    ]) {
      expect(screen.getByRole("button", { name })).toBeInTheDocument();
    }
  });

  it("marks the current alignment and wrapping, and changes them", async () => {
    const user = userEvent.setup();
    const current = await setup();
    await selectImage(current);
    expect(screen.getByRole("button", { name: "Align Left" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "Break Text" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    await user.click(screen.getByRole("button", { name: "Align Center" }));
    expect(imageAttrs().alignment).toBe("center");
    await user.click(screen.getByRole("button", { name: "Wrap Text" }));
    expect(imageAttrs().textWrapping).toBe("wrap-text");
  });

  it("has a width slider on its moving edge", async () => {
    const current = await setup();
    await selectImage(current);
    const slider = screen.getByRole("slider", { name: "Image width" });
    expect(slider).toHaveAttribute("aria-valuemax", "100");
    expect(slider).toHaveAttribute(
      "aria-valuetext",
      expect.stringMatching(/% of the note's width$/),
    );
  });

  it("edits the alt text, keeping it when cancelled", async () => {
    const user = userEvent.setup();
    const current = await setup();
    await selectImage(current);

    await user.click(
      screen.getByRole("button", { name: "Add or Change Alt Text" }),
    );
    let dialog = await screen.findByRole("dialog", { name: "Alt Text" });
    const field = within(dialog).getByRole("textbox", { name: "Alt Text" });
    expect(field).toHaveValue("A map");
    await user.clear(field);
    await user.type(field, "Cancelled");
    await user.click(within(dialog).getByRole("button", { name: "Cancel" }));
    expect(imageAttrs().altText).toBe("A map");

    await selectImage(current);
    await user.click(
      screen.getByRole("button", { name: "Add or Change Alt Text" }),
    );
    dialog = await screen.findByRole("dialog", { name: "Alt Text" });
    const again = within(dialog).getByRole("textbox", { name: "Alt Text" });
    await user.clear(again);
    await user.type(again, "A river map{Enter}");
    await waitFor(() => expect(imageAttrs().altText).toBe("A river map"));
  });
});
